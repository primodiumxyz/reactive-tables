import * as _latticexyz_store_internal from "@latticexyz/store/internal";
import * as _latticexyz_store_config_v2 from "@latticexyz/store/config/v2";
import {
  S as Store,
  Q as QueryOptions,
  $ as $Record,
  a as Schema,
  T as TableWatcherCallbacks,
  b as TableWatcherParams,
  M as Metadata,
  P as Properties,
  c as Type,
  B as BaseTableMetadata,
  O as OriginalTableMethods,
  d as TinyQLQueryKeywords,
  C as CreateTableWatcherOptions,
  e as CreateTableWatcherResult,
  f as StoreConfig,
  g as ContractTableDefs,
  h as ContractTables,
  A as AllTableDefs,
  i as StorageAdapter,
} from "./types-B_aAM57w.js";
export {
  n as AbiToKeySchema,
  m as AbiToPropertiesSchema,
  o as ContractTable,
  k as ContractTableDef,
  p as PropertiesSansMetadata,
  l as TableUpdate,
  U as UpdateType,
  j as default$Record,
} from "./types-B_aAM57w.js";
import * as tinybase_store from "tinybase/store";
export { Store as TinyBaseStore } from "tinybase/store";
export { Queries as TinyBaseQueries } from "tinybase/queries";
export { KeySchema, ValueSchema as PropertiesSchema } from "@latticexyz/protocol-parser/internal";
import "viem";
import "@latticexyz/schema-type/internal";
import "@latticexyz/store";
import "@latticexyz/store/config";

/**
 * Queries all records matching multiple provided conditions across tables.
 *
 * Note: See {@link QueryOptions} for more details on conditions criteria.
 *
 * @param store The TinyBase store containing the properties associated with contract tables.
 * @param options The {@link QueryOptions} object containing the conditions to match.
 * @returns An array of {@link $Record} objects matching all conditions.
 * @example
 * This example queries all records that have a score of 10 in the "Score" table and are not inside the "GameOver" table.
 *
 * ```ts
 * const { registry, store } = createWrapper({ mudConfig });
 * registry.Score.set({ points: 10 }, recordA);
 * registry.Score.set({ points: 10 }, recordB);
 * registry.Score.set({ points: 3 }, recordC);
 * registry.GameOver.set({ value: true }, recordB);
 *
 * const records = query(store, {
 *   withProperties: [{ table: registry.Score, properties: { points: 10 } }],
 *   without: [registry.GameOver],
 * });
 * console.log(records);
 * // -> [ recordA ]
 * ```
 * @category Queries
 */
declare const query: <tableDefs extends _latticexyz_store_internal.Table[], T = unknown>(
  _store: Store,
  options: QueryOptions<tableDefs, T>,
) => $Record[];

/**
 * Listen to all records matching multiple conditions across tables.
 *
 * This will trigger the provided callbacks whenever a record enters or exits the query conditions, or when its properties change
 * within the query conditions.
 *
 * Note: This is related to ${@link query} (direct retrieval based on conditions) and ${@link useQuery} (React hook inside callbacks + real-time retrieval).
 *
 * Note: See {@link QueryOptions} for more details on conditions criteria.
 *
 * @param store The TinyBase store containing the properties associated inside contract tables.
 * @param queryOptions The {@link QueryOptions} object containing the conditions to match.
 * @param callbacks The {@link TableWatcherCallbacks} to trigger on changes. Including: onChange, onEnter, onExit, onUpdate.
 * These will trigger a {@link TableUpdate} object inside the id of the updated table, the record, the previous and new properties of the record and the type of update.
 * @param options (optional) Additional options for the query. Currently only supports `runOnInit` to trigger the callbacks for all matching records on initialization.
 * @returns An object inside an `unsubscribe` method to stop listening to the query.
 * @example
 * This example creates a query that listens to all records that represent online players notInside a score of 0.
 *
 * ```ts
 * const { registry, store } = createWrapper({ mudConfig });
 * registry.Player.set({ score: 10, online: true }, recordA);
 * registry.Player.set({ score: 0, online: true }, recordB);
 * registry.Player.set({ score: 10, online: false }, recordC);
 *
 * const { unsubscribe } = $query(store, {
 *   withProperties: [{ table: registry.Player, properties: { online: true } }],
 *   withoutProperties: [{ table: registry.Player, properties: { score: 0 } }],
 * }, {
 *  onEnter: (update) => console.log(update),
 *  onExit: (update) => console.log(update),
 * }, { runOnInit: true }); // this is the default behavior
 * // -> { table: undefined, $record: recordA, current: undefined, prev: undefined, type: "enter" }
 *
 * registry.Player.update({ score: 15 }, recordA);
 * // -> { table: registry.Player, $record: recordA, current: { online: true, score: 15 }, prev: { online: true, score: 10 }, type: "change" }
 *
 * registry.Player.update({ online: false }, recordA);
 * // -> { table: registry.Player, $record: recordA, current: { online: false, score: 15 }, prev: { online: true, score: 15 }, type: "change" }
 *
 * // Unsubscribe from the query once you're done or when disposing of the component
 * unsubscribe();
 * ```
 * @category Queries
 */
declare const $query: <tableDefs extends _latticexyz_store_internal.Table[], S extends Schema, T = unknown>(
  _store: Store,
  queryOptions: QueryOptions<tableDefs, T>,
  callbacks: TableWatcherCallbacks<S, T>,
  params?: TableWatcherParams,
) => {
  unsubscribe: () => tinybase_store.Store;
};

/**
 * React hook to query all records matching multiple conditions across tables.
 *
 * This will return an array of $Record objects matching all conditions, and will trigger the provided callbacks on changes.
 *
 * Note: See {@link QueryOptions} for more details on conditions criteria.
 *
 * Note: This hook will only trigger on changes after it's mounted, not on creation for all initial matching records.
 *
 * @param store The TinyBase store containing the properties associated with contract tables.
 * @param options The {@link QueryOptions} object containing the conditions to match.
 * @param callbacks (optional) The {@link TableWatcherCallbacks} to trigger on changes. Including: onChange, onEnter, onExit, onUpdate.
 * These will trigger a {@link TableUpdate} object with the id of the updated table, the record, the previous and new properties of the record and the type of update.
 * @returns An array of {@link $Record} matching all conditions.
 * @example
 * This example queries all records that have a score of 10 in the "Score" table and are not inside the "GameOver" table.
 *
 * ```ts
 * const { registry, store } = createWrapper({ mudConfig });
 * registry.Score.set({ points: 10 }, recordA);
 * registry.Score.set({ points: 10 }, recordB);
 * registry.Score.set({ points: 3 }, recordC);
 * registry.GameOver.set({ value: true }, recordB);
 *
 * const records = useQuery(store, {
 *   withProperties: [ { table: registry.Score, properties: { points: 10 } } ],
 *   without: [ registry.GameOver ],
 * }, {
 *   onChange: (update) => console.log(update),
 * });
 * console.log(records);
 * // -> [ recordA ]
 *
 * registry.Score.update({ points: 10 }, recordC);
 * // -> { table: registry.Score, $record: recordC, current: { points: 10 }, prev: { points: 3 }, type: "change" }
 * console.log(records);
 * // -> [ recordA, recordC ]
 * ```
 * @category Queries
 */
declare const useQuery: <tableDefs extends _latticexyz_store_internal.Table[], S extends Schema, T = unknown>(
  _store: Store,
  options: QueryOptions<tableDefs, T>,
  callbacks?: TableWatcherCallbacks<S, T>,
) => $Record[];

/**
 * Defines the options for creating a local table.
 *
 * @template M The type of any provided metadata for the table.
 * @param id The unique identifier for the table, usually—but not necessarily— a human-readable and descriptive name.
 * @param metadata (optional) Any additional metadata to be associated with the table.
 * @param persist (optional) Whether the table should be persisted in local storage or not. Default: false.
 */
type CreateLocalTableOptions<M extends Metadata> = {
  id: string;
  metadata?: M;
  persist?: boolean;
};
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * These tables are meant to be created directly during implementation, then used alongside contract tables
 * the exact same way. The only difference is that they won't take any key for accessing various records, as
 * they are designed as a single record table.
 *
 * Note: when creating a persistent table, on the browser, you MUST wait for the sync with local storage to be started;
 * otherwise, there will be inconsistencies with properties from the last and current sessions.
 *
 * @param store The store accessor returned by the wrapper, containing both the persistent and regular stores.
 * @param schema The schema of the table, defining the properties and their types.
 * @param options (optional) The options for creating the table (see {@link CreateLocalTableOptions}).
 * @param defaultProperties (optional) The default properties to set for the table on initialization; will be overridden
 * if the table is persistent and already has properties from a previous session
 * @returns A local table object with the specified properties, and fully typed methods for data manipulation.
 * @example
 * This example creates a local table with a single property, "darkMode", set to false.
 *
 * ```ts
 * const darkModeTable = createLocalTable(store, { darkMode: PropType.Boolean }, { id: "DarkMode" }, { darkMode: false });
 * console.log(darkModeTable.get());
 * // -> { darkMode: false }
 *
 * // or more simply
 * const darkModeTable = createLocalBoolTable(store, { id: "DarkMode" }, { value: false });
 * console.log(darkModeTable.get());
 * // -> { value: false }
 * ```
 *
 * @example
 * This example creates a persistent local table with coordinates properties.
 *
 * ```ts
 * // Wait for the sync with local storage to be started after creating the wrapper
 * const { store } = createWrapper({ mudConfig });
 * await store("PERSIST").ready();
 *
 * // This table will be persisted in local storage, and loaded with its latest properties next time.
 * const coordsTable = createLocalCoordTable(store, { id: "Coords", persist: true }, { x: 0, y: 0 });
 * ```
 * @category Creation
 */
declare const createLocalTable: <S extends Schema, M extends Metadata, T = unknown>(
  store: Store,
  schema: S,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<S, T>,
) => LocalTable<S, M, LocalTableMetadata<S, M>, T>;
/**
 * Defines a local table with a single number property.
 */
type LocalNumberTable = ReturnType<typeof createLocalNumberTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single number property.
 * @see {@link createLocalTable}
 */
declare const createLocalNumberTable: <M extends Metadata>(
  store: Store,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<{
    value: Type.Number;
  }>,
) => LocalTable<
  {
    value: Type.Number;
  },
  M,
  LocalTableMetadata<
    {
      value: Type.Number;
    },
    M
  >,
  unknown
>;
/**
 * Defines a local table with a single BigInt property.
 */
type LocalBigIntTable = ReturnType<typeof createLocalBigIntTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single BigInt property.
 * @see {@link createLocalTable}
 */
declare const createLocalBigIntTable: <M extends Metadata>(
  store: Store,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<{
    value: Type.BigInt;
  }>,
) => LocalTable<
  {
    value: Type.BigInt;
  },
  M,
  LocalTableMetadata<
    {
      value: Type.BigInt;
    },
    M
  >,
  unknown
>;
/**
 * Defines a local table with a single string property.
 */
type LocalStringTable = ReturnType<typeof createLocalStringTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single string property.
 * @see {@link createLocalTable}
 */
declare const createLocalStringTable: <M extends Metadata>(
  store: Store,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<{
    value: Type.String;
  }>,
) => LocalTable<
  {
    value: Type.String;
  },
  M,
  LocalTableMetadata<
    {
      value: Type.String;
    },
    M
  >,
  unknown
>;
/**
 * Defines a local table with number properties for coordinates, specifically `x` and `y`.
 */
type LocalCoordTable = ReturnType<typeof createLocalCoordTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with number properties for coordinates, specifically `x` and `y`.
 * @see {@link createLocalTable}
 */
declare const createLocalCoordTable: <M extends Metadata>(
  store: Store,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<{
    x: Type.Number;
    y: Type.Number;
  }>,
) => LocalTable<
  {
    x: Type.Number;
    y: Type.Number;
  },
  M,
  LocalTableMetadata<
    {
      x: Type.Number;
      y: Type.Number;
    },
    M
  >,
  unknown
>;
/**
 * Defines a local table with a single boolean property.
 */
type LocalBoolTable = ReturnType<typeof createLocalBoolTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single boolean property.
 * @see {@link createLocalTable}
 */
declare const createLocalBoolTable: <M extends Metadata>(
  store: Store,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<{
    value: Type.Boolean;
  }>,
) => LocalTable<
  {
    value: Type.Boolean;
  },
  M,
  LocalTableMetadata<
    {
      value: Type.Boolean;
    },
    M
  >,
  unknown
>;
/**
 * Defines a local table with a single record property.
 */
type Local$RecordTable = ReturnType<typeof createLocal$RecordTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single record property.
 * @see {@link createLocalTable}
 */
declare const createLocal$RecordTable: <M extends Metadata>(
  store: Store,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<{
    value: Type.$Record;
  }>,
) => LocalTable<
  {
    value: Type.$Record;
  },
  M,
  LocalTableMetadata<
    {
      value: Type.$Record;
    },
    M
  >,
  unknown
>;

/**
 * Defines a local table, including its metadata and methods.
 *
 * Note: See {@link LocalTableMethods} for more information about its methods.
 *
 * @template S The {@link Schema} of the properties for each row inside the table.
 * @template M Any additional {@link Metadata}.
 * @template T Specific types for its properties.
 * @param id The hex id of the table.
 * @param schema The {@link Schema} of the properties for each row inside the table.
 * @param metadata Any additional {@link Metadata}, as well as:
 * - `name` - The name of the table.
 * - `globalName` - The name of the table prefixed by its namespace.
 * @category Table
 */
type LocalTable<
  S extends Schema = Schema,
  M extends Metadata = Metadata,
  metadata extends LocalTableMetadata<S, M> = LocalTableMetadata<S, M>,
  T = unknown,
> = LocalTableMethods<S, T> & {
  readonly id: metadata["tableId"];
  readonly schema: metadata["schema"];
  readonly metadata: M & {
    readonly name: metadata["name"];
    readonly globalName: `internal__${metadata["name"]}`;
  };
};
/**
 * Defines a local table metadata, meaning the {@link BaseTableMetadata}, any additional {@link Metadata}, as well as
 * the following property:
 * - `namespace` - A constant `internal` namespace.
 *
 * @template S The {@link Schema} of the properties for each row inside the table.
 * @template M Any additional {@link Metadata}.
 * @category Table
 * @internal
 */
type LocalTableMetadata<S extends Schema, M extends Metadata = Metadata> = M &
  BaseTableMetadata<S> & {
    readonly namespace: "internal";
  };
/**
 * Defines the methods available for a local table.
 *
 * Note: This extends the {@link OriginalTableMethods} for better compatibility with RECS.
 *
 * @category Table
 * @internal
 */
type LocalTableMethods<S extends Schema, T = unknown> = OriginalTableMethods & {
  /**
   * Get the current properties of a record, or the table as a whole if it doesn't require any keys.
   *
   * @param $record (optional) The record to get the properties for.
   * @param defaultProperties (optional) The default properties to return if the record doesn't exist.
   * @returns The current properties of the record.
   * @example
   * This example retrieves the current properties of the "Counter" table, which has only a single `value` property.
   *
   * ```ts
   * const count = registry.Counter.get();
   * console.log(count);
   * // -> { value: 0 }
   * ```
   * @category Methods
   */
  get(): Properties<S, T> | undefined;
  get($record: $Record | undefined): Properties<S, T> | undefined;
  get($record?: $Record | undefined, defaultProperties?: Properties<S, T>): Properties<S, T>;
  /**
   * Set the properties of a record.
   *
   * @param properties The properties to set.
   * @param $record (optional) The record to set the properties for.
   * @example
   * This example sets the properties of the "Counter" table, which has only a single `value` property.
   *
   * ```ts
   * registry.Counter.set({ value: 10 });
   * const count = registry.Counter.get();
   * console.log(count);
   * // -> { value: 1° }
   * ```
   * @category Methods
   */
  set: (properties: Properties<S, T>, $record?: $Record) => void;
  /**
   * Get all records in the table.
   *
   * @returns All records currently inside the table (having properties registered)
   * @example
   * This example retrieves all records in the "Player" table.
   *
   * ```ts
   * registry.Player.set({ name: "Alice" }, recordA);
   * registry.Player.set({ name: "Bob" }, recordB);
   *
   * const players = registry.Player.getAll();
   * console.log(players);
   * // -> [recordA, recordB]
   * ```
   * @category Methods
   */
  getAll: () => $Record[];
  /**
   * Get all records in the table with specific properties.
   *
   * @param properties The properties to match.
   * @returns All records currently inside the table with the specified properties.
   * @example
   * This example retrieves all records in the "Player" table with a score of 100.
   *
   * ```ts
   * registry.Player.set({ name: "Alice", score: 30 }, recordA);
   * registry.Player.set({ name: "Bob", score: 100 }, recordB);
   *
   * const players = registry.Player.getAllWith({ score: 100 });
   * console.log(players);
   * // -> [recordB]
   * ```
   * @category Methods
   */
  getAllWith: (properties: Partial<Properties<S, T>>) => $Record[];
  /**
   * Get all records in the table without specific properties.
   *
   * @param properties The properties to exclude.
   * @returns All records currently inside the table without the specified properties.
   * @example
   * This example retrieves all records in the "Player" table without a score of 0.
   *
   * ```ts
   * registry.Player.set({ name: "Alice", score: 30 }, recordA);
   * registry.Player.set({ name: "Bob", score: 0 }, recordB);
   *
   * const players = registry.Player.getAllWithout({ score: 0 });
   * console.log(players);
   * // -> [recordA]
   * ```
   * @category Methods
   */
  getAllWithout: (properties: Partial<Properties<S, T>>) => $Record[];
  /**
   * Get all records in the table with a React hook.
   *
   * @returns All records currently inside the table (having properties registered), updated whenever data changes
   * within the table.
   * @example
   * This example retrieves all records in the "Player" table.
   *
   * ```ts
   * const players = registry.Player.useAll();
   * console.log(players);
   * // -> []
   *
   * registry.Player.set({ name: "Alice" }, recordA);
   * console.log(players);
   * // -> [recordA]
   * ```
   * @category Methods
   */
  useAll: () => $Record[];
  /**
   * Get all records in the table with specific properties with a React hook.
   *
   * @param properties The properties to match.
   * @returns All records currently inside the table with the specified properties, updated whenever data changes
   * within the table.
   * @example
   * This example retrieves all records in the "Player" table with a score of 100.
   *
   * ```ts
   * const players = registry.Player.useAllWith({ score: 100 });
   * console.log(players);
   * // -> []
   *
   * registry.Player.set({ name: "Alice", score: 100 }, recordA);
   * console.log(players);
   * // -> [recordA]
   *
   * registry.Player.update({ score: 200 }, recordA);
   * console.log(players);
   * // -> []
   * ```
   * @category Methods
   */
  useAllWith: (properties: Partial<Properties<S, T>>) => $Record[];
  /**
   * Get all records in the table without specific properties with a React hook.
   *
   * @param properties The properties to exclude.
   * @returns All records currently inside the table without the specified properties, updated whenever data changes
   * within the table.
   * @example
   * This example retrieves all records in the "Player" table without a score of 0.
   *
   * ```ts
   * const players = registry.Player.useAllWithout({ score: 0 });
   * console.log(players);
   * // -> []
   *
   * registry.Player.set({ name: "Alice", score: 30 }, recordA);
   * console.log(players);
   * // -> [recordA]
   *
   * registry.Player.update({ score: 0 }, recordA);
   * console.log(players);
   * // -> []
   * ```
   * @category Methods
   */
  useAllWithout: (properties: Partial<Properties<S, T>>) => $Record[];
  /**
   * Remove a record from the table.
   *
   * @param $record (optional) The record to remove.
   * @example
   * This example removes a record from the "Player" table.
   *
   * ```ts
   * registry.Player.set({ name: "Alice" }, recordA);
   * registry.Player.set({ name: "Bob" }, recordB);
   * const originalPlayers = registry.Player.getAll();
   * console.log(originalPlayers);
   * // -> [recordA, recordB]
   *
   * registry.Player.remove(recordA);
   * const players = registry.Player.getAll();
   * console.log(players);
   * // -> [recordB]
   * ```
   * @category Methods
   */
  remove: ($record?: $Record) => void;
  /**
   * Clear the table, removing all records.
   *
   * @example
   * This example clears the "Player" table.
   *
   * ```ts
   * registry.Player.clear();
   * const players = registry.Player.getAll();
   * console.log(players);
   * // -> []
   * ```
   * @category Methods
   */
  clear: () => void;
  /**
   * Update the properties of a record.
   *
   * Note: This will throw an error if the record doesn't exist in the table (if it was never set).
   *
   * @param properties The properties to update (meaning not necessarily all properties need to be provided)
   * @param $record (optional) The record to update the properties for.
   * @example
   * This example updates the score of a player in the "Player" table.
   *
   * ```ts
   * const { recordA } = getRecord(); // for the sake of the example
   * registry.Player.set({ name: "Alice", score: 30 }, recordA);
   *
   * registry.Player.update({ score: 100 }, record);
   * const player = registry.Player.get(recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 100 }
   * ```
   * @category Methods
   */
  update: (properties: Partial<Properties<S, T>>, $record?: $Record) => void;
  /**
   * Check if a record exists in the table.
   *
   * @param $record (optional) The record to check.
   * @returns Whether the record exists in the table.
   * @example
   * This example checks if a record exists in the "Player" table.
   *
   * ```ts
   * const { recordA } = getRecord(); // for the sake of the example
   * const exists = registry.Player.has(recordA);
   * console.log(exists);
   * // -> false
   *
   * registry.Player.set({ name: "Alice" }, recordA);
   * const existsNow = registry.Player.has(recordA);
   * console.log(existsNow);
   * // -> true
   * ```
   * @category Methods
   */
  has: ($record?: $Record) => boolean;
  /**
   * Get the current properties of a record with a React hook.
   *
   * @param $record (optional) The record to get the properties for.
   * @param defaultProperties (optional) The default properties to return if the record doesn't exist.
   * @returns The current properties of the record, updated whenever the data changes.
   * @example
   * This example retrieves the properties of a record in the "Player" table.
   *
   * ```ts
   * const { recordA } = getRecord(); // for the sake of the example
   * const player = registry.Player.use(recordA, { name: "unknown", score: 0 });
   * console.log(player);
   * // -> { name: "unknown", score: 0 }
   *
   * registry.Player.set({ name: "Alice", score: 30 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 30 }
   *
   * ```
   * @category Methods
   */
  use($record?: $Record | undefined): Properties<S, T> | undefined;
  use($record: $Record | undefined, defaultProperties?: Properties<S, T>): Properties<S, T>;
  /**
   * Pause updates for a record or the table as a whole, meaning it won't react to changes in the store anymore.
   *
   * @param $record (optional) The record to pause updates for.
   * @param properties (optional) The properties to set when pausing updates.
   * @example
   * This example pauses updates for a record in the "Player" table.
   *
   * ```ts
   * const { recordA } = getRecord(); // for the sake of the example
   * const player = registry.Player.use(recordA);
   * registry.Player.set({ name: "Alice", score: 0 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   *
   * registry.Player.pauseUpdates(recordA);
   * registry.Player.update({ score: 30 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   * ```
   * @category Methods
   */
  pauseUpdates: ($record?: $Record, properties?: Properties<S, T>) => void;
  /**
   * Enable updates for a record or the table as a whole, meaning it will react to changes in the store again.
   *
   * @param $record (optional) The record to enable updates for.
   * @example
   * This example enables updates for a record in the "Player" table after it's been paused.
   *
   * ```ts
   * const { recordA } = getRecord(); // for the sake of the example
   * const player = registry.Player.use(recordA);
   * registry.Player.set({ name: "Alice", score: 0 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   *
   * registry.Player.pauseUpdates(recordA);
   * registry.Player.update({ score: 30 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   *
   * registry.Player.resumeUpdates(recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 30 }
   * ```
   * @category Methods
   */
  resumeUpdates: ($record?: $Record) => void;
  /**
   * Query the table for records using a TinyQL query.
   *
   * @param definition The TinyQL query definition, using the provided keywords.
   * @returns All records currently inside the table that match the query.
   * @example
   * This example queries all records in the "Player" table with a score above 50.
   *
   * ```ts
   * registry.Player.set({ name: "Alice", score: 30 }, recordA);
   * registry.Player.set({ name: "Bob", score: 100 }, recordB);
   *
   * const players = registry.Player.query(({ where }) => {
   *   where((getCell) => (getCell("score") as number) > 50);
   * });
   * console.log(players);
   * // -> [recordB]
   * ```
   * @category Methods
   */
  query: (definition: (keywords: TinyQLQueryKeywords) => void) => $Record[];
  /**
   * Create a watcher for the table, either globally (on all changes) or within a TinyQL query.
   *
   * See {@link createTableWatcher} for detailed information on the configuration and behavior of the watcher.
   *
   * @param options The options for the watcher.
   * - `query` - (optional) A TinyQL query to filter the records. If not provided, it will watch all records in the table without discrimination.
   * - `onChange` - Callback triggered on any change in the table/query (encompassing enter, exit, and update).
   * - `onEnter` - Callback triggered when a record enters the table/query (`properties.prev` will be undefined).
   * - `onExit` - Callback triggered when a record exits the table/query (`properties.current` will be undefined).
   * - `onUpdate` - Callback triggered when the properties of a record are updated (within the query if provided).
   * @param params Optional parameters for the watcher.
   * - `runOnInit` - Whether to trigger the callbacks for all records on initialization (default: `true`).
   * @returns An object with an `unsubscribe` method to stop listening to the table.
   * This example creates a watcher for all records within the "Player" table.
   *
   * ```ts
   * registry.Player.set({ health: 100 }, recordA);
   *
   * registry.Player.watch({
   *   onChange: (update) => console.log(update),
   * });
   * // -> { table: undefined, $record: recordA, current: undefined, prev: undefined, type: "enter" }
   *
   * registry.Player.update({ health: 90 }, recordA);
   * // -> { table: registry.Player, $record: recordA, current: { health: 90 }, prev: { health: 100 }, type: "change" }
   *
   * registry.Player.remove(recordA);
   * // -> { table: registry.Player, $record: recordA, current: undefined, prev: { health: 90 }, type: "exit" }
   * ```
   *
   * This example creates a watcher for all records with more than 10 points in the "Score" table.
   *
   * ```ts
   * registry.Score.set({ points: 0 }, recordA);
   * registry.Score.set({ points: 20 }, recordB);
   *
   * registry.Score.watch({
   *   onChange: (update) => console.log(update),
   *   query: ({ where }) => {
   *     where((getCell) => (getCell("points") as number) > 10);
   *   },
   * }, {
   *   runOnInit: false,
   * });
   * // -> no output
   *
   * registry.Score.update({ points: 15 }, recordA);
   * // -> { table: registry.Score, $record: recordA, current: { points: 15 }, prev: { points: 0 }, type: "enter" }
   *
   * registry.Score.update({ points: 0 }, recordB);
   * // -> { table: registry.Score, $record: recordB, current: undefined, prev: { points: 20 }, type: "exit" }
   * ```
   * @category Methods
   */
  watch: (
    options: Omit<CreateTableWatcherOptions<S, T>, "queries" | "tableId" | "schema">,
    params?: TableWatcherParams,
  ) => CreateTableWatcherResult;
};

/**
 * List of metadata properties encoded as hex strings, to treat them differently in the store.
 *
 * Specifically, these properties do not need any encoding/decoding when stored with TinyBase, as they are treated as
 * strings.
 *
 * @category Tables
 */
declare const metadataProperties: string[];
/**
 * List of local offchain properties, provided as utilities for storage, synchronization, and any internal purposes that can
 * enhance the developer experience.
 *
 * @category Tables
 */
declare const localProperties: string[];

/**
 * Defines the options for creating a TinyBase wrapper.
 *
 * @template config The type of the configuration object specifying tables definitions for contracts codegen.
 * @template extraTableDefs The types of any additional custom definitions to generate tables for.
 * @param mudConfig The actual MUD configuration, usually retrieved for the contracts package.
 * @param otherTableDefs (optional) Custom definitions to generate tables for as well.
 */
type WrapperOptions<config extends StoreConfig, extraTableDefs extends ContractTableDefs | undefined> = {
  mudConfig: config;
  otherTableDefs?: extraTableDefs;
};
/**
 * The result of going through the TinyBase wrapper creation process.
 *
 * The registry is the main entry point to all kind of data retrieval and manipulation.
 *
 * @template config The type of the configuration object specifying tables definitions for contracts codegen.
 * @template tableDefs The types of the definitions used for generating tables.
 * @param registry The tables generated from all definitions (see {@link createRegistry}).
 * @param tableDefs The full definitions object, including provided MUD config and custom definitions, as well as store and world config tables.
 * @param store A wrapper around the TinyBase store, addressing either the "regular" or persistent store depending on the provided key,
 * as well as the queries instance (see {@link createStore}).
 * @param storageAdapter The storage adapter for formatting onchain logs into TinyBase tabular data (see {@link createStorageAdapter}).
 */
type WrapperResult<config extends StoreConfig, extraTableDefs extends ContractTableDefs | undefined> = {
  registry: ContractTables<AllTableDefs<config, extraTableDefs>>;
  tableDefs: AllTableDefs<config, extraTableDefs>;
  store: Store;
  storageAdapter: StorageAdapter;
};
/**
 * This function creates a wrapper for transforming MUD tables and custom tables definitions into consumable
 * objects, while abstracting the infrastructure for communicating from onchain data (logs) to
 * easily manipulable and strictly typed tables & records. More specifically:
 * - encoding/decoding MUD and custom definitions into tabular data for TinyBase;
 * - encoding data from onchain logs into tabular data records for TinyBase;
 * - decoding data into TypeScript-friendly objects, and offering typed methods for access and manipulation;
 * - creating and reacting to queries, both in TinyBase queries and RECS-like formats.
 *
 * This is the main entry point into the library.
 *
 * Note: if the wrapper is used in a browser environment, and you intend to use persistent tables, you MUST wait for the
 * sync with local storage to be started; otherwise, there will be inconsistencies with properties from the last and current sessions.
 * See the example in the {@link createLocalTable} function for more information.
 *
 * @param options The {@link WrapperOptions} object specifying the MUD configuration and custom definitions.
 * @returns A {@link WrapperResult} object containing the tables, definitions, store, queries instance, and storage adapter.
 * @example
 * This example creates a wrapper from MUD config and sets the properties for a specific record in the "Counter" table.
 *
 * ```ts
 * const mudConfig = defineWorld({
 *   tables: {
 *     Counter: {
 *       schema: {
 *         value: "uint32",
 *       },
 *       key: [],
 *     },
 *   },
 * });
 *
 * const { registry } = createWrapper({ mudConfig });
 * registry.Counter.set({ value: 13 }); // fully typed
 * const properties = registry.Counter.get();
 * console.log(properties);
 * // -> { value: 13 }
 * ```
 * @category Creation
 */
declare const createWrapper: <
  config extends _latticexyz_store_config_v2.Store,
  extraTableDefs extends _latticexyz_store_internal.Tables | undefined,
>({
  mudConfig,
  otherTableDefs,
}: WrapperOptions<config, extraTableDefs>) => WrapperResult<config, extraTableDefs>;

export {
  $Record,
  $query,
  AllTableDefs,
  ContractTableDefs,
  ContractTables,
  type CreateLocalTableOptions,
  type Local$RecordTable,
  type LocalBigIntTable,
  type LocalBoolTable,
  type LocalCoordTable,
  type LocalNumberTable,
  type LocalStringTable,
  type LocalTable,
  Metadata,
  Type as PropType,
  Properties,
  QueryOptions,
  Schema,
  StorageAdapter,
  Store,
  StoreConfig,
  TableWatcherCallbacks,
  type WrapperOptions,
  type WrapperResult,
  createLocal$RecordTable,
  createLocalBigIntTable,
  createLocalBoolTable,
  createLocalCoordTable,
  createLocalNumberTable,
  createLocalStringTable,
  createLocalTable,
  createWrapper,
  localProperties,
  metadataProperties,
  query,
  useQuery,
};
