import type { BaseTable, BaseTableMetadata, Properties, Table } from "@/tables";
import type { $Record, Schema, World } from "@/lib";

/* --------------------------------- GLOBAL --------------------------------- */
/**
 * Defines the type of update for a record inside a specific table.
 *
 * - `enter` - The record is now matching the query (or entering the table being watched).
 * - `exit` - The record is no longer matching the query (or exiting the table being watched).
 * - `change` - The record is still matching the query (or inside the table), but its properties have changed.
 * - `noop` - No change has occurred.
 * @category Queries
 */
export type UpdateType = "enter" | "exit" | "change" | "noop";

/**
 * Defines the characteristics of a table update.
 * @template PS The schema of the properties for all records inside the table being watched.
 * @template M The metadata of the table.
 * @template T The type of the properties to match.
 * @param table The table subject to change (without methods).
 * If the query covers multiple tables, and `runOnInit` is set to `true` (see {@link CreateTableWatcherOptions}), this will be `undefined`.
 * @param $record The record for which the update has occurred.
 * @param properties The properties of the record before and after the update (whatever is available).
 * If the record is entering the query, `prev` will be `undefined`. If the record is exiting the query, `current` will be `undefined`.
 * @param type The type of update that has occurred (see {@link UpdateType}).
 * @category Queries
 */
export type TableUpdate<PS extends Schema = Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown> = {
  table: BaseTable<PS, M, T>;
  $record: $Record;
  properties: { current: Properties<PS, T> | undefined; prev: Properties<PS, T> | undefined };
  type: UpdateType;
};

/**
 * Defines the callbacks for a table watcher.
 *
 * Note: At least one callback has to be provided.
 *
 * @template PS The schema of the properties for all records inside the table being watched.
 * @template M The metadata of the table.
 * @template T The type of the properties to match.
 * @param onChange The callback to trigger when a record inside the table being watched has changed (includes all below events).
 * @param onEnter The callback to trigger when a record inside the table being watched has entered the query (or the table).
 * @param onExit The callback to trigger when a record inside the table being watched has exited the query (or the table).
 * @param onUpdate The callback to trigger when the properties of a record inside the table being watched have changed.
 * @see {@link TableUpdate}
 * @category Queries
 *
 * TODO(review): we can't typecheck complex union types with at least one required key
 */
export type TableWatcherCallbacks<
  PS extends Schema = Schema,
  M extends BaseTableMetadata = BaseTableMetadata,
  T = unknown,
> = Partial<{
  onChange: (update: TableUpdate<PS, M, T>) => void;
  onEnter: (update: TableUpdate<PS, M, T>) => void;
  onExit: (update: TableUpdate<PS, M, T>) => void;
  onUpdate: (update: TableUpdate<PS, M, T>) => void;
}>;

/**
 * Defines additional options for watching records inside a specific table.
 * @param runOnInit Whether to trigger the callbacks for all matching records on initialization (default: `true`).
 * @category Queries
 * @internal
 */
export type TableWatcherParams = {
  runOnInit?: boolean;
};

/* ---------------------------------- QUERY --------------------------------- */
/**
 * Defines a query for records matching properties for a specific table.
 * @template tableDef The definition of the contract table.
 * @template T The type of the properties to match.
 * @param table The full table object to query.
 * @param properties The properties to match for the given table
 * @category Queries
 * @internal
 */
type QueryMatchingProperties<
  PS extends Schema = Schema,
  M extends BaseTableMetadata = BaseTableMetadata,
  T = unknown,
> = {
  table: BaseTable<PS, M, T> | Table<PS, M, T>;
  properties: Partial<Properties<PS, T>>;
};

/**
 * Defines the options for querying all records matching multiple conditions across tables.
 *
 * Note: At least one inside or with condition needs to be provided for initial filtering.
 *
 * Note: The records need to match ALL conditions to be included in the final result.
 *
 * @param with An array of tables the records need to be included in (have properties).
 * @param withProperties An array of table-properties pairs the records need to match precisely.
 * @param without An array of tables the records need to be excluded from (not have properties).
 * @param withoutProperties An array of table-properties pairs the records need to not match (at least one different property).
 * @category Queries
 *
 * TODO(review): fix type inference on heterogeneous array (with single ContractTableDef it wants the same table as the first one for all items)
 */
export type QueryOptions = {
  with?: (BaseTable | Table)[]; // inside these tables
  withProperties?: QueryMatchingProperties[]; // with the specified propertiess for their associated tables
  without?: (BaseTable | Table)[]; // not inside these tables
  withoutProperties?: QueryMatchingProperties[]; // without the specified propertiess for their associated tables
};

/* ------------------------------ TABLE WATCHER ----------------------------- */
/**
 * Defines the options for querying records inside a specific table.
 *
 * Note: Some properties are abstracted from the implementation; meaning that these are provided as table methods and inferred from the table.
 *
 * @template tableDef The definition of the contract table.
 * @param queries The TinyBase queries object to use for fetching records (astracted).
 * @param table The table to query for records (abstracted).
 * @param properties The properties to match for the given table.
 * @category Queries
 * @internal
 */
export type TableQueryOptions<
  PS extends Schema = Schema,
  M extends BaseTableMetadata = BaseTableMetadata,
  T = unknown,
> = {
  table: BaseTable<PS, M, T> | Table<PS, M, T>;
  properties: Partial<Properties<PS, T>>;
};

/**
 * Defines the result of a query for records inside a specific table.
 * @param id The id of the table being queried.
 * @param $records An array of {@link $Record} matching the query.
 * @category Queries
 * @internal
 */
export type TableQueryResult = {
  id: string;
  $records: $Record[];
};

/**
 * Defines the options for watching records inside a specific table.
 *
 * Note: Some properties are abstracted from the implementation; meaning that these are provided as table methods and inferred from the table.
 *
 * @template PS The schema of the properties for all records inside the table being watched.
 * @template M The metadata of the table.
 * @template T The type of the properties to match.
 * @param world The RECS World object (abstracted).
 * @param table The BaseTable to watch for changes (abstracted).
 * @see {@link TableWatcherCallbacks}
 * @category Queries
 * @internal
 */
export type TableWatcherOptions<PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown> = {
  world: World;
  table: BaseTable<PS, M, T> | Table<PS, M, T>;
  // Opt in to any callback
} & TableWatcherCallbacks<PS, M, T>;
