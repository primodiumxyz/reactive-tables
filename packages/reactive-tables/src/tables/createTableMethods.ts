import { useEffect, useState } from "react";

import { type Primitive, TinyBaseAdapter, type TinyBaseFormattedType } from "@/adapter";
import { createTableKeyMethods, type ContractTableMetadata } from "@/tables/contract";
import type { LocalTableMetadata } from "@/tables/local";
import type { Properties, PropertiesSansMetadata, CreateTableMethodsOptions } from "@/tables";
import {
  type CreateTableWatcherOptions,
  createTableWatcher,
  queryAllWithProperties,
  queryAllWithoutProperties,
  type TableWatcherParams,
  type TinyQLQueryKeywords,
  useAllWithProperties,
  useAllWithoutProperties,
} from "@/queries";
import {
  arrayToIterator,
  createTableMethodsUtils,
  default$Record,
  type Metadata,
  type $Record,
  type Schema,
  uuid,
} from "@/lib";

const inContractTableMetadata = <S extends Schema, M extends Metadata>(
  metadata: LocalTableMetadata<S, M> | ContractTableMetadata<S, M>,
): metadata is ContractTableMetadata<S, M> => "keySchema" in metadata;

export const createTableMethods = <
  S extends Schema,
  M extends Metadata,
  metadata extends LocalTableMetadata<S, M> | ContractTableMetadata<S, M>,
  T = unknown,
>({
  store,
  queries,
  metadata,
}: CreateTableMethodsOptions<S, M, metadata>) => {
  const { tableId, schema } = metadata;
  const { paused } = createTableMethodsUtils(store, tableId);

  // Native RECS $records iterator
  const $records = () => arrayToIterator(store.getRowIds(tableId) as $Record[]);

  /* --------------------------------- STREAMS -------------------------------- */
  // Pause updates for a record (don't react to changes in hooks, e.g. useProperties)
  const pauseUpdates = ($record?: $Record, properties?: Properties<S, T>) => {
    $record = $record ?? default$Record;

    paused.set($record, true);
    if (properties) set(properties, $record);
  };

  // Enable updates for a record (react again to changes in the store, e.g. useProperties)
  // If any update happened during the pause, the state will be updated to the latest properties
  const resumeUpdates = ($record?: $Record) => {
    $record = $record ?? default$Record;

    if (!paused.get($record)) return;
    paused.set($record, false);
  };

  /* ----------------------------------- SET ---------------------------------- */
  // Set the properties for a record
  const set = (properties: Properties<S, T>, $record?: $Record) => {
    $record = $record ?? default$Record;

    // Encode the properties and set them in the store
    const formattedProperties = TinyBaseAdapter.encode(properties as Record<string, Primitive>);
    store.setRow(tableId, $record, formattedProperties);
  };

  // Utility function to save on computation when we want to set the formatted data directly
  const setRaw = (properties: TinyBaseFormattedType, $record: $Record) => {
    $record = $record ?? default$Record;
    store.setRow(tableId, $record, properties);
  };

  /* ----------------------------------- GET ---------------------------------- */
  // Get the properties for a record
  function get(): Properties<S, T> | undefined;
  function get($record: $Record | undefined): Properties<S, T> | undefined;
  function get($record?: $Record | undefined, defaultProperties?: PropertiesSansMetadata<S, T>): Properties<S, T>;
  function get($record?: $Record, defaultProperties?: PropertiesSansMetadata<S, T>) {
    $record = $record ?? default$Record;
    const row = store.getRow(tableId, $record);

    const decoded = Object.entries(row).length > 0 ? TinyBaseAdapter.decode(row) : undefined; // empty object should be undefined
    return (decoded ?? defaultProperties) as Properties<S, T>;
  }

  // Utility function to save on computation when we're only interested in the raw data (to set again directly)
  const getRaw = ($record: $Record) => {
    const row = store.getRow(tableId, $record);
    return Object.entries(row).length > 0 ? row : undefined;
  };

  /* --------------------------------- QUERIES -------------------------------- */
  // Get all records inside the table
  const getAll = () => {
    return store.getRowIds(tableId) as $Record[];
  };

  // Get all records with specific properties
  const getAllWith = (properties: Partial<Properties<S, T>>) => {
    return queryAllWithProperties({ queries, tableId, properties }).$records;
  };

  // Get all records without specific properties
  const getAllWithout = (properties: Partial<Properties<S, T>>) => {
    return queryAllWithoutProperties({ queries, tableId, properties }).$records;
  };

  /* ---------------------------------- HOOKS --------------------------------- */
  // Hook to get all records inside the table
  function useAll() {
    const [$records, set$Records] = useState<$Record[]>(getAll());

    useEffect(() => {
      // Whenever a record is added or removed (row ids changed), update the state
      const subId = store.addRowIdsListener(tableId, () => {
        set$Records(getAll());
      });

      return () => {
        store.delListener(subId);
      };
    }, []);

    return $records;
  }

  // Hook to get all records with specific properties
  const useAllWith = (properties: Partial<Properties<S, T>>) => {
    return useAllWithProperties(queries, tableId, properties);
  };

  // Hook to get all records without specific properties
  const useAllWithout = (properties: Partial<Properties<S, T>>) => {
    return useAllWithoutProperties(queries, tableId, properties);
  };

  /* ---------------------------------- CLEAR --------------------------------- */
  // Clear the table (remove all records)
  const clear = () => {
    store.delTable(tableId);
  };

  /* --------------------------------- REMOVE --------------------------------- */
  // Remove a record from the table (delete its properties)
  const remove = ($record?: $Record) => {
    $record = $record ?? default$Record;
    store.delRow(tableId, $record);
  };

  /* --------------------------------- UPDATE --------------------------------- */
  // Update the properties for a record, possibly with partial properties
  const update = (properties: Partial<Properties<S, T>>, $record?: $Record) => {
    $record = $record ?? default$Record;
    const currentProperties = getRaw($record);
    if (!currentProperties) throw new Error(`$Record ${$record} does not exist in table ${tableId}`);

    const newProperties = TinyBaseAdapter.encode(properties as Record<string, Primitive>);
    setRaw({ ...currentProperties, ...newProperties }, $record);
  };

  /* ----------------------------------- HAS ---------------------------------- */
  // Check if a record exists in the table
  const has = ($record?: $Record) => {
    if (!$record) return false;
    return store.hasRow(tableId, $record);
  };

  /* ----------------------------- USE PROPERTIES ----------------------------- */
  // Hook to get the properties for a record in real-time
  function useProperties($record?: $Record | undefined): Properties<S, T> | undefined;
  function useProperties(
    $record: $Record | undefined,
    defaultProperties?: PropertiesSansMetadata<S, T>,
  ): Properties<S, T>;
  function useProperties($record?: $Record, defaultProperties?: PropertiesSansMetadata<S, T>) {
    $record = $record ?? default$Record;
    const [properties, setProperties] = useState(get($record));

    useEffect(() => {
      // properties just changed for this record, update state to latest properties
      // (just make sure this one is not paused)
      if (!paused.get($record)) {
        setProperties(get($record));
      }

      // Update state when the properties for this $record changes
      const propertiesSubId = store.addRowListener(tableId, $record, () => {
        // only if it's not paused
        if (!paused.get($record)) {
          setProperties(get($record));
        }
      });

      // Update state when updates are unpaused
      const pausedSubId = store.addValueListener(`paused__${tableId}__${$record}`, (_, __, newPaused) => {
        // Meaning updates are being resumed
        if (!newPaused) {
          setProperties(get($record));
        }
      });

      return () => {
        store.delListener(propertiesSubId);
        store.delListener(pausedSubId);
      };
    }, [$record, paused]);

    return properties ?? defaultProperties;
  }

  /* ---------------------------------- QUERY --------------------------------- */
  // Query the table using TinyQL syntax
  const query = (definition: (keywords: TinyQLQueryKeywords) => void) => {
    // Add a `select` on top of the query to abstract selecting at least a cell from the properties => selecting all $records
    // This is required with TinyQL to at least select a cell so it considers all rows
    const abstractedQuery = (keywords: TinyQLQueryKeywords) => {
      keywords.select(Object.keys(schema)[0]);
      definition(keywords);
    };

    // Define and run the query
    const queryId = uuid();
    queries.setQueryDefinition(queryId, tableId, abstractedQuery);
    const result = queries.getResultRowIds(queryId);

    queries.delQueryDefinition(queryId);
    return result as $Record[];
  };

  /* ---------------------------------- WATCH --------------------------------- */
  // Create a query tied to this table, with callbacks on change, enter & exit from the query conditions
  // or if no query, on any change in the table
  const watch = (
    options: Omit<CreateTableWatcherOptions<S, T>, "queries" | "tableId" | "schema">,
    params?: TableWatcherParams,
  ) => {
    // Same abstraction as in `query` to select all $records
    const query: CreateTableWatcherOptions<S, T>["query"] = options.query
      ? (keywords) => {
          keywords.select(Object.keys(schema)[0]);
          options.query!(keywords);
        }
      : undefined;

    return createTableWatcher(
      {
        queries,
        tableId,
        schema,
        ...options,
        query,
      },
      params,
    );
  };

  // Base methods available to all tables
  const baseMethods = {
    $records,
    get,
    set,
    getAll,
    getAllWith,
    getAllWithout,
    remove,
    clear,
    update,
    has,
    pauseUpdates,
    resumeUpdates,
    query,
    watch,
  };

  // Add hooks only if not in a node environment
  const hookMethods = { useAll, useAllWith, useAllWithout, use: useProperties };
  if (typeof window === "undefined") {
    Object.keys(hookMethods).forEach((key) => {
      hookMethods[key as keyof typeof hookMethods] = () => {
        throw new Error(`The method ${key} is only available in the browser`);
      };
    });
  }

  const methods = {
    ...baseMethods,
    ...hookMethods,
  };
  // If it's a local table, no need for contract methods
  if (!inContractTableMetadata(metadata)) return methods;

  return {
    ...methods,
    ...createTableKeyMethods({ ...methods, keySchema: metadata.keySchema }),
  };
};
