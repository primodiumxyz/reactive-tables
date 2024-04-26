import { useEffect, useState } from "react";

import {
  CreateQueryWrapperOptions,
  createTableWatcher,
  queryAllWithProps,
  queryAllWithoutProps,
  useAllWithProps,
  useAllWithoutProps,
} from "@/queries";
import { Primitive, TinyBaseAdapter, TinyBaseFormattedType } from "@/adapter";
import { createTableKeyMethods } from "@/tables/contract";
import { ContractTableMetadata } from "@/tables/contract/types";
import { LocalTableMetadata } from "@/tables/local/types";
import { Properties, PropertiesSansMetadata, CreateTableMethodsOptions } from "@/tables/types";
import { arrayToIterator, createTableMethodsUtils, Metadata, $Record, Schema, default$Record } from "@/lib";

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
  // Pause updates for an record (don't react to changes in the store)
  const pauseUpdates = ($record?: $Record, properties?: Properties<S, T>) => {
    $record = $record ?? default$Record;

    paused.set($record, true);
    if (properties) set(properties, $record);
  };

  // Enable updates for an record (react to changes in the store, e.g. useproperties)
  const resumeUpdates = ($record?: $Record) => {
    $record = $record ?? default$Record;

    if (!paused.get($record)) return;
    paused.set($record, false);
  };

  /* ----------------------------------- SET ---------------------------------- */
  const set = (properties: Properties<S, T>, $record?: $Record) => {
    $record = $record ?? default$Record;

    // Encode the properties and set them in the store
    const formattedProps = TinyBaseAdapter.encode(properties as Record<string, Primitive>);
    store.setRow(tableId, $record, formattedProps);
  };

  // Utility function to save on computation when we want to set the formatted data directly
  const setRaw = (properties: TinyBaseFormattedType, $record: $Record) => {
    $record = $record ?? default$Record;
    store.setRow(tableId, $record, properties);
  };

  /* ----------------------------------- GET ---------------------------------- */
  function get(): Properties<S, T> | undefined;
  function get($record: $Record | undefined): Properties<S, T> | undefined;
  function get($record?: $Record | undefined, defaultProps?: PropertiesSansMetadata<S, T>): Properties<S, T>;
  function get($record?: $Record, defaultProps?: PropertiesSansMetadata<S, T>) {
    $record = $record ?? default$Record;
    const row = store.getRow(tableId, $record);

    const decoded = Object.entries(row).length > 0 ? TinyBaseAdapter.decode(row) : undefined; // empty object should be undefined
    return (decoded ?? defaultProps) as Properties<S, T>;
  }
  // Utility function to save on computation when we're only interested in the raw data (to set again directly)
  const getRaw = ($record: $Record) => {
    const row = store.getRow(tableId, $record);
    return Object.entries(row).length > 0 ? row : undefined;
  };

  /* --------------------------------- QUERIES -------------------------------- */
  const getAll = () => {
    return store.getRowIds(tableId) as $Record[];
  };

  const getAllWith = (properties: Partial<Properties<S, T>>) => {
    return queryAllWithProps({ queries, tableId, properties }).$records;
  };

  const getAllWithout = (properties: Partial<Properties<S, T>>) => {
    return queryAllWithoutProps({ queries, tableId, properties }).$records;
  };

  /* ---------------------------------- HOOKS --------------------------------- */
  function useAll() {
    const [$records, set$Records] = useState<$Record[]>(getAll());

    useEffect(() => {
      // Whenever an record is added or removed (row ids changed), update the state
      const subId = store.addRowIdsListener(tableId, () => {
        set$Records(getAll());
      });

      return () => {
        store.delListener(subId);
      };
    }, []);

    return $records;
  }

  const useAllWith = (properties: Partial<Properties<S, T>>) => {
    return useAllWithProps(queries, tableId, properties);
  };

  const useAllWithout = (properties: Partial<Properties<S, T>>) => {
    return useAllWithoutProps(queries, tableId, properties);
  };

  /* ---------------------------------- CLEAR --------------------------------- */
  const clear = () => {
    store.delTable(tableId);
  };

  /* --------------------------------- REMOVE --------------------------------- */
  const remove = ($record?: $Record) => {
    $record = $record ?? default$Record;
    store.delRow(tableId, $record);
  };

  /* --------------------------------- UPDATE --------------------------------- */
  const update = (properties: Partial<Properties<S, T>>, $record?: $Record) => {
    $record = $record ?? default$Record;
    const currentProps = getRaw($record);
    if (!currentProps) throw new Error(`$Record ${$record} does not exist in table ${tableId}`);

    const newProps = TinyBaseAdapter.encode(properties as Record<string, Primitive>);
    setRaw({ ...currentProps, ...newProps }, $record);
  };

  /* ----------------------------------- HAS ---------------------------------- */
  const has = ($record?: $Record) => {
    if (!$record) return false;
    return store.hasRow(tableId, $record);
  };

  /* -------------------------------- USE PROPS ------------------------------- */
  function useProps($record?: $Record | undefined): Properties<S, T> | undefined;
  function useProps($record: $Record | undefined, defaultProps?: PropertiesSansMetadata<S, T>): Properties<S, T>;
  function useProps($record?: $Record, defaultProps?: PropertiesSansMetadata<S, T>) {
    $record = $record ?? default$Record;
    const [properties, setProps] = useState(get($record));

    useEffect(() => {
      // properties just changed for this record, update state to latest properties
      // (just make sure this one is not paused)
      if (!paused.get($record)) {
        setProps(get($record));
      }

      // Update state when the properties for this $record changes
      const propsSubId = store.addRowListener(tableId, $record, () => {
        // only if it's not paused
        if (!paused.get($record)) {
          setProps(get($record));
        }
      });

      // Update state when updates are unpaused
      const pausedSubId = store.addValueListener(`paused__${tableId}__${$record}`, (_, __, newPaused) => {
        // Meaning updates are being resumed
        if (!newPaused) {
          setProps(get($record));
        }
      });

      return () => {
        store.delListener(propsSubId);
        store.delListener(pausedSubId);
      };
    }, [$record, paused]);

    return properties ?? defaultProps;
  }

  /* --------------------------------- SYSTEM --------------------------------- */
  // Create a query tied to this table, with callbacks on change, enter & exit from the query conditions
  // or if no query, on any change in the table
  const watch = (options: Omit<CreateQueryWrapperOptions<S, T>, "queries" | "tableId" | "schema">) => {
    // Add a `select` on top of the query to abstract selecting at least a cell from the properties => selecting all $records
    // This is required with TinyQL to at least select a cell so it considers all rows
    const query: CreateQueryWrapperOptions<S, T>["query"] = options.query
      ? (keywords) => {
          keywords.select(Object.keys(schema)[0]);
          options.query!(keywords);
        }
      : undefined;

    return createTableWatcher({
      queries,
      tableId,
      schema,
      ...options,
      query,
    });
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
    watch,
  };

  // Add hooks only if not in a node environment
  const hookMethods = { useAll, useAllWith, useAllWithout, use: useProps };
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
