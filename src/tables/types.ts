import { Subject } from "rxjs";

import type {
  AbiKeySchema,
  AbiToSchema,
  ContractTableDef,
  MappedType,
  Metadata,
  Record,
  RecordSymbol,
  ResourceLabel,
  Schema,
  SchemaAbiType,
  SchemaAbiTypeToRecsType,
  StaticAbiType,
  TableMutationOptions,
  Type,
  World,
} from "@/lib";
import type { TableUpdate, TableWatcherOptions, TableWatcherParams } from "@/queries";

export interface BaseTable<PS extends Schema = Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown> {
  id: string;
  properties: { [key in keyof PS]: Map<RecordSymbol, MappedType<T>[PS[key]]> };
  propertiesSchema: PS;
  // keySchema: KS | { record: Type.Record }; // default key schema for tables without keys
  metadata: M;
  world: World;
  records: () => IterableIterator<Record>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update$: Subject<TableUpdate<PS, M, T>> & { observers: any };
}

export type IndexedBaseTable<
  PS extends Schema = Schema,
  M extends BaseTableMetadata = BaseTableMetadata,
  T = unknown,
> = BaseTable<PS, M, T> & {
  getRecordsWithProperties: (properties: Properties<PS, T>) => Set<Record>;
};

export type BaseTableMetadata<M extends Metadata = Metadata> = M & {
  name: string;
  globalName: string;
  namespace?: string;
  abiKeySchema: { [name: string]: StaticAbiType }; // local tables are given a default key schema as well for encoding/decoding records
};

export type Tables = { [name: string]: Table };
export type Table<PS extends Schema = Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown> = BaseTable<
  PS,
  M,
  T
> &
  TableMethods<PS, M, T>;

export type ContractTables<tableDefs extends Record<string, ContractTableDef>> = {
  [name in keyof tableDefs]: ContractTable<tableDefs[name]>;
};
export type ContractTable<
  tableDef extends ContractTableDef = ContractTableDef,
  PS extends ContractTablePropertiesSchema<tableDef> = ContractTablePropertiesSchema<tableDef>,
  // KS extends ContractTableKeySchema<tableDef> = ContractTableKeySchema<tableDef>,
> = Table<PS, ContractTableMetadata<tableDef>>;

export type ContractTablePropertiesSchema<tableDef extends ContractTableDef> = {
  __staticData: Type.OptionalHex;
  __encodedLengths: Type.OptionalHex;
  __dynamicData: Type.OptionalHex;
  __lastSyncedAtBlock: Type.OptionalBigInt;
} & {
  [fieldName in keyof tableDef["valueSchema"] & string]: Type &
    SchemaAbiTypeToRecsType<SchemaAbiType & tableDef["valueSchema"][fieldName]["type"]>;
};

export type ContractTableKeySchema<tableDef extends ContractTableDef> = {
  [fieldName in keyof tableDef["keySchema"] & string]: Type &
    SchemaAbiTypeToRecsType<SchemaAbiType & tableDef["keySchema"][fieldName]["type"]>;
};

export type ContractTableMetadata<tableDef extends ContractTableDef> = {
  name: tableDef["name"];
  namespace: tableDef["namespace"];
  globalName: ResourceLabel;
  abiPropertiesSchema: { [name in keyof tableDef["valueSchema"] & string]: tableDef["valueSchema"][name]["type"] };
  abiKeySchema: { [name in keyof tableDef["keySchema"] & string]: tableDef["keySchema"][name]["type"] };
};

// Used to infer the TypeScript types from the RECS types (from schema)
export type Properties<S extends Schema, T = unknown> = {
  [key in keyof S]: MappedType<T>[S[key]];
};

// Used to infer the TypeScript types from the RECS types (from abi)
export type Keys<TKeySchema extends AbiKeySchema, T = unknown> = {
  [key in keyof AbiToSchema<TKeySchema>]: MappedType<T>[AbiToSchema<TKeySchema>[key]];
};

// Used to infer the TypeScript types from the RECS types (excluding metadata)
export type PropertiesSansMetadata<S extends Schema, T = unknown> = {
  [key in keyof S as Exclude<
    key,
    "__staticData" | "__encodedLengths" | "__dynamicData" | "__lastSyncedAtBlock"
  >]: MappedType<T>[S[key]];
};

/**
 * Defines the methods available for any table.
 *
 * @category Table
 * @internal
 */
export type TableMethods<PS extends Schema, M extends BaseTableMetadata, T = unknown> = TableBaseMethods<PS, M, T> &
  TableWithKeysMethods<PS, M, T>;

/**
 * Defines the base methods available for a table.
 *
 * @category Table
 * @internal
 */
export type TableBaseMethods<PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown> = {
  /**
   * Get the current properties of a record, or the table as a whole if it doesn't require any keys.
   *
   * @param record (optional) The record to get the properties for.
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
  get(): Properties<PS, T> | undefined;
  get(record: Record | undefined): Properties<PS, T> | undefined;
  get(record?: Record | undefined, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;

  /**
   * Set the properties of a record.
   *
   * @param properties The properties to set.
   * @param record (optional) The record to set the properties for.
   * @param options (optional) Additional {@link TableMutationOptions} for the mutation.
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
  set: (properties: Properties<PS, T>, record?: Record, options?: TableMutationOptions) => void;

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
  getAll: () => Record[];

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
  getAllWith: (properties: Partial<Properties<PS, T>>) => Record[];

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
  getAllWithout: (properties: Partial<Properties<PS, T>>) => Record[];

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
  useAll: () => Record[];

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
  useAllWith: (properties: Partial<Properties<PS, T>>) => Record[];

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
  useAllWithout: (properties: Partial<Properties<PS, T>>) => Record[];

  /**
   * Remove a record from the table.
   *
   * @param record (optional) The record to remove.
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
  remove: (record?: Record) => void;

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
   * @param record (optional) The record to update the properties for.
   * @param options (optional) Additional {@link TableMutationOptions} for the mutation.
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
  update: (properties: Partial<Properties<PS, T>>, record?: Record, options?: TableMutationOptions) => void;

  /**
   * Check if a record exists in the table.
   *
   * @param record (optional) The record to check.
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
  has: (record?: Record) => boolean;

  /**
   * Get the current properties of a record with a React hook.
   *
   * @param record (optional) The record to get the properties for.
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
  use(record?: Record | undefined): Properties<PS, T> | undefined;
  use(record: Record | undefined, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;

  // TODO: document
  blockUpdates: (record?: Record) => void;
  unblockUpdates: (record?: Record) => void;

  /**
   * Pause updates for a record or the table as a whole, meaning it won't react to changes in the store anymore.
   *
   * @param record (optional) The record to pause updates for.
   * @param properties (optional) The properties to set when pausing updates.
   * @param options (optional) Additional {@link TableMutationOptions} for the mutation.
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
  pauseUpdates: (record?: Record, properties?: Properties<PS, T>, options?: TableMutationOptions) => void;

  /**
   * Enable updates for a record or the table as a whole, meaning it will react to changes in the store again.
   *
   * @param record (optional) The record to enable updates for.
   * @param options (optional) Additional {@link TableMutationOptions} for the mutation.
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
  resumeUpdates: (record?: Record, options?: TableMutationOptions) => void;

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
   * // -> { table: undefined, record: recordA, current: undefined, prev: undefined, type: "enter" }
   *
   * registry.Player.update({ health: 90 }, recordA);
   * // -> { table: registry.Player, record: recordA, current: { health: 90 }, prev: { health: 100 }, type: "change" }
   *
   * registry.Player.remove(recordA);
   * // -> { table: registry.Player, record: recordA, current: undefined, prev: { health: 90 }, type: "exit" }
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
   * // -> { table: registry.Score, record: recordA, current: { points: 15 }, prev: { points: 0 }, type: "enter" }
   *
   * registry.Score.update({ points: 0 }, recordB);
   * // -> { table: registry.Score, record: recordB, current: undefined, prev: { points: 20 }, type: "exit" }
   * ```
   * @category Methods
   */
  watch: (options: Omit<TableWatcherOptions<PS, M, T>, "world" | "table">, params?: TableWatcherParams) => void;
};

/**
 * Defines the methods available strictly for contract tables, using keys as an alternative to the record.
 *
 * @category Table
 * @internal
 */
export type TableWithKeysMethods<PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown> = {
  /**
   * Get the current properties of a record using its keys instead of the record itself.
   *
   * @param keys (optional) The keys to get the properties for.
   * @param defaultProperties (optional) The default properties to return if the record doesn't exist.
   * @returns The current properties of the record.
   * @example
   * This example retrieves the current properties of a record in the "Player" table, on a specific server.
   *
   * ```ts
   * // The keys that get encoded as a record are: { server: "serverA", id: "playerA" }
   * registry.Player.setWithKeys({ name: "Alice" }, { server: "serverA", id: "playerA" });
   *
   * const player = registry.Player.getWithKeys({ server: "serverA", id: "playerA" });
   * console.log(player);
   * // -> { name: "Alice" }
   * ```
   * @category Methods
   */
  getWithKeys(): Properties<PS, T> | undefined;
  getWithKeys(keys?: Keys<M["abiKeySchema"], T>): Properties<PS, T> | undefined;
  getWithKeys(keys?: Keys<M["abiKeySchema"], T>, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;

  /**
   * Check if a record exists inside the table using its keys.
   *
   * @param keys (optional) The keys to use for encoding the record.
   * @returns Whether the record exists in the table.
   * @example
   * This example checks if a record exists in the "Player" table, on a specific server.
   *
   * ```ts
   * // The keys that get encoded as a record are: { server: "serverA", id: "playerA" }
   * registry.Player.setWithKeys({ name: "Alice" }, { server: "serverA", id: "playerA" });
   *
   * const exists = registry.Player.hasWithKeys({ server: "serverA", id: "playerA" });
   * console.log(exists);
   * // -> true
   *
   * const existsNot = registry.Player.hasWithKeys({ server: "serverB", id: "playerA" });
   * console.log(existsNot);
   * // -> false
   * ```
   * @category Methods
   */
  hasWithKeys: (keys?: Keys<M["abiKeySchema"], T>) => boolean;

  /**
   * Get the real-time properties of a record by providing its keys instead of the record itself.
   *
   * @param keys (optional) The keys to use for encoding the record.
   * @param defaultProperties (optional) The default properties to return if the record doesn't exist.
   * @returns The current updated properties of the record.
   * @example
   * This example retrieves the current properties of a record in the "Player" table, on a specific server.
   *
   * ```ts
   * // The keys that get encoded as a record are: { server: "serverA", id: "playerA" }
   * registry.Player.setWithKeys({ name: "Alice", score: 0 }, { server: "serverA", id: "playerA" });
   *
   * const player = registry.Player.useWithKeys({ server: "serverA", id: "playerA" });
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   *
   * registry.Player.setWithKeys({ name: "Alice", score: 10 }, { server: "serverA", id: "playerA" });
   * console.log(player);
   * // -> { name: "Alice", score: 10 }
   * ```
   * @category Methods
   */
  useWithKeys(keys?: Keys<M["abiKeySchema"], T>): Properties<PS, T> | undefined;
  useWithKeys(keys?: Keys<M["abiKeySchema"], T>, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS>;

  /**
   * Set the properties of a record using its keys instead of the record itself.
   *
   * @param properties The properties to set.
   * @param keys The keys to use for encoding the record.
   * @example
   * This example sets the properties of a record in the "Player" table, on a specific server.
   *
   * ```ts
   * // The keys that get encoded as a record are: { server: "serverA", id: "playerA" }
   * registry.Player.setWithKeys({ name: "Alice", score: 10 }, { server: "serverA", id: "playerA" });
   * const player = registry.Player.getWithKeys({ server: "serverA", id: "playerA" });
   * console.log(player);
   * // -> { name: "Alice", score: 10 }
   * ```
   * @category Methods
   */
  setWithKeys(properties: Properties<PS, T>, keys?: Keys<M["abiKeySchema"], T>): void;

  /**
   * Get the keys properties of a record using its hex string representation.
   *
   * @param record The record to get the keys for.
   * @returns The keys properties of the record.
   * @example
   * This example retrieves the keys properties of a record in the "Player" table.
   *
   * ```ts
   * // `recordA` is a hex string representation of the keys properties: { server: "serverA", id: "playerA" }
   * const { recordA } = getRecord(); // for the sake of the example
   * registry.Player.set({ name: "Alice", score: 0 }, recordA);
   *
   * const keys = registry.Player.getRecordKeys(recordA);
   * console.log(keys);
   * // -> { server: "serverA", id: "playerA" }
   * ```
   * @category Methods
   */
  getRecordKeys: (record: Record) => Keys<M["abiKeySchema"], T>;
};
