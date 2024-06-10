import { Subject } from "rxjs";

import type {
  AbiKeySchema,
  AbiToSchema,
  ContractTableDef,
  MappedType,
  Metadata,
  Entity,
  EntitySymbol,
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
  properties: { [key in keyof PS]: Map<EntitySymbol, MappedType<T>[PS[key]]> };
  propertiesSchema: PS;
  // keySchema: KS | { entity: Type.Entity }; // default key schema for tables without keys
  metadata: M;
  world: World;
  entities: () => IterableIterator<Entity>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update$: Subject<TableUpdate<PS, M, T>> & { observers: any };
}

export type IndexedBaseTable<
  PS extends Schema = Schema,
  M extends BaseTableMetadata = BaseTableMetadata,
  T = unknown,
> = BaseTable<PS, M, T> & {
  getEntitysWithProperties: (properties: Properties<PS, T>) => Set<Entity>;
};

export type BaseTableMetadata<M extends Metadata = Metadata> = M & {
  name: string;
  globalName: string;
  namespace?: string;
  abiKeySchema: { [name: string]: StaticAbiType }; // local tables are given a default key schema as well for encoding/decoding entities
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
   * Get the current properties of an entity, or the table as a whole if it doesn't require any keys.
   *
   * @param entity (optional) The entity to get the properties for.
   * @param defaultProperties (optional) The default properties to return if the entity doesn't exist.
   * @returns The current properties of the entity.
   * @example
   * This example retrieves the current properties of the "Counter" table, which has only a single `value` property.
   *
   * ```ts
   * const count = tables.Counter.get();
   * console.log(count);
   * // -> { value: 0 }
   * ```
   * @category Methods
   */
  get(): Properties<PS, T> | undefined;
  get(entity: Entity | undefined): Properties<PS, T> | undefined;
  get(entity?: Entity | undefined, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;

  /**
   * Set the properties of an entity.
   *
   * @param properties The properties to set.
   * @param entity (optional) The entity to set the properties for.
   * @param options (optional) Additional {@link TableMutationOptions} for the mutation.
   * @example
   * This example sets the properties of the "Counter" table, which has only a single `value` property.
   *
   * ```ts
   * tables.Counter.set({ value: 10 });
   * const count = tables.Counter.get();
   * console.log(count);
   * // -> { value: 1° }
   * ```
   * @category Methods
   */
  set: (properties: Properties<PS, T>, entity?: Entity, options?: TableMutationOptions) => void;

  /**
   * Get all entities in the table.
   *
   * @returns All entities currently inside the table (having properties registered)
   * @example
   * This example retrieves all entities in the "Player" table.
   *
   * ```ts
   * tables.Player.set({ name: "Alice" }, recordA);
   * tables.Player.set({ name: "Bob" }, recordB);
   *
   * const players = tables.Player.getAll();
   * console.log(players);
   * // -> [recordA, recordB]
   * ```
   * @category Methods
   */
  getAll: () => Entity[];

  /**
   * Get all entities in the table with specific properties.
   *
   * @param properties The properties to match.
   * @returns All entities currently inside the table with the specified properties.
   * @example
   * This example retrieves all entities in the "Player" table with a score of 100.
   *
   * ```ts
   * tables.Player.set({ name: "Alice", score: 30 }, recordA);
   * tables.Player.set({ name: "Bob", score: 100 }, recordB);
   *
   * const players = tables.Player.getAllWith({ score: 100 });
   * console.log(players);
   * // -> [recordB]
   * ```
   * @category Methods
   */
  getAllWith: (properties: Partial<Properties<PS, T>>) => Entity[];

  /**
   * Get all entities in the table without specific properties.
   *
   * @param properties The properties to exclude.
   * @returns All entities currently inside the table without the specified properties.
   * @example
   * This example retrieves all entities in the "Player" table without a score of 0.
   *
   * ```ts
   * tables.Player.set({ name: "Alice", score: 30 }, recordA);
   * tables.Player.set({ name: "Bob", score: 0 }, recordB);
   *
   * const players = tables.Player.getAllWithout({ score: 0 });
   * console.log(players);
   * // -> [recordA]
   * ```
   * @category Methods
   */
  getAllWithout: (properties: Partial<Properties<PS, T>>) => Entity[];

  /**
   * Get all entities in the table with a React hook.
   *
   * @returns All entities currently inside the table (having properties registered), updated whenever data changes
   * within the table.
   * @example
   * This example retrieves all entities in the "Player" table.
   *
   * ```ts
   * const players = tables.Player.useAll();
   * console.log(players);
   * // -> []
   *
   * tables.Player.set({ name: "Alice" }, recordA);
   * console.log(players);
   * // -> [recordA]
   * ```
   * @category Methods
   */
  useAll: () => Entity[];

  /**
   * Get all entities in the table with specific properties with a React hook.
   *
   * @param properties The properties to match.
   * @returns All entities currently inside the table with the specified properties, updated whenever data changes
   * within the table.
   * @example
   * This example retrieves all entities in the "Player" table with a score of 100.
   *
   * ```ts
   * const players = tables.Player.useAllWith({ score: 100 });
   * console.log(players);
   * // -> []
   *
   * tables.Player.set({ name: "Alice", score: 100 }, recordA);
   * console.log(players);
   * // -> [recordA]
   *
   * tables.Player.update({ score: 200 }, recordA);
   * console.log(players);
   * // -> []
   * ```
   * @category Methods
   */
  useAllWith: (properties: Partial<Properties<PS, T>>) => Entity[];

  /**
   * Get all entities in the table without specific properties with a React hook.
   *
   * @param properties The properties to exclude.
   * @returns All entities currently inside the table without the specified properties, updated whenever data changes
   * within the table.
   * @example
   * This example retrieves all entities in the "Player" table without a score of 0.
   *
   * ```ts
   * const players = tables.Player.useAllWithout({ score: 0 });
   * console.log(players);
   * // -> []
   *
   * tables.Player.set({ name: "Alice", score: 30 }, recordA);
   * console.log(players);
   * // -> [recordA]
   *
   * tables.Player.update({ score: 0 }, recordA);
   * console.log(players);
   * // -> []
   * ```
   * @category Methods
   */
  useAllWithout: (properties: Partial<Properties<PS, T>>) => Entity[];

  /**
   * Remove an entity from the table.
   *
   * @param entity (optional) The entity to remove.
   * @example
   * This example removes an entity from the "Player" table.
   *
   * ```ts
   * tables.Player.set({ name: "Alice" }, recordA);
   * tables.Player.set({ name: "Bob" }, recordB);
   * const originalPlayers = tables.Player.getAll();
   * console.log(originalPlayers);
   * // -> [recordA, recordB]
   *
   * tables.Player.remove(recordA);
   * const players = tables.Player.getAll();
   * console.log(players);
   * // -> [recordB]
   * ```
   * @category Methods
   */
  remove: (entity?: Entity) => void;

  /**
   * Clear the table, removing all entities.
   *
   * @example
   * This example clears the "Player" table.
   *
   * ```ts
   * tables.Player.clear();
   * const players = tables.Player.getAll();
   * console.log(players);
   * // -> []
   * ```
   * @category Methods
   */
  clear: () => void;

  /**
   * Update the properties of an entity.
   *
   * Note: This will throw an error if the entity doesn't exist in the table (if it was never set).
   *
   * @param properties The properties to update (meaning not necessarily all properties need to be provided)
   * @param entity (optional) The entity to update the properties for.
   * @param options (optional) Additional {@link TableMutationOptions} for the mutation.
   * @example
   * This example updates the score of a player in the "Player" table.
   *
   * ```ts
   * tables.Player.set({ name: "Alice", score: 30 }, recordA);
   *
   * tables.Player.update({ score: 100 }, recordA);
   * const player = tables.Player.get(recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 100 }
   * ```
   * @category Methods
   */
  update: (properties: Partial<Properties<PS, T>>, entity?: Entity, options?: TableMutationOptions) => void;

  /**
   * Check if an entity exists in the table.
   *
   * @param entity (optional) The entity to check.
   * @returns Whether the entity exists in the table.
   * @example
   * This example checks if an entity exists in the "Player" table.
   *
   * ```ts
   * const exists = tables.Player.has(recordA);
   * console.log(exists);
   * // -> false
   *
   * tables.Player.set({ name: "Alice" }, recordA);
   * const existsNow = tables.Player.has(recordA);
   * console.log(existsNow);
   * // -> true
   * ```
   * @category Methods
   */
  has: (entity?: Entity) => boolean;

  /**
   * Get the current properties of an entity with a React hook.
   *
   * @param entity (optional) The entity to get the properties for.
   * @param defaultProperties (optional) The default properties to return if the entity doesn't exist.
   * @returns The current properties of the entity, updated whenever the data changes.
   * @example
   * This example retrieves the properties of an entity in the "Player" table.
   *
   * ```ts
   * const player = tables.Player.use(recordA, { name: "unknown", score: 0 });
   * console.log(player);
   * // -> { name: "unknown", score: 0 }
   *
   * tables.Player.set({ name: "Alice", score: 30 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 30 }
   *
   * ```
   * @category Methods
   */
  use(entity?: Entity | undefined): Properties<PS, T> | undefined;
  use(entity: Entity | undefined, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;

  // TODO: document
  blockUpdates: (entity?: Entity) => void;
  unblockUpdates: (entity?: Entity) => void;

  /**
   * Pause updates for an entity or the table as a whole, meaning it won't react to changes in the store anymore.
   *
   * @param entity (optional) The entity to pause updates for.
   * @param properties (optional) The properties to set when pausing updates.
   * @param options (optional) Additional {@link TableMutationOptions} for the mutation.
   * @example
   * This example pauses updates for an entity in the "Player" table.
   *
   * ```ts
   * const player = tables.Player.use(recordA);
   * tables.Player.set({ name: "Alice", score: 0 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   *
   * tables.Player.pauseUpdates(recordA);
   * tables.Player.update({ score: 30 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   * ```
   * @category Methods
   */
  pauseUpdates: (entity?: Entity, properties?: Properties<PS, T>, options?: TableMutationOptions) => void;

  /**
   * Enable updates for an entity or the table as a whole, meaning it will react to changes in the store again.
   *
   * @param entity (optional) The entity to enable updates for.
   * @param options (optional) Additional {@link TableMutationOptions} for the mutation.
   * @example
   * This example enables updates for an entity in the "Player" table after it's been paused.
   *
   * ```ts
   * const player = tables.Player.use(recordA);
   * tables.Player.set({ name: "Alice", score: 0 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   *
   * tables.Player.pauseUpdates(recordA);
   * tables.Player.update({ score: 30 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   *
   * tables.Player.resumeUpdates(recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 30 }
   * ```
   * @category Methods
   */
  resumeUpdates: (entity?: Entity, options?: TableMutationOptions) => void;

  /**
   * Create a watcher/listener for a table, on all changes or selective ones (enter, exit, change, any update).
   * This will listen to changes in the table and trigger callbacks when entities enter, exit, or change.
   *
   * @param options The {@link TableWatcherOptions} for creating the table watcher.
   * - `world` The RECS world containing the table to watch (abstracted).
   * - `table` The table to watch for changes (abstracted).
   * - `onChange` Callback triggered on any change in the table/query (encompassing enter, exit, and update).
   * - `onEnter` Callback triggered when an entity enters the table/query (`properties.prev` will be undefined).
   * - `onExit` Callback triggered when an entity exits the table/query (`properties.current` will be undefined).
   * - `onUpdate` Callback triggered when the properties of an entity are updated (within the query if provided).
   * @param params Additional {@link TableWatcherParams} for the watcher.
   * @example
   * This example creates a watcher for all entities within (with properties inside) the "Player" table.
   *
   * ```ts
   * const { tables } = createWrapper({ world, mudConfig });
   * tables.Player.set({ health: 100 }, playerRecord);
   *
   * // The function should be accessed from the table's methods
   * tables.Player.watch({
   *   onChange: (update) => console.log(update),
   * }, {
   *   runOnInit: false,
   * });
   * // no output
   *
   * tables.Player.update({ health: 90 }, playerRecord);
   * // -> { table: tables.Player, entity: playerRecord, current: { health: 90 }, prev: { health: 100 }, type: "change" }
   *
   * tables.Player.remove(playerRecord);
   * // -> { table: tables.Player, entity: playerRecord, current: undefined, prev: { health: 90 }, type: "exit" }
   * ```
   * @category Methods
   * @internal
   */
  watch: (options: Omit<TableWatcherOptions<PS, M, T>, "world" | "table">, params?: TableWatcherParams) => void;
};

/**
 * Defines the methods available strictly for contract tables, using keys as an alternative to the entity.
 *
 * @category Table
 * @internal
 */
export type TableWithKeysMethods<PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown> = {
  /**
   * Get the current properties of an entity using its keys instead of the entity itself.
   *
   * @param keys (optional) The keys to get the properties for.
   * @param defaultProperties (optional) The default properties to return if the entity doesn't exist.
   * @returns The current properties of the entity.
   * @example
   * This example retrieves the current properties of an entity in the "Player" table, on a specific server.
   *
   * ```ts
   * // The keys that get encoded as an entity are: { server: "serverA", id: "playerA" }
   * tables.Player.setWithKeys({ name: "Alice" }, { server: "serverA", id: "playerA" });
   *
   * const player = tables.Player.getWithKeys({ server: "serverA", id: "playerA" });
   * console.log(player);
   * // -> { name: "Alice" }
   * ```
   * @category Methods
   */
  getWithKeys(): Properties<PS, T> | undefined;
  getWithKeys(keys?: Keys<M["abiKeySchema"], T>): Properties<PS, T> | undefined;
  getWithKeys(keys?: Keys<M["abiKeySchema"], T>, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;

  /**
   * Check if an entity exists inside the table using its keys.
   *
   * @param keys (optional) The keys to use for encoding the entity.
   * @returns Whether the entity exists in the table.
   * @example
   * This example checks if an entity exists in the "Player" table, on a specific server.
   *
   * ```ts
   * // The keys that get encoded as an entity are: { server: "serverA", id: "playerA" }
   * tables.Player.setWithKeys({ name: "Alice" }, { server: "serverA", id: "playerA" });
   *
   * const exists = tables.Player.hasWithKeys({ server: "serverA", id: "playerA" });
   * console.log(exists);
   * // -> true
   *
   * const existsNot = tables.Player.hasWithKeys({ server: "serverB", id: "playerA" });
   * console.log(existsNot);
   * // -> false
   * ```
   * @category Methods
   */
  hasWithKeys: (keys?: Keys<M["abiKeySchema"], T>) => boolean;

  /**
   * Get the real-time properties of an entity by providing its keys instead of the entity itself.
   *
   * @param keys (optional) The keys to use for encoding the entity.
   * @param defaultProperties (optional) The default properties to return if the entity doesn't exist.
   * @returns The current updated properties of the entity.
   * @example
   * This example retrieves the current properties of an entity in the "Player" table, on a specific server.
   *
   * ```ts
   * // The keys that get encoded as an entity are: { server: "serverA", id: "playerA" }
   * tables.Player.setWithKeys({ name: "Alice", score: 0 }, { server: "serverA", id: "playerA" });
   *
   * const player = tables.Player.useWithKeys({ server: "serverA", id: "playerA" });
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   *
   * tables.Player.setWithKeys({ name: "Alice", score: 10 }, { server: "serverA", id: "playerA" });
   * console.log(player);
   * // -> { name: "Alice", score: 10 }
   * ```
   * @category Methods
   */
  useWithKeys(keys?: Keys<M["abiKeySchema"], T>): Properties<PS, T> | undefined;
  useWithKeys(keys?: Keys<M["abiKeySchema"], T>, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS>;

  /**
   * Set the properties of an entity using its keys instead of the entity itself.
   *
   * @param properties The properties to set.
   * @param keys The keys to use for encoding the entity.
   * @example
   * This example sets the properties of an entity in the "Player" table, on a specific server.
   *
   * ```ts
   * // The keys that get encoded as an entity are: { server: "serverA", id: "playerA" }
   * tables.Player.setWithKeys({ name: "Alice", score: 10 }, { server: "serverA", id: "playerA" });
   * const player = tables.Player.getWithKeys({ server: "serverA", id: "playerA" });
   * console.log(player);
   * // -> { name: "Alice", score: 10 }
   * ```
   * @category Methods
   */
  setWithKeys(properties: Properties<PS, T>, keys?: Keys<M["abiKeySchema"], T>): void;

  /**
   * Get the keys properties of an entity using its hex string representation.
   *
   * @param entity The entity to get the keys for.
   * @returns The keys properties of the entity.
   * @example
   * This example retrieves the keys properties of an entity in the "Player" table.
   *
   * ```ts
   * // `recordA` is a hex string representation of the keys properties: { server: "serverA", id: "playerA" }
   * tables.Player.set({ name: "Alice", score: 0 }, recordA);
   *
   * const keys = tables.Player.getEntityKeys(recordA);
   * console.log(keys);
   * // -> { server: "serverA", id: "playerA" }
   * ```
   * @category Methods
   */
  getEntityKeys: (entity: Entity) => Keys<M["abiKeySchema"], T>;
};
