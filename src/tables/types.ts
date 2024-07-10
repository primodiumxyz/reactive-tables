import { Subject } from "rxjs";

import type { TableMethodsOnceOptions, TableMethodsWatcherOptions, TableWatcherParams } from "@/queries/types";
import type { Entity, EntitySymbol } from "@/lib/external/mud/entity";
import type {
  BaseTableMetadata,
  ContractTableMetadata,
  ContractTablePropertiesSchema,
  Keys,
  MappedType,
  Properties,
  PropertiesSansMetadata,
  Schema,
} from "@/lib/external/mud/schema";
import type { World } from "@/lib/external/mud/world";
import type { ContractTableDef } from "@/lib/definitions";

/* -------------------------------------------------------------------------- */
/*                                   OBJECT                                   */
/* -------------------------------------------------------------------------- */

/* --------------------------------- GLOBAL --------------------------------- */
export type Tables = { [name: string]: Table };
export type Table<PS extends Schema = Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown> = BaseTable<
  PS,
  M,
  T
> &
  TableMethods<PS, M, T>;

/* -------------------------------- CONTRACT -------------------------------- */
export type ContractTables<tableDefs extends Record<string, ContractTableDef>> = {
  [name in keyof tableDefs]: ContractTable<tableDefs[name]>;
};

export type ContractTable<tableDef extends ContractTableDef = ContractTableDef> = Table<
  ContractTablePropertiesSchema<tableDef>,
  ContractTableMetadata<tableDef>
>;

/* --------------------------------- INDEXED -------------------------------- */
export type IndexedBaseTable<
  PS extends Schema = Schema,
  M extends BaseTableMetadata = BaseTableMetadata,
  T = unknown,
> = BaseTable<PS, M, T> & {
  getEntitiesWithProperties: (properties: Properties<PS, T>) => Set<Entity>;
};
export type IndexedTable<
  PS extends Schema = Schema,
  M extends BaseTableMetadata = BaseTableMetadata,
  T = unknown,
> = IndexedBaseTable<PS, M, T> & TableMethods<PS, M, T>;

/* ---------------------------------- BASE ---------------------------------- */
export interface BaseTables {
  [name: string]: BaseTable;
}
export interface BaseTable<PS extends Schema = Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown> {
  id: string;
  properties: { [key in keyof PS]: Map<EntitySymbol, MappedType<T>[PS[key]]> };
  propertiesSchema: PS;
  metadata: M;
  world: World;
  entities: () => IterableIterator<Entity>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update$: Subject<TableUpdate<PS, M, T>> & { observers: any };
}

/* -------------------------------------------------------------------------- */
/*                                   METHODS                                  */
/* -------------------------------------------------------------------------- */

/* -------------------------------- MUTATION -------------------------------- */
/**
 * Defines the type of update for an entity inside a specific table.
 *
 * - `enter` - The entity is now matching the query (or entering the table being watched).
 * - `exit` - The entity is no longer matching the query (or exiting the table being watched).
 * - `change` - The entity is still matching the query (or inside the table), but its properties have changed.
 * - `noop` - No change has occurred.
 * @category Queries
 */
export type UpdateType = "enter" | "exit" | "update" | "noop";

/**
 * Defines the characteristics of a table update.
 * @template PS The schema of the properties for all entities inside the table being watched.
 * @template M The metadata of the table.
 * @template T The type of the properties to match.
 * @param table The table subject to change (usually without methods, except if ran on init).
 * If the query covers multiple tables, and `runOnInit` is set to `true` (see {@link CreateTableWatcherOptions}), this will be `undefined`.
 * @param entity The entity for which the update has occurred.
 * @param properties The properties of the entity before and after the update (whatever is available).
 * If the entity is entering the query, `prev` will be `undefined`. If the entity is exiting the query, `current` will be `undefined`.
 * @param type The type of update that has occurred (see {@link UpdateType}).
 * @category Queries
 */
export type TableUpdate<PS extends Schema = Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown> = {
  table: BaseTable<PS, M, T> | Table<PS, M, T>;
  entity: Entity;
  properties: { current: Properties<PS, T> | undefined; prev: Properties<PS, T> | undefined };
  type: UpdateType;
};

export type TableMutationOptions = {
  skipUpdateStream?: boolean;
  persist?: boolean;
};

/* ---------------------------------- TABLE --------------------------------- */
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

  // useAllMatching
  /**
   * Get all entities in the table matching a specific condition with a React hook.
   *
   * @param where The condition to match.
   * @param deps (optional) Dependencies to update the `where` condition, similar as in a React `useMemo` or `useEffect` hook.
   * @returns All entities currently inside the table matching the specified condition, updated whenever data changes
   * within the table.
   * @example
   * This example retrieves all entities in the "Player" table with a score of more than 100.
   *
   * ```ts
   * const players = tables.Player.useAllMatching((properties) => properties.score > 100);
   * console.log(players);
   * // -> []
   *
   * tables.Player.set({ name: "Alice", score: 200 }, recordA);
   * console.log(players);
   * // -> [recordA]
   *
   * tables.Player.update({ score: 50 }, recordA);
   * console.log(players);
   * // -> []
   * ```
   *
   * @exemple
   * This example retrieves all entities in the "Player" table with a dynamic score parameter.
   *
   * ```ts
   * const { requiredScore, setRequiredScore } = useRequiredScore();
   * console.log(requiredScore);
   * // -> 100
   *
   * const players = tables.Player.useAllMatching((properties) => properties.score > requiredScore, [requiredScore]);
   * console.log(players);
   * // -> []
   *
   * tables.Player.set({ name: "Alice", score: 200 }, recordA);
   * console.log(players);
   * // -> [recordA]
   *
   * setRequiredScore(500);
   * console.log(players);
   * // -> []
   * ```
   *
   * @category Methods
   */
  useAllMatching: (where: (properties: Properties<PS, T>) => boolean, deps?: unknown[]) => Entity[];

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

  /**
   * Block updates for an entity or the table as a whole, meaning it won't react to changes anymore.
   *
   * Note: This won't record the updates anymore, thus not keeping track of the tables update for an entity
   * as long as it's blocked.
   *
   * @param entity (optional) The entity to block updates for.
   * @example
   * This example blocks updates for an entity in the "Player" table.
   *
   * ```ts
   * const player = tables.Player.use(recordA);
   * tables.Player.set({ name: "Alice", score: 0 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   *
   * tables.Player.blockUpdates(recordA);
   * tables.Player.update({ score: 30 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   * ```
   * @category Methods
   * @internal
   */
  blockUpdates: (entity?: Entity) => void;

  /**
   * Unblock updates for an entity or the table as a whole, meaning it will react to changes again.
   *
   * Note: The updates will start being recorded for the entity again, but the table will be resumed to
   * its state before it was blocked.
   *
   * @param entity (optional) The entity to unblock updates for.
   * @example
   * This example unblocks updates for an entity in the "Player" table after it's been blocked.
   *
   * ```ts
   * const player = tables.Player.use(recordA);
   * tables.Player.set({ name: "Alice", score: 0 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   *
   * tables.Player.blockUpdates(recordA);
   * tables.Player.update({ score: 30 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   *
   * tables.Player.unblockUpdates(recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 0 }
   *
   * tables.Player.update({ score: 30 }, recordA);
   * console.log(player);
   * // -> { name: "Alice", score: 30 }
   * ```
   * @category Methods
   * @internal
   */
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
   * @param options The {@link TableMethodsWatcherOptions} for creating the table watcher.
   * - `world` The RECS world containing the table to watch (optional, default global world).
   * - `onUpdate` Callback triggered when the properties of an entity are updated (within the query if provided).
   * - `onEnter` Callback triggered when an entity enters the table/query (`properties.prev` will be undefined).
   * - `onExit` Callback triggered when an entity exits the table/query (`properties.current` will be undefined).
   * - `onChange` Callback triggered on any change in the table/query (encompassing enter, exit, and update).
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
   *   onUpdate: (update) => console.log(update),
   * }, {
   *   runOnInit: false,
   * });
   * // no output
   *
   * tables.Player.update({ health: 90 }, playerRecord);
   * // -> { table: tables.Player, entity: playerRecord, current: { health: 90 }, prev: { health: 100 }, type: "update" }
   *
   * tables.Player.remove(playerRecord);
   * // -> { table: tables.Player, entity: playerRecord, current: undefined, prev: { health: 90 }, type: "exit" }
   * ```
   * @category Methods
   * @internal
   */
  watch: (options: TableMethodsWatcherOptions<PS, M, T>, params?: TableWatcherParams) => void;

  /**
   * Create a watcher that triggers `do` once `filter` returns true.
   *
   * This allows for a one-time trigger, based on some condition checked against the updates.
   * The watcher will automatically unsubscribe after the first trigger.
   *
   * @param options The {@link TableMethodsOnceOptions} for creating the table watcher.
   * - `world` The RECS world containing the table to watch (optional, default global world).
   * - `filter` The condition to check against the updates.
   * - `do` Callback triggered when the condition is met.
   * @param params Additional {@link TableWatcherParams} for the watcher.
   * @example
   * This example creates a watcher for the "Player" table that triggers once the score of a player is 100 or more.
   *
   * ```ts
   * const { tables } = createWrapper({ world, mudConfig });
   * tables.Player.set({ score: 50 }, playerRecord);
   *
   * tables.Player.once({
   *   filter: (update) => update.properties.current?.score >= 100,
   *   do: (update) => console.log(update),
   * });
   * // no output
   *
   * tables.Player.update({ score: 100 }, playerRecord);
   * // -> { table: tables.Player, entity: playerRecord, current: { score: 100 }, prev: { score: 50 }, type: "update" }
   *
   * tables.Player.set({ score: 100 }, otherPlayerRecord);
   * // no output, since the subscription was disposed after the first trigger
   * ```
   * @category Methods
   * @internal
   */
  once: (options: TableMethodsOnceOptions<PS, M, T>, params?: TableWatcherParams) => void;
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
