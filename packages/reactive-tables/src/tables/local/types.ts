import { BaseTableMetadata, OriginalTableMethods, Properties } from "@/tables";
import { CreateTableWatcherOptions, CreateTableWatcherResult } from "@/queries";
import { Metadata, $Record, Schema } from "@/lib";

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
export type LocalTable<
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
export type LocalTableMetadata<S extends Schema, M extends Metadata = Metadata> = M &
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
export type LocalTableMethods<S extends Schema, T = unknown> = OriginalTableMethods & {
  /**
   * Get the current properties of a record, or the table as a whole if it doesn't require any keys.
   *
   * @param $record (optional) The record to get the properties for.
   * @param defaultProps (optional) The default properties to return if the record doesn't exist.
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
  get($record?: $Record | undefined, defaultProps?: Properties<S, T>): Properties<S, T>;

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
   * const { recordA, recordB } = getRecords(); // for the sake of the example
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
   * const { recordA, recordB } = getRecords(); // for the sake of the example
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
   * const { recordA, recordB } = getRecords(); // for the sake of the example
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
   * const { recordA } = getRecords(); // for the sake of the example
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
   * const { recordA } = getRecords(); // for the sake of the example
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
   * const { recordA } = getRecords(); // for the sake of the example
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
   * const { recordA, recordB } = getRecords(); // for the sake of the example
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
   * @param defaultProps (optional) The default properties to return if the record doesn't exist.
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
  use($record: $Record | undefined, defaultProps?: Properties<S, T>): Properties<S, T>;

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
   * Create a watcher for the table, either globally (on all changes) or within a TinyQL query.
   *
   * See {@link createTableWatcher} for detailed information on the configuration and behavior of the watcher.
   *
   * @param options The options for the watcher. Including:
   * - `query` - (optional) A TinyQL query to filter the records. If not provided, it will watch all records in the table without discrimination.
   * - `onChange` - Callback triggered on any change in the table/query (encompassing enter, exit, and update).
   * - `onEnter` - Callback triggered when a record enters the table/query (`properties.prev` will be undefined).
   * - `onExit` - Callback triggered when a record exits the table/query (`properties.current` will be undefined).
   * - `onUpdate` - Callback triggered when the properties of a record are updated (within the query if provided).
   * - `runOnInit` - Whether to trigger the callbacks for all matching records on initialization.
   * @returns An object with an `unsubscribe` method to stop listening to the table.
   * This example creates a watcher for all records within the "Player" table.
   *
   * ```ts
   * const { recordA } = getRecords(); // for the sake of the example
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
   * This example creates a watcher for all records with more than 10 points in the "Player" table.
   *
   * ```ts
   * const { recordA, recordB } = getRecords(); // for the sake of the example
   * registry.Player.set({ score: 0 }, recordA);
   * registry.Player.set({ score: 20 }, recordB);
   *
   * registry.Player.watch({
   *   onChange: (update) => console.log(update),
   *   query: ({ where }) => {
   *     where((getCell) => (getCell("score") as number) > 10);
   *   },
   * }, {
   *   runOnInit: false,
   * });
   * // -> no output
   *
   * registry.Player.update({ score: 15 }, recordA);
   * // -> { table: registry.Player, $record: recordA, current: { score: 15 }, prev: { score: 0 }, type: "enter" }
   *
   * registry.Player.update({ points: 0 }, recordB);
   * // -> { table: registry.Player, $record: recordB, current: undefined, prev: { score: 20 }, type: "exit" }
   * ```
   * @category Methods
   */
  watch: (options: Omit<CreateTableWatcherOptions<S, T>, "queries" | "tableId" | "schema">) => CreateTableWatcherResult;
};
