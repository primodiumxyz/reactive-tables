import { map, pipe } from "rxjs";
import isEqual from "fast-deep-equal";

import type { BaseTableMetadata, IndexedBaseTable, Properties, BaseTable } from "@/tables";
import type { TableUpdate } from "@/queries";
import { OptionalTypes, getRecordSymbol, type Record, type Schema } from "@/lib";

export type TableMutationOptions = {
  skipUpdateStream?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTableName(table: BaseTable<any, any, any>) {
  return (
    table.metadata?.name ??
    table.metadata?.globalName ??
    table.metadata?.tableId ??
    table.metadata?.contractId ??
    table.id
  );
}

export const tableOperations = () => {
  /**
   * Set the properties for a given record in a given table.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable BaseTable} to be updated.
   * @param record {@link Record} whose properties in the given table should be set.
   * @param properties Properties to set, schema must match the table schema.
   *
   * @example
   * ```
   * tables.setRecord(Position, record, { x: 1, y: 2 });
   * ```
   */
  const setRecord = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
    table: BaseTable<PS, M, T>,
    record: Record,
    properties: Properties<PS, T>,
    options: TableMutationOptions = {},
  ) => {
    const recordSymbol = getRecordSymbol(record);
    const prevProperties = getRecordProperties(table, record);

    for (const [key, val] of Object.entries(properties)) {
      if (table.properties[key]) {
        table.properties[key].set(recordSymbol, val);
      } else {
        const isTableFieldIndex = table.metadata?.tableId && /^\d+$/.test(key);
        if (!isTableFieldIndex) {
          // If this key looks like a field index from `defineStoreComponents`,
          // we can ignore this properties without logging anything.
          // Otherwise, we should let the user know we found undefined data.
          console.warn(
            "Table definition for",
            getTableName(table),
            "is missing key",
            key,
            ", ignoring properties",
            val,
            "for record",
            record,
            ". Existing keys: ",
            Object.keys(table.properties),
          );
        }
      }
    }

    if (!options.skipUpdateStream) {
      table.update$.next({
        record,
        properties: { current: properties, prev: prevProperties },
        table,
        type: prevProperties ? (prevProperties === properties ? "noop" : "change") : "enter",
      });
    }
  };

  /**
   * Update the properties for a given record in a given table while keeping the old properties of keys not included in the update.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable BaseTable} to be updated.
   * @param record {@link Record} whose properties in the given table should be updated.
   * @param properties Partial properties to be set, remaining keys will be taken from the existing table properties.
   *
   * @remarks
   * This function fails silently during runtime if partial properties are set for an record that
   * does not have properties yet, since then partial properties will be set in the table for this record.
   *
   * @example
   * ```
   * tables.updateRecord(Position, record, { x: 1 });
   * ```
   */
  const updateRecord = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
    table: BaseTable<PS, M, T>,
    record: Record,
    properties: Partial<Properties<PS, T>>,
    initialProperties?: Properties<PS, T>,
    options: TableMutationOptions = {},
  ) => {
    const currentProperties = getRecordProperties(table, record);
    if (currentProperties === undefined) {
      if (initialProperties === undefined) {
        throw new Error(`Can't update table ${getTableName(table)} without current or initial properties`);
      }

      setRecord(table, record, { ...initialProperties, ...properties }, options);
    } else {
      setRecord(table, record, { ...currentProperties, ...properties }, options);
    }
  };

  /**
   * Remove a given record from a given table.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable BaseTable} to be updated.
   * @param record {@link Record} whose properties should be removed from this table.
   */
  const removeRecord = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
    table: BaseTable<PS, M, T>,
    record: Record,
    options: TableMutationOptions = {},
  ) => {
    const recordSymbol = getRecordSymbol(record);
    const prevProperties = getRecordProperties(table, record);

    for (const key of Object.keys(table.properties)) {
      table.properties[key].delete(recordSymbol);
    }

    if (!options.skipUpdateStream) {
      table.update$.next({
        record,
        properties: { current: undefined, prev: prevProperties },
        table,
        type: prevProperties ? "exit" : "noop",
      });
    }
  };

  /**
   * Check whether a table contains properties for a given record.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable Table} to check whether it has properties for the given record.
   * @param record {@link Record} to check whether it has properties in the given table.
   * @returns true if the table contains properties for the given record, else false.
   */
  const hasRecord = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
    table: BaseTable<PS, M, T>,
    record: Record,
  ): boolean => {
    const recordSymbol = getRecordSymbol(record);
    const map = Object.values(table.properties)[0];
    return map.has(recordSymbol);
  };

  /**
   * Get the properties of a given record in the given table.
   * Returns undefined if no properties or only partial properties are found.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable Table} to get the properties from for the given record.
   * @param record {@link Record} to get the properties for from the given table.
   * @returns Properties of the given record in the given table or undefined if no properties exists.
   */
  const getRecordProperties = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
    table: BaseTable<PS, M, T>,
    record: Record,
  ): Properties<PS, T> | undefined => {
    const properties: Record<string, unknown> = {};
    const recordSymbol = getRecordSymbol(record);

    // Get the properties of each schema key
    const schemaKeys = Object.keys(table.propertiesSchema);
    for (const key of schemaKeys) {
      const val = table.properties[key].get(recordSymbol);
      if (val === undefined && !OptionalTypes.includes(table.propertiesSchema[key])) return undefined;
      properties[key] = val;
    }

    return properties as Properties<PS, T>;
  };

  /**
   * Get the properties of a given record in the given table.
   * Throws an error if no properties exists for the given record in the given table.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable Table} to get the properties from for the given record.
   * @param record {@link Record} to get the properties for from the given table.
   * @returns Properties of the given record in the given table.
   *
   * @remarks
   * Throws an error if no properties exists in the table for the given record.
   */
  const getRecordPropertiesStrict = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
    table: BaseTable<PS, M, T>,
    record: Record,
  ): Properties<PS, T> => {
    const properties = getRecordProperties(table, record);
    if (!properties) throw new Error(`No properties for table ${getTableName(table)} on record ${record}`);
    return properties;
  };

  /**
   * Compare two {@link Properties}s.
   * `a` can be partial table properties, in which case only the keys present in `a` are compared to the corresponding keys in `b`.
   *
   * Note: Modified from RECS.
   *
   * @param a Partial {@link Properties} to compare to `b`
   * @param b BaseTable properties to compare `a` to.
   * @returns True if `a` equals `b` in the keys present in a or neither `a` nor `b` are defined, else false.
   *
   * @example
   * ```
   * recordPropertiesEqual({ x: 1, y: 2 }, { x: 1, y: 3 }) // returns false because properties of y don't match
   * recordPropertiesEqual({ x: 1 }, { x: 1, y: 3 }) // returns true because x is equal and y is not present in a
   * ```
   */
  const recordPropertiesEqual = <S extends Schema, T = unknown>(
    a?: Partial<Properties<S, T>>,
    b?: Properties<S, T>,
  ): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;

    let equals = true;
    for (const key of Object.keys(a)) {
      equals = isEqual(a[key], b[key]);
      if (!equals) return false;
    }

    return equals;
  };

  /**
   * Util to create a tuple of a table and properties with matching schema.
   * (Used to enforce Typescript type safety.)
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable BaseTable} with {@link Schema} `S`
   * @param properties {@link Properties} with {@link Schema} `S`
   * @returns Tuple `[table, properties]`
   */
  const withProperties = <S extends Schema, T = unknown>(
    table: BaseTable<S, BaseTableMetadata, T>,
    properties: Properties<S, T>,
  ): [BaseTable<S, BaseTableMetadata, T>, Properties<S, T>] => {
    return [table, properties];
  };

  /**
   * Get a set of entities that have the given table properties in the given table.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable BaseTable} to get records with the given properties from.
   * @param properties look for records with these {@link Properties}.
   * @returns Set with {@link Record Records} with the given table properties.
   */
  const getRecordsWithProperties = <S extends Schema, T = unknown>(
    table: BaseTable<S, BaseTableMetadata, T> | IndexedBaseTable<S, BaseTableMetadata, T>,
    properties: Partial<Properties<S, T>>,
  ): Set<Record> => {
    // Shortcut for indexers
    if (isIndexed(table) && isFullTableProperties(table, properties)) {
      return table.getRecordsWithProperties(properties);
    }

    // Trivial implementation for regular tables
    const records = new Set<Record>();
    for (const record of getTableRecords(table)) {
      const recProperties = getRecordProperties(table, record);
      if (recordPropertiesEqual(properties, recProperties)) {
        records.add(record);
      }
    }

    return records;
  };

  /**
   * Get a set of all records of the given table.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable BaseTable} to get all records from
   * @returns Set of all records in the given table.
   */
  const getTableRecords = <S extends Schema, T = unknown>(
    table: BaseTable<S, BaseTableMetadata, T>,
  ): IterableIterator<Record> => {
    return table.records();
  };

  /**
   * Helper function to create a table update for the current table properties of a given record.
   *
   * Note: Modified from RECS.
   *
   * @param records Record to create the component update for.
   * @param table BaseTable to create the table update for.
   * @returns TableUpdate {@link TableUpdate} corresponding to the given record, the given table and the record's current properties.
   */
  const toUpdate = <S extends Schema>(record: Record, table: BaseTable<S>): TableUpdate<S> => {
    const properties = getRecordProperties(table, record);

    return {
      record,
      table,
      properties: { current: properties, prev: undefined },
      type: properties ? "enter" : "noop",
    };
  };

  /**
   * Helper function to turn a stream of {@link Record Records} into a stream of table updates of the given table.
   *
   * Note: Modified from RECS.
   *
   * @param table BaseTable to create update stream for.
   * @returns Unary function to be used with RxJS that turns stream of {@link Record Records} into stream of table updates.
   */
  const toUpdateStream = <S extends Schema>(table: BaseTable<S>) => {
    return pipe(map((record: Record) => toUpdate(record, table)));
  };

  /**
   * Helper function to check whether a given table is indexed.
   *
   * Note: Modified from RECS.
   *
   * @param c
   * @returns Whether the given table is indexed.
   */
  const isIndexed = <S extends Schema>(table: BaseTable<S> | IndexedBaseTable<S>): table is IndexedBaseTable<S> => {
    return "getRecordsWithProperties" in table;
  };

  /**
   * Helper function to check whether given table properties are partial or full.
   *
   * Note: Modified from RECS.
   *
   * @param table
   * @param properties
   * @returns Whether the given table properties are full.
   */
  const isFullTableProperties = <S extends Schema, T = unknown>(
    table: BaseTable<S, BaseTableMetadata, T>,
    properties: Partial<Properties<S, T>>,
  ): properties is Properties<S, T> => {
    return Object.keys(table.propertiesSchema).every((key) => key in properties);
  };

  /**
   * Type guard to infer the TypeScript type of a given table update
   *
   * @param update Table update to infer the type of.
   * @param table {@link createTable BaseTable} to check whether the given update corresponds to it.
   * @returns True (+ infered type for `update`) if `update` belongs to `table`. Else false.
   */
  const isTableUpdate = <S extends Schema, T = unknown>(
    update: TableUpdate<S, BaseTableMetadata, T>,
    table: BaseTable<S, BaseTableMetadata, T>,
  ): update is TableUpdate<S, BaseTableMetadata, T> => {
    return update.table.id === table.id;
  };

  return {
    setRecord,
    updateRecord,
    removeRecord,
    hasRecord,
    getRecordProperties,
    getRecordPropertiesStrict,
    recordPropertiesEqual,
    withProperties,
    getRecordsWithProperties,
    getTableRecords,
    toUpdate,
    toUpdateStream,
    isIndexed,
    isFullTableProperties,
    isTableUpdate,
  };
};
