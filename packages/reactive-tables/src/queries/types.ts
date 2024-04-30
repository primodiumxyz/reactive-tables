import type { Group, Having, Join, Select, Where } from "tinybase/queries";

import type { TinyBaseFormattedType } from "@/adapter";
import type { AbiToPropertiesSchema, ContractTable } from "@/tables/contract";
import type { Properties } from "@/tables";
import type { ContractTableDef, $Record, TinyBaseQueries, Schema } from "@/lib";

/* --------------------------------- GLOBAL --------------------------------- */
/**
 * Defines the type of update for a record inside a specific table.
 *
 * - `enter` - The record is now matching the query (or entering the table being watched).
 * - `exit` - The record is no longer matching the query (or exiting the table being watched).
 * - `change` - The record is still matching the query (or inside the table), but its properties have changed.
 * @category Queries
 */
export type UpdateType = "enter" | "exit" | "change";

/**
 * Defines the characteristics of a table update.
 * @template S The schema of the properties for all records inside the table being watched.
 * @template T The type of the properties to match.
 * @param tableId The id of the table subject to change.
 * If the query covers multiple tables, and `runOnInit` is set to `true` (see {@link CreateTableWatcherOptions}), this will be `undefined`.
 * @param $record The record for which the update has occurred.
 * @param properties The properties of the record before and after the update (whatever is available).
 * If the record is entering the query, `prev` will be `undefined`. If the record is exiting the query, `current` will be `undefined`.
 * @param type The type of update that has occurred (see {@link UpdateType}).
 * @category Queries
 */
export type TableUpdate<S extends Schema = Schema, T = unknown> = {
  tableId: string | undefined; // undefined if run on init on global query
  $record: $Record;
  properties: { current: Properties<S, T> | undefined; prev: Properties<S, T> | undefined };
  type: UpdateType;
};

/**
 * Defines the callbacks for a table watcher.
 *
 * Note: At least one callback has to be provided.
 *
 * @template S The schema of the properties for all records inside the table being watched.
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
export type TableWatcherCallbacks<S extends Schema, T = unknown> = Partial<{
  onChange: (update: TableUpdate<S, T>) => void;
  onEnter: (update: TableUpdate<S, T>) => void;
  onExit: (update: TableUpdate<S, T>) => void;
  onUpdate: (update: TableUpdate<S, T>) => void;
}>;

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
type QueryMatchingProperties<tableDef extends ContractTableDef, T = unknown> = {
  table: ContractTable<tableDef>;
  properties: Properties<AbiToPropertiesSchema<tableDef["valueSchema"]>, T>;
};

/**
 * Defines the options for querying all records matching multiple conditions across tables.
 *
 * Note: At least one inside or with condition needs to be provided for initial filtering.
 *
 * Note: The records need to match ALL conditions to be included in the final result.
 *
 * @template tableDefs The definitions of all contract tables involved in the query.
 * @template T The type of the properties to match.
 * @param with An array of tables the records need to be included in (have properties).
 * @param withProperties An array of table-properties pairs the records need to match precisely.
 * @param without An array of tables the records need to be excluded from (not have properties).
 * @param withoutProperties An array of table-properties pairs the records need to not match (at least one different property).
 * @category Queries
 *
 * TODO(review): fix type inference on heterogeneous array (with single ContractTableDef it wants the same table as the first one for all items)
 */
export type QueryOptions<tableDefs extends ContractTableDef[], T = unknown> = {
  with?: ContractTable<tableDefs[number]>[]; // inside these tables
  withProperties?: QueryMatchingProperties<tableDefs[number], T>[]; // with the specified propertiess for their associated tables
  without?: ContractTable<tableDefs[number]>[]; // not inside these tables
  withoutProperties?: QueryMatchingProperties<tableDefs[number], T>[]; // without the specified propertiess for their associated tables
};

/* ------------------------------ TABLE WATCHER ----------------------------- */
/**
 * Defines the options for querying records inside a specific table.
 *
 * Note: Some properties are abstracted from the implementation; meaning that these are provided as table methods and inferred from the table.
 *
 * @template tableDef The definition of the contract table.
 * @param queries The TinyBase queries object to use for fetching records (astracted).
 * @param tableId The id of the table to query or watch for changes (abstracted).
 * @param properties The properties to match for the given table.
 * @param formattedProperties The formatted properties to match for the given table (abstracted).
 * @category Queries
 * @internal
 */
export type TableQueryOptions<tableDef extends ContractTableDef> = {
  queries: TinyBaseQueries;
  tableId: string;
  properties: Partial<Properties<AbiToPropertiesSchema<tableDef["valueSchema"]>>>;
  formattedProperties?: TinyBaseFormattedType;
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
 * Defines the options for creating a watcher for a table, either globally (on all changes) or within a TinyQL query.
 *
 * @template S The schema of the properties inside the table to watch.
 * @template T The type of the properties.
 * @param query A TinyQL query to filter the records. If not provided, it will watch all records in the table without discrimination.
 * @see {@link CreateTableWatcherOptions} for the base options.
 * @see TinyQL for writing a query: https://tinybase.org/guides/making-queries/tinyql/
 * @category Queries
 * @internal
 */
export type CreateTableWatcherOptions<S extends Schema, T = unknown> = Omit<
  CreateQueryWatcherOptions<S, T>,
  "queryId"
> & {
  query?: (keywords: { select: Select; join: Join; where: Where; group: Group; having: Having }) => void;
};

/**
 * Defines the options for watching records inside a specific table.
 *
 * Note: Some properties are abstracted from the implementation; meaning that these are provided as table methods and inferred from the table.
 *
 * @template S The schema of the properties for all records inside the table being watched.
 * @template T The type of the properties to match.
 * @param queries The TinyBase queries object to use for fetching records (abstracted).
 * @param queryId The id of the query definition (abstracted).
 * @param tableId The id of the table to watch for changes (abstracted).
 * @param schema The schema of the properties for all records inside the table being watched (abstracted).
 * @param options The options for the watcher.
 * `runOnInit` - Whether to run the callbacks for all initial records matching the query (default: `true`).
 * @see {@link TableWatcherCallbacks}
 * @category Queries
 * @internal
 */
export type CreateQueryWatcherOptions<S extends Schema, T = unknown> = {
  queries: TinyBaseQueries;
  queryId: string;
  tableId: string;
  schema: S;
  options?: { runOnInit?: boolean };
  // Opt in to any callback
} & TableWatcherCallbacks<S, T>;

/**
 * Defines the result of watching records inside a specific table.
 * @param unsubscribe The method to call to stop watching the table (disposes of the listener).
 * @category Queries
 * @internal
 */
export type CreateTableWatcherResult = {
  unsubscribe: () => void;
};
