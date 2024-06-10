import { Subject, filter, map } from "rxjs";
import { useEffect, useState } from "react";

import { createTableKeyMethods } from "@/tables";
import type { BaseTable, BaseTableMetadata, Properties, PropertiesSansMetadata, TableMethods } from "@/tables";
import { createTableWatcher, type TableWatcherOptions, type TableWatcherParams, type TableUpdate } from "@/queries";
import {
  defaultRecord,
  queries,
  tableOperations,
  type Record,
  type Schema,
  type TableMutationOptions,
  type World,
} from "@/lib";
const { runQuery, defineQuery, useRecordQuery, With, WithProperties, WithoutProperties } = queries();
const {
  setRecord,
  removeRecord,
  updateRecord,
  getRecordProperties,
  hasRecord,
  isTableUpdate: _isTableUpdate,
} = tableOperations();

/* -------------------------------------------------------------------------- */
/*                               ATTACH METHODS                               */
/* -------------------------------------------------------------------------- */

export const createTableMethods = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
  world: World,
  table: BaseTable<PS, M, T>,
): TableMethods<PS, M, T> => {
  const paused: Map<Record, boolean> = new Map();
  const blocked: Map<Record, boolean> = new Map();
  const pendingUpdate: Map<Record, TableUpdate<PS, M, T>> = new Map();

  // Update event stream that takes into account overridden record values
  const update$ = new Subject<TableUpdate<PS, M, T>>();

  /* --------------------------------- STREAMS -------------------------------- */
  // Pause updates for a record (don't react to changes in hooks, e.g. useProperties)
  const pauseUpdates = (
    record?: Record,
    properties?: Properties<PS, T>,
    options: TableMutationOptions = { skipUpdateStream: false },
  ) => {
    record = record ?? defaultRecord;

    paused.set(record, true);
    if (properties) setRecord(table, record, properties, options);
  };

  // Enable updates for a record (react again to changes in the store, e.g. useProperties)
  // If any update happened during the pause, the state will be updated to the latest properties
  const resumeUpdates = (record?: Record, options: TableMutationOptions = { skipUpdateStream: false }) => {
    record = record ?? defaultRecord;

    if (!paused.get(record)) return;
    paused.set(record, false);

    const update = pendingUpdate.get(record);
    if (!update) return;

    if (update.properties.prev) setRecord(table, record, update.properties.prev, { skipUpdateStream: true });
    if (update.properties.current) setRecord(table, record, update.properties.current, options);
    else removeRecord(table, record);

    pendingUpdate.delete(record);
  };

  // Block updates for a record
  const blockUpdates = (record?: Record) => {
    blocked.set(record ?? defaultRecord, true);
  };

  // Unblock updates for a record
  const unblockUpdates = (record?: Record) => {
    blocked.set(record ?? defaultRecord, false);
  };

  // Channel through update events from the original component if there are no overrides
  table.update$
    .pipe(
      filter((e) => !paused.get(e.record)),
      map((update) => ({ ...update, table })),
    )
    .subscribe(update$);

  table.update$
    .pipe(
      filter((e) => !!paused.get(e.record)),
      map((update) => {
        pendingUpdate.set(update.record, update);
      }),
    )
    .subscribe();

  /* ----------------------------------- SET ---------------------------------- */
  // Set the properties for a record
  const set = (properties: Properties<PS, T>, record?: Record, options?: TableMutationOptions) => {
    record = record ?? defaultRecord;

    if (blocked.get(record)) return;
    if (paused.get(record)) {
      const prevProperties = pendingUpdate.get(record)?.properties.current ?? getRecordProperties(table, record);
      pendingUpdate.set(record, {
        record,
        properties: { current: properties, prev: prevProperties },
        table,
        type: prevProperties ? "change" : "enter",
      });
    } else {
      setRecord(table, record, properties, options);
    }
  };

  /* ----------------------------------- GET ---------------------------------- */
  // Get the properties for a record
  function get(): Properties<PS, T> | undefined;
  function get(record: Record | undefined): Properties<PS, T> | undefined;
  function get(record?: Record | undefined, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;
  function get(record?: Record, defaultProperties?: PropertiesSansMetadata<PS, T>) {
    record = record ?? defaultRecord;
    return getRecordProperties(table, record) ?? defaultProperties;
  }

  /* --------------------------------- QUERIES -------------------------------- */
  // Get all records inside the table
  const getAll = () => {
    const records = runQuery([With(table)]);
    return [...records];
  };

  // Get all records with specific properties
  const getAllWith = (properties: Partial<Properties<PS, T>>) => {
    const records = runQuery([WithProperties(table, properties)]);
    return [...records];
  };

  // Get all records without specific properties
  const getAllWithout = (properties: Partial<Properties<PS, T>>) => {
    const records = runQuery([With(table), WithoutProperties(table, properties)]);
    return [...records];
  };

  /* ---------------------------------- HOOKS --------------------------------- */
  // Hook to get all records inside the table
  function useAll() {
    const records = useRecordQuery([With(table)]);
    return [...records];
  }

  // Hook to get all records with specific properties
  const useAllWith = (properties: Partial<Properties<PS, T>>) => {
    const records = useRecordQuery([WithProperties(table, properties)]);
    return [...records];
  };

  // Hook to get all records without specific properties
  const useAllWithout = (properties: Partial<Properties<PS, T>>) => {
    const records = useRecordQuery([With(table), WithoutProperties(table, properties)]);
    return [...records];
  };

  /* --------------------------------- REMOVE --------------------------------- */
  // Remove a record from the table (delete its properties)
  const remove = (record?: Record) => {
    record = record ?? defaultRecord;
    removeRecord(table, record);
  };

  /* ---------------------------------- CLEAR --------------------------------- */
  // Clear the table (remove all records)
  const clear = () => {
    for (const record of runQuery([With(table)])) {
      removeRecord(table, record);
    }
  };

  /* --------------------------------- UPDATE --------------------------------- */
  // Update the properties for a record, possibly with partial properties
  const update = (properties: Partial<Properties<PS, T>>, record?: Record, options?: TableMutationOptions) => {
    record = record ?? defaultRecord;
    updateRecord(table, record, properties, undefined, options);
  };

  /* ----------------------------------- HAS ---------------------------------- */
  // Check if a record exists in the table
  const has = (record?: Record) => {
    if (!record) return false;
    return hasRecord(table, record);
  };

  const isTableUpdate = (update: TableUpdate<PS, M, T>): update is TableUpdate<PS, M, T> => {
    return _isTableUpdate(update, table);
  };

  /* ----------------------------- USE PROPERTIES ----------------------------- */
  // Hook to get the properties for a record in real-time
  function useProperties(record?: Record | undefined): Properties<PS, T> | undefined;
  function useProperties(
    record: Record | undefined,
    defaultProperties?: PropertiesSansMetadata<PS, T>,
  ): Properties<PS, T>;
  function useProperties(record?: Record, defaultProperties?: PropertiesSansMetadata<PS, T>) {
    record = record ?? defaultRecord;
    const [properties, setProperties] = useState<Properties<PS, T> | PropertiesSansMetadata<PS, T> | undefined>(
      defaultProperties,
    );

    useEffect(() => {
      setProperties(getRecordProperties(table, record));

      // fix: if pre-populated with state, useComponentValue doesn’t update when there’s a component that has been removed.
      const queryResult = defineQuery([With(table)], { runOnInit: true });
      const subscription = queryResult.update$.subscribe((_update) => {
        const update = _update as TableUpdate<PS, M, T>;
        if (isTableUpdate(update) && update.record === record) {
          const { current: nextProperties } = update.properties;
          setProperties(nextProperties);
        }
      });

      return () => subscription.unsubscribe();
    }, [table, record]);

    return properties ?? defaultProperties;
  }

  /* ---------------------------------- WATCH --------------------------------- */
  // Create a query tied to this table, with callbacks on change, enter & exit from the query conditions
  // or if no query, on any change in the table
  const watch = (options: Omit<TableWatcherOptions<PS, M, T>, "world" | "table">, params?: TableWatcherParams) =>
    createTableWatcher({ world, table, ...options }, params);

  // Base methods available to all tables
  const baseMethods = {
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
    blockUpdates,
    unblockUpdates,
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

  return {
    ...methods,
    ...createTableKeyMethods({ ...methods, table }),
  };
};
