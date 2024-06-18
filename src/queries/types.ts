import type { BaseTable, BaseTables, Table, TableUpdate, Tables } from "@/tables/types";
import type { BaseTableMetadata, Properties, Schema } from "@/lib/external/mud/schema";
import type { World } from "@/lib/external/mud/world";

/* -------------------------------------------------------------------------- */
/*                                   WATCHER                                  */
/* -------------------------------------------------------------------------- */

/**
 * Defines the options for watching entities inside tables.
 *
 * @template tables The types of tables to watch.
 * @param world The RECS World object (abstracted).
 * @see {@link TableWatcherCallbacks}
 * @category Queries
 * @internal
 */
export type WatcherOptions<tables extends BaseTables | Tables> = {
  world: World;
  // Opt in to any callback
} & TableWatcherCallbacks<tables[keyof tables]["propertiesSchema"], tables[keyof tables]["metadata"]>;

/**
 * Defines the options for watching entities inside a specific table.
 *
 * Note: Some properties are abstracted from the implementation; meaning that these are provided as table methods and inferred from the table.
 *
 * @template PS The schema of the properties for all entities inside the table being watched.
 * @template M The metadata of the table.
 * @template T The type of the properties to match.
 * @param world The RECS World object (abstracted and optional, if not provided will use the world in which the first provided table is registered).
 * @param table The BaseTable to watch for changes (abstracted).
 * @see {@link TableWatcherCallbacks}
 * @category Queries
 * @internal
 */
export type TableWatcherOptions<PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown> = {
  table: BaseTable<PS, M, T> | Table<PS, M, T>;
  world?: World;
  // Opt in to any callback
} & TableWatcherCallbacks<PS, M, T>;

export type TableMethodsWatcherOptions<
  PS extends Schema,
  M extends BaseTableMetadata = BaseTableMetadata,
  T = unknown,
> = Omit<TableWatcherOptions<PS, M, T>, "table">;

/**
 * Defines the callbacks for a table watcher.
 *
 * Note: At least one callback has to be provided.
 *
 * @template PS The schema of the properties for all entities inside the table being watched.
 * @template M The metadata of the table.
 * @template T The type of the properties to match.
 * @param onUpdate The callback to trigger when an entity inside the table being watched has changed (includes all below events).
 * @param onEnter The callback to trigger when an entity inside the table being watched has entered the query (or the table).
 * @param onExit The callback to trigger when an entity inside the table being watched has exited the query (or the table).
 * @param onChange The callback to trigger when the properties of an entity inside the table being watched have changed.
 * @see {@link TableUpdate}
 * @category Queries
 */
export type TableWatcherCallbacks<
  PS extends Schema = Schema,
  M extends BaseTableMetadata = BaseTableMetadata,
  T = unknown,
> = Partial<{
  onUpdate: (update: TableUpdate<PS, M, T>) => void;
  onEnter: (update: TableUpdate<PS, M, T>) => void;
  onExit: (update: TableUpdate<PS, M, T>) => void;
  onChange: (update: TableUpdate<PS, M, T>) => void;
}>;

/**
 * Defines additional options for watching entities inside a specific table.
 * @param runOnInit Whether to trigger the callbacks for all matching entities on initialization (default: `true`).
 * @category Queries
 * @internal
 */
export type TableWatcherParams = {
  runOnInit?: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                    QUERY                                   */
/* -------------------------------------------------------------------------- */

/**
 * Defines a query for entities matching properties for a specific table.
 *
 * @template table The table to query.
 * @param table The full table object to query.
 * @param properties The properties to match for the given table
 * @category Queries
 * @internal
 */
export type QueryPropertiesCondition<table extends BaseTable = BaseTable, T = unknown> = {
  table: table;
  properties: Partial<Properties<table["propertiesSchema"], T>>;
};

/**
 * Defines the conditions for querying entities matching custom properties verification for a specific table.
 *
 * @template table The table to query.
 * @param table The full table object to query.
 * @param where A function that passes the properties to check for more complex conditions.
 * @category Queries
 */
export type QueryMatchingCondition<table extends BaseTable = BaseTable, T = unknown> = {
  table: table;
  where: (properties: Properties<table["propertiesSchema"], T>) => boolean;
};

/**
 * Defines the options for querying all entities matching multiple conditions across tables.
 *
 * Note: At least one inside or with condition needs to be provided for initial filtering.
 *
 * Note: The entities need to match ALL conditions to be included in the final result.
 *
 * @template tables A registry of {@link Table}, including the tables involved in the query.
 * @param with An array of tables the entities need to be included in (have properties).
 * @param withProperties An array of {@link QueryPropertiesCondition} to check for entities, either as precise values or conditions.
 * @param without An array of tables the entities need to be excluded from (not have properties).
 * @param withoutProperties An array of {@link QueryPropertiesCondition} to check for entities, either as precise values or conditions.
 * @category Queries
 *
 * TODO: see if there is a way to handle type inference
 */
export type QueryOptions<tables extends BaseTables | Tables = BaseTables> = {
  with?: Array<tables[keyof tables]>; // inside these tables
  withProperties?: Array<QueryPropertiesCondition<tables[keyof tables]>>;
  without?: Array<tables[keyof tables]>; // not inside these tables
  withoutProperties?: Array<QueryPropertiesCondition<tables[keyof tables]>>;
  matching?: Array<QueryMatchingCondition<tables[keyof tables]>>;
};
