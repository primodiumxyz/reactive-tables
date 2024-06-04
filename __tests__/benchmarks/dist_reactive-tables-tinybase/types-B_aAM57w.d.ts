import {
  ValueSchema as ValueSchema$1,
  KeySchema as KeySchema$1,
  SchemaToPrimitives,
} from "@latticexyz/protocol-parser/internal";
import { Hex } from "viem";
import { SchemaAbiType, DynamicPrimitiveType, StaticPrimitiveType } from "@latticexyz/schema-type/internal";
import { ValueSchema, KeySchema, Table, Tables } from "@latticexyz/store/internal";
import { Store as Store$2 } from "@latticexyz/store";
import { ResolvedStoreConfig } from "@latticexyz/store/config";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Select, Join, Where, Group, Having, Queries } from "tinybase/queries";
import { Store as Store$1 } from "tinybase/store";

/**
 * Defines the schema of a properties record inside a {@link ContractTable} or {@link LocalTable}.
 *
 * It uses a {@link Type} enum to be able to infer the TypeScript type of each property.
 *
 * @category Tables
 */
type Schema = {
  [key: string]: Type;
};
/**
 * Defines any additional metadata that can be attached to a {@link ContractTable} or {@link LocalTable}.
 *
 * @category Tables
 */
type Metadata =
  | {
      [key: string]: unknown;
    }
  | undefined;
/**
 * Used to specify the types for properties, and infer their TypeScript type.
 *
 * Note: This is modified from RECS.
 *
 * @category Tables
 */
declare enum Type {
  Boolean = 0,
  Number = 1,
  OptionalNumber = 2,
  BigInt = 3,
  OptionalBigInt = 4,
  String = 5,
  OptionalString = 6,
  NumberArray = 7,
  OptionalNumberArray = 8,
  BigIntArray = 9,
  OptionalBigIntArray = 10,
  StringArray = 11,
  OptionalStringArray = 12,
  Hex = 13,
  OptionalHex = 14,
  HexArray = 15,
  OptionalHexArray = 16,
  $Record = 17,
  Optional$Record = 18,
  $RecordArray = 19,
  Optional$RecordArray = 20,
  T = 21,
  OptionalT = 22,
}
/**
 * Defines a mapping between JavaScript {@link Type} enums and their corresponding TypeScript types.
 *
 * @category Tables
 */
type PropertiesType<T = unknown> = {
  [Type.Boolean]: boolean;
  [Type.Number]: number;
  [Type.BigInt]: bigint;
  [Type.String]: string;
  [Type.Hex]: Hex;
  [Type.$Record]: $Record;
  [Type.NumberArray]: number[];
  [Type.BigIntArray]: bigint[];
  [Type.StringArray]: string[];
  [Type.HexArray]: Hex[];
  [Type.$RecordArray]: $Record[];
  [Type.OptionalNumber]: number | undefined;
  [Type.OptionalBigInt]: bigint | undefined;
  [Type.OptionalString]: string | undefined;
  [Type.OptionalHex]: Hex | undefined;
  [Type.Optional$Record]: $Record | undefined;
  [Type.OptionalNumberArray]: number[] | undefined;
  [Type.OptionalBigIntArray]: bigint[] | undefined;
  [Type.OptionalStringArray]: string[] | undefined;
  [Type.OptionalHexArray]: Hex[] | undefined;
  [Type.Optional$RecordArray]: $Record[] | undefined;
  [Type.T]: T;
  [Type.OptionalT]: T | undefined;
};
/**
 * Convert a schema ABI type to an TypeScript understandable type.
 *
 * Note: This is copied from the RECS library.
 *
 * @see [@]latticexyz/store-sync/recs/schemaAbiTypeToRecsType.ts
 * @category RECS
 */
declare const schemaAbiTypeToRecsType: {
  readonly uint8: Type.Number;
  readonly uint16: Type.Number;
  readonly uint24: Type.Number;
  readonly uint32: Type.Number;
  readonly uint40: Type.Number;
  readonly uint48: Type.Number;
  readonly uint56: Type.BigInt;
  readonly uint64: Type.BigInt;
  readonly uint72: Type.BigInt;
  readonly uint80: Type.BigInt;
  readonly uint88: Type.BigInt;
  readonly uint96: Type.BigInt;
  readonly uint104: Type.BigInt;
  readonly uint112: Type.BigInt;
  readonly uint120: Type.BigInt;
  readonly uint128: Type.BigInt;
  readonly uint136: Type.BigInt;
  readonly uint144: Type.BigInt;
  readonly uint152: Type.BigInt;
  readonly uint160: Type.BigInt;
  readonly uint168: Type.BigInt;
  readonly uint176: Type.BigInt;
  readonly uint184: Type.BigInt;
  readonly uint192: Type.BigInt;
  readonly uint200: Type.BigInt;
  readonly uint208: Type.BigInt;
  readonly uint216: Type.BigInt;
  readonly uint224: Type.BigInt;
  readonly uint232: Type.BigInt;
  readonly uint240: Type.BigInt;
  readonly uint248: Type.BigInt;
  readonly uint256: Type.BigInt;
  readonly int8: Type.Number;
  readonly int16: Type.Number;
  readonly int24: Type.Number;
  readonly int32: Type.Number;
  readonly int40: Type.Number;
  readonly int48: Type.Number;
  readonly int56: Type.BigInt;
  readonly int64: Type.BigInt;
  readonly int72: Type.BigInt;
  readonly int80: Type.BigInt;
  readonly int88: Type.BigInt;
  readonly int96: Type.BigInt;
  readonly int104: Type.BigInt;
  readonly int112: Type.BigInt;
  readonly int120: Type.BigInt;
  readonly int128: Type.BigInt;
  readonly int136: Type.BigInt;
  readonly int144: Type.BigInt;
  readonly int152: Type.BigInt;
  readonly int160: Type.BigInt;
  readonly int168: Type.BigInt;
  readonly int176: Type.BigInt;
  readonly int184: Type.BigInt;
  readonly int192: Type.BigInt;
  readonly int200: Type.BigInt;
  readonly int208: Type.BigInt;
  readonly int216: Type.BigInt;
  readonly int224: Type.BigInt;
  readonly int232: Type.BigInt;
  readonly int240: Type.BigInt;
  readonly int248: Type.BigInt;
  readonly int256: Type.BigInt;
  readonly bytes1: Type.Hex;
  readonly bytes2: Type.Hex;
  readonly bytes3: Type.Hex;
  readonly bytes4: Type.Hex;
  readonly bytes5: Type.Hex;
  readonly bytes6: Type.Hex;
  readonly bytes7: Type.Hex;
  readonly bytes8: Type.Hex;
  readonly bytes9: Type.Hex;
  readonly bytes10: Type.Hex;
  readonly bytes11: Type.Hex;
  readonly bytes12: Type.Hex;
  readonly bytes13: Type.Hex;
  readonly bytes14: Type.Hex;
  readonly bytes15: Type.Hex;
  readonly bytes16: Type.Hex;
  readonly bytes17: Type.Hex;
  readonly bytes18: Type.Hex;
  readonly bytes19: Type.Hex;
  readonly bytes20: Type.Hex;
  readonly bytes21: Type.Hex;
  readonly bytes22: Type.Hex;
  readonly bytes23: Type.Hex;
  readonly bytes24: Type.Hex;
  readonly bytes25: Type.Hex;
  readonly bytes26: Type.Hex;
  readonly bytes27: Type.Hex;
  readonly bytes28: Type.Hex;
  readonly bytes29: Type.Hex;
  readonly bytes30: Type.Hex;
  readonly bytes31: Type.Hex;
  readonly bytes32: Type.Hex;
  readonly bool: Type.Boolean;
  readonly address: Type.Hex;
  readonly "uint8[]": Type.NumberArray;
  readonly "uint16[]": Type.NumberArray;
  readonly "uint24[]": Type.NumberArray;
  readonly "uint32[]": Type.NumberArray;
  readonly "uint40[]": Type.NumberArray;
  readonly "uint48[]": Type.NumberArray;
  readonly "uint56[]": Type.BigIntArray;
  readonly "uint64[]": Type.BigIntArray;
  readonly "uint72[]": Type.BigIntArray;
  readonly "uint80[]": Type.BigIntArray;
  readonly "uint88[]": Type.BigIntArray;
  readonly "uint96[]": Type.BigIntArray;
  readonly "uint104[]": Type.BigIntArray;
  readonly "uint112[]": Type.BigIntArray;
  readonly "uint120[]": Type.BigIntArray;
  readonly "uint128[]": Type.BigIntArray;
  readonly "uint136[]": Type.BigIntArray;
  readonly "uint144[]": Type.BigIntArray;
  readonly "uint152[]": Type.BigIntArray;
  readonly "uint160[]": Type.BigIntArray;
  readonly "uint168[]": Type.BigIntArray;
  readonly "uint176[]": Type.BigIntArray;
  readonly "uint184[]": Type.BigIntArray;
  readonly "uint192[]": Type.BigIntArray;
  readonly "uint200[]": Type.BigIntArray;
  readonly "uint208[]": Type.BigIntArray;
  readonly "uint216[]": Type.BigIntArray;
  readonly "uint224[]": Type.BigIntArray;
  readonly "uint232[]": Type.BigIntArray;
  readonly "uint240[]": Type.BigIntArray;
  readonly "uint248[]": Type.BigIntArray;
  readonly "uint256[]": Type.BigIntArray;
  readonly "int8[]": Type.NumberArray;
  readonly "int16[]": Type.NumberArray;
  readonly "int24[]": Type.NumberArray;
  readonly "int32[]": Type.NumberArray;
  readonly "int40[]": Type.NumberArray;
  readonly "int48[]": Type.NumberArray;
  readonly "int56[]": Type.BigIntArray;
  readonly "int64[]": Type.BigIntArray;
  readonly "int72[]": Type.BigIntArray;
  readonly "int80[]": Type.BigIntArray;
  readonly "int88[]": Type.BigIntArray;
  readonly "int96[]": Type.BigIntArray;
  readonly "int104[]": Type.BigIntArray;
  readonly "int112[]": Type.BigIntArray;
  readonly "int120[]": Type.BigIntArray;
  readonly "int128[]": Type.BigIntArray;
  readonly "int136[]": Type.BigIntArray;
  readonly "int144[]": Type.BigIntArray;
  readonly "int152[]": Type.BigIntArray;
  readonly "int160[]": Type.BigIntArray;
  readonly "int168[]": Type.BigIntArray;
  readonly "int176[]": Type.BigIntArray;
  readonly "int184[]": Type.BigIntArray;
  readonly "int192[]": Type.BigIntArray;
  readonly "int200[]": Type.BigIntArray;
  readonly "int208[]": Type.BigIntArray;
  readonly "int216[]": Type.BigIntArray;
  readonly "int224[]": Type.BigIntArray;
  readonly "int232[]": Type.BigIntArray;
  readonly "int240[]": Type.BigIntArray;
  readonly "int248[]": Type.BigIntArray;
  readonly "int256[]": Type.BigIntArray;
  readonly "bytes1[]": Type.HexArray;
  readonly "bytes2[]": Type.HexArray;
  readonly "bytes3[]": Type.HexArray;
  readonly "bytes4[]": Type.HexArray;
  readonly "bytes5[]": Type.HexArray;
  readonly "bytes6[]": Type.HexArray;
  readonly "bytes7[]": Type.HexArray;
  readonly "bytes8[]": Type.HexArray;
  readonly "bytes9[]": Type.HexArray;
  readonly "bytes10[]": Type.HexArray;
  readonly "bytes11[]": Type.HexArray;
  readonly "bytes12[]": Type.HexArray;
  readonly "bytes13[]": Type.HexArray;
  readonly "bytes14[]": Type.HexArray;
  readonly "bytes15[]": Type.HexArray;
  readonly "bytes16[]": Type.HexArray;
  readonly "bytes17[]": Type.HexArray;
  readonly "bytes18[]": Type.HexArray;
  readonly "bytes19[]": Type.HexArray;
  readonly "bytes20[]": Type.HexArray;
  readonly "bytes21[]": Type.HexArray;
  readonly "bytes22[]": Type.HexArray;
  readonly "bytes23[]": Type.HexArray;
  readonly "bytes24[]": Type.HexArray;
  readonly "bytes25[]": Type.HexArray;
  readonly "bytes26[]": Type.HexArray;
  readonly "bytes27[]": Type.HexArray;
  readonly "bytes28[]": Type.HexArray;
  readonly "bytes29[]": Type.HexArray;
  readonly "bytes30[]": Type.HexArray;
  readonly "bytes31[]": Type.HexArray;
  readonly "bytes32[]": Type.HexArray;
  readonly "bool[]": Type.T;
  readonly "address[]": Type.HexArray;
  readonly bytes: Type.Hex;
  readonly string: Type.String;
};
/**
 * Infer a TypeScript-understandable type (an enum associated with the type) from a schema ABI type.
 *
 * Note: This is copied from the RECS library.
 *
 * @see [@]latticexyz/store-sync/recs/schemaAbiTypeToRecsType.ts
 * @category RECS
 */
type SchemaAbiTypeToRecsType<T extends SchemaAbiType> = (typeof schemaAbiTypeToRecsType)[T];

/**
 * Defines the type of update for a record inside a specific table.
 *
 * - `enter` - The record is now matching the query (or entering the table being watched).
 * - `exit` - The record is no longer matching the query (or exiting the table being watched).
 * - `change` - The record is still matching the query (or inside the table), but its properties have changed.
 * @category Queries
 */
type UpdateType = "enter" | "exit" | "change";
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
type TableUpdate<S extends Schema = Schema, T = unknown> = {
  tableId: string | undefined;
  $record: $Record;
  properties: {
    current: Properties<S, T> | undefined;
    prev: Properties<S, T> | undefined;
  };
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
type TableWatcherCallbacks<S extends Schema, T = unknown> = Partial<{
  onChange: (update: TableUpdate<S, T>) => void;
  onEnter: (update: TableUpdate<S, T>) => void;
  onExit: (update: TableUpdate<S, T>) => void;
  onUpdate: (update: TableUpdate<S, T>) => void;
}>;
/**
 * Defines additional options for watching records inside a specific table.
 * @param runOnInit Whether to trigger the callbacks for all matching records on initialization (default: `true`).
 * @category Queries
 * @internal
 */
type TableWatcherParams = {
  runOnInit?: boolean;
};
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
  properties: Partial<Properties<AbiToPropertiesSchema<tableDef["valueSchema"]>, T>>;
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
type QueryOptions<tableDefs extends ContractTableDef[], T = unknown> = {
  with?: ContractTable<tableDefs[number]>[];
  withProperties?: QueryMatchingProperties<tableDefs[number], T>[];
  without?: ContractTable<tableDefs[number]>[];
  withoutProperties?: QueryMatchingProperties<tableDefs[number], T>[];
};
/**
 * Defines keywords available for writing a TinyQL query.
 *
 * @category Queries
 * @internal
 */
type TinyQLQueryKeywords = {
  select: Select;
  join: Join;
  where: Where;
  group: Group;
  having: Having;
};
/**
 * Defines the options for creating a watcher for a table, either globally (on all changes) or within a TinyQL query.
 *
 * @template S The schema of the properties inside the table to watch.
 * @template T The type of the properties.
 * @param query A TinyQL query to filter the records, using {@link TinyQLQueryKeywords}. If not provided, it will watch all records in the table without discrimination.
 * @see {@link CreateTableWatcherOptions} for the base options.
 * @see TinyQL for writing a query: https://tinybase.org/guides/making-queries/tinyql/
 * @category Queries
 * @internal
 */
type CreateTableWatcherOptions<S extends Schema, T = unknown> = Omit<CreateQueryWatcherOptions<S, T>, "queryId"> & {
  query?: (keywords: TinyQLQueryKeywords) => void;
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
 * @see {@link TableWatcherCallbacks}
 * @category Queries
 * @internal
 */
type CreateQueryWatcherOptions<S extends Schema, T = unknown> = {
  queries: Queries;
  queryId: string;
  tableId: string;
  schema: S;
} & TableWatcherCallbacks<S, T>;
/**
 * Defines the result of watching records inside a specific table.
 * @param unsubscribe The method to call to stop watching the table (disposes of the listener).
 * @category Queries
 * @internal
 */
type CreateTableWatcherResult = {
  unsubscribe: () => void;
};

type BaseTableMetadata<S extends Schema = Schema> = {
  readonly tableId: Hex;
  readonly namespace: string;
  readonly name: string;
  readonly schema: S;
};
type Properties<S extends Schema, T = unknown> = {
  [key in keyof S]: PropertiesType<T>[S[key]];
};
type PropertiesSansMetadata<S extends Schema, T = unknown> = {
  [key in keyof S as Exclude<
    key,
    "__staticData" | "__encodedLengths" | "__dynamicData" | "__lastSyncedAtBlock"
  >]: PropertiesType<T>[S[key]];
};
type OriginalTableMethods = {
  $records: () => IterableIterator<$Record>;
};

/**
 * Defines a {@link ContractTable} record.
 *
 * @category Table
 */
type ContractTables<tableDefs extends ContractTableDefs> = {
  [tableName in keyof tableDefs]: ContractTable<tableDefs[tableName]>;
};
/**
 * Defines a contract table, including its metadata and methods.
 *
 * Note: See {@link ContractTableMethods} and {@link ContractTableWithKeysMethods} for more information about its methods.
 *
 * @template tableDef The original {@link ContractTableDef} of the table.
 * @template S The {@link Schema} of the properties for each row inside the table.
 * @template M Any additional {@link Metadata}.
 * @template T Specific types for its properties.
 * @param id The hex id of the table.
 * @param schema The {@link Schema} of the properties for each row inside the table.
 * @param metadata Any additional {@link Metadata}, as well as:
 * - `name` - The name of the table.
 * - `globalName` - The name of the table prefixed by its namespace.
 * - `keySchema` - The {@link KeySchema} of the properties for each row inside the table.
 * - `propertiesSchema` - The {@link PropertiesSchema} of the properties for each row inside the table.
 * @category Table
 */
type ContractTable<
  tableDef extends ContractTableDef = ContractTableDef,
  S extends Schema = Schema,
  M extends Metadata = Metadata,
  T = unknown,
  PS extends Schema = AbiToPropertiesSchema<tableDef["valueSchema"]>,
  KS extends Schema = AbiToKeySchema<tableDef["keySchema"]>,
> = ContractTableMethods<PS, T> &
  ContractTableWithKeysMethods<PS, KS, T> & {
    readonly id: tableDef["tableId"];
    readonly schema: S;
    readonly metadata: M & {
      readonly name: tableDef["name"];
      readonly globalName: `${tableDef["namespace"]}__${tableDef["name"]}`;
      readonly keySchema: KS;
      readonly propertiesSchema: PS;
    };
  };
/**
 * Converts an ABI type to its corresponding Typescript-understandable type (PropertiesSchema).
 *
 * @category Table
 */
type AbiToPropertiesSchema<schema extends ValueSchema | ValueSchema$1> = {
  [fieldName in keyof schema & string]: SchemaAbiTypeToRecsType<
    SchemaAbiType & (schema extends ValueSchema ? schema[fieldName]["type"] : schema[fieldName])
  >;
} & {
  __staticData: Type.OptionalString;
  __encodedLengths: Type.OptionalString;
  __dynamicData: Type.OptionalString;
  __lastSyncedAtBlock: Type.OptionalBigInt;
};
/**
 * Converts an ABI type to its corresponding Typescript-understandable type (KeySchema).
 *
 * @category Table
 */
type AbiToKeySchema<schema extends KeySchema | KeySchema$1> = {
  [fieldName in keyof schema & string]: SchemaAbiTypeToRecsType<
    SchemaAbiType & (schema extends KeySchema ? schema[fieldName]["type"] : schema[fieldName])
  >;
};
/**
 * Defines the base methods available for a contract table.
 *
 * Note: This extends the {@link OriginalTableMethods} for better compatibility with RECS.
 *
 * @category Table
 * @internal
 */
type ContractTableMethods<PS extends Schema, T = unknown> = OriginalTableMethods & {
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
  get(): Properties<PS, T> | undefined;
  get($record: $Record | undefined): Properties<PS, T> | undefined;
  get($record?: $Record | undefined, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;
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
  set: (properties: Properties<PS, T>, $record?: $Record) => void;
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
  getAllWith: (properties: Partial<Properties<PS, T>>) => $Record[];
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
  getAllWithout: (properties: Partial<Properties<PS, T>>) => $Record[];
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
  useAllWith: (properties: Partial<Properties<PS, T>>) => $Record[];
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
  useAllWithout: (properties: Partial<Properties<PS, T>>) => $Record[];
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
  update: (properties: Partial<Properties<PS, T>>, $record?: $Record) => void;
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
  use($record?: $Record | undefined): Properties<PS, T> | undefined;
  use($record: $Record | undefined, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;
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
  pauseUpdates: ($record?: $Record, properties?: Properties<PS, T>) => void;
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
    options: Omit<CreateTableWatcherOptions<PS, T>, "queries" | "tableId" | "schema">,
    params?: TableWatcherParams,
  ) => CreateTableWatcherResult;
};
/**
 * Defines the methods available strictly for contract tables, using keys as an alternative to the record.
 *
 * @category Table
 * @internal
 */
type ContractTableWithKeysMethods<PS extends Schema, KS extends Schema, T = unknown> = {
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
  getWithKeys(keys?: Properties<KS, T>): Properties<PS, T> | undefined;
  getWithKeys(keys?: Properties<KS, T>, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;
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
  hasWithKeys: (keys?: Properties<KS, T>) => boolean;
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
  useWithKeys(keys?: Properties<KS, T>): Properties<PS, T> | undefined;
  useWithKeys(keys?: Properties<KS, T>, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS>;
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
  setWithKeys(properties: Properties<PS, T>, keys?: Properties<KS, T>): void;
  /**
   * Get the keys properties of a record using its hex string representation.
   *
   * @param $record The record to get the keys for.
   * @returns The keys properties of the record.
   * @example
   * This example retrieves the keys properties of a record in the "Player" table.
   *
   * ```ts
   * // `recordA` is a hex string representation of the keys properties: { server: "serverA", id: "playerA" }
   * const { recordA } = getRecord(); // for the sake of the example
   * registry.Player.set({ name: "Alice", score: 0 }, recordA);
   *
   * const keys = registry.Player.get$RecordKeys(recordA);
   * console.log(keys);
   * // -> { server: "serverA", id: "playerA" }
   * ```
   * @category Methods
   */
  get$RecordKeys: ($record: $Record) => Properties<KS, T>;
};

/**
 * Defines a native non-persistent TinyBase store, appended with its associated queries object.
 *
 * @category Tables
 */
type BaseStore = Store$1 & {
  getQueries: () => Queries;
};
/**
 * Defines a persistent TinyBase store, appended with its associated queries object, and additional methods to dispose of
 * the synchronization with the local storage and to check if the sync is ready.
 *
 * @category Tables
 */
type PersistentStore = BaseStore & {
  dispose: () => void;
  ready: Promise<boolean>;
};
/**
 * Defines a function that returns a TinyBase store, either a base store or a persistent store.
 *
 * Note: The persistent store is only available on the browser.
 *
 * Note: The persistent store can be used for storing properties inside a local table.
 *
 * @category Tables
 */
type Store = {
  (): BaseStore;
  (key: "PERSIST"): PersistentStore;
};

/**
 * Defines the MUD store configuration provided to the wrapper.
 *
 * @category Tables
 */
type StoreConfig = Store$2;
/**
 * Defines a contract table definition initially provided to the wrapper.
 *
 * @param tableId The id of the table.
 * @param namespace The namespace of the table inside the global scope.
 * @param name The name of the table.
 * @param keySchema The schema of the keys to differenciate records.
 * @param valueSchema The schema of the properties associated with each record.
 * @category Tables
 */
type ContractTableDef = Table;
/**
 * Defines a mapping of strings to their {@link ContractTableDef}, as initially provided to the wrapper.
 *
 * @category Tables
 */
type ContractTableDefs = Tables;
declare const storeTableDefs: {
  StoreHooks: {
    keySchema: {
      tableId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
    };
    valueSchema: {
      hooks: {
        type: "bytes21[]";
        internalType: "bytes21[]";
      };
    };
    namespace: string;
    name: "StoreHooks";
    tableId: `0x${string}`;
  };
  Tables: {
    keySchema: {
      tableId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
    };
    valueSchema: {
      keySchema: {
        type: "bytes32";
        internalType: "Schema";
      };
      valueSchema: {
        type: "bytes32";
        internalType: "Schema";
      };
      fieldLayout: {
        type: "bytes32";
        internalType: "FieldLayout";
      };
      abiEncodedKeyNames: {
        type: "bytes";
        internalType: "bytes";
      };
      abiEncodedFieldNames: {
        type: "bytes";
        internalType: "bytes";
      };
    };
    namespace: string;
    name: "Tables";
    tableId: `0x${string}`;
  };
  ResourceIds: {
    keySchema: {
      resourceId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
    };
    valueSchema: {
      exists: {
        type: "bool";
        internalType: "bool";
      };
    };
    namespace: string;
    name: "ResourceIds";
    tableId: `0x${string}`;
  };
  Hooks: {
    keySchema: {
      resourceId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
    };
    valueSchema: {
      hooks: {
        type: "bytes21[]";
        internalType: "bytes21[]";
      };
    };
    namespace: string;
    name: "Hooks";
    tableId: `0x${string}`;
  };
};
declare const worldTableDefs: {
  NamespaceOwner: {
    keySchema: {
      namespaceId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
    };
    valueSchema: {
      owner: {
        type: "address";
        internalType: "address";
      };
    };
    namespace: string;
    name: "NamespaceOwner";
    tableId: `0x${string}`;
  };
  ResourceAccess: {
    keySchema: {
      resourceId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
      caller: {
        type: "address";
        internalType: "address";
      };
    };
    valueSchema: {
      access: {
        type: "bool";
        internalType: "bool";
      };
    };
    namespace: string;
    name: "ResourceAccess";
    tableId: `0x${string}`;
  };
  InstalledModules: {
    keySchema: {
      moduleAddress: {
        type: "address";
        internalType: "address";
      };
      argumentsHash: {
        type: "bytes32";
        internalType: "bytes32";
      };
    };
    valueSchema: {
      isInstalled: {
        type: "bool";
        internalType: "bool";
      };
    };
    namespace: string;
    name: "InstalledModules";
    tableId: `0x${string}`;
  };
  UserDelegationControl: {
    keySchema: {
      delegator: {
        type: "address";
        internalType: "address";
      };
      delegatee: {
        type: "address";
        internalType: "address";
      };
    };
    valueSchema: {
      delegationControlId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
    };
    namespace: string;
    name: "UserDelegationControl";
    tableId: `0x${string}`;
  };
  NamespaceDelegationControl: {
    keySchema: {
      namespaceId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
    };
    valueSchema: {
      delegationControlId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
    };
    namespace: string;
    name: "NamespaceDelegationControl";
    tableId: `0x${string}`;
  };
  Balances: {
    keySchema: {
      namespaceId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
    };
    valueSchema: {
      balance: {
        type: "uint256";
        internalType: "uint256";
      };
    };
    namespace: string;
    name: "Balances";
    tableId: `0x${string}`;
  };
  Systems: {
    keySchema: {
      systemId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
    };
    valueSchema: {
      system: {
        type: "address";
        internalType: "address";
      };
      publicAccess: {
        type: "bool";
        internalType: "bool";
      };
    };
    namespace: string;
    name: "Systems";
    tableId: `0x${string}`;
  };
  SystemRegistry: {
    keySchema: {
      system: {
        type: "address";
        internalType: "address";
      };
    };
    valueSchema: {
      systemId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
    };
    namespace: string;
    name: "SystemRegistry";
    tableId: `0x${string}`;
  };
  SystemHooks: {
    keySchema: {
      systemId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
    };
    valueSchema: {
      value: {
        type: "bytes21[]";
        internalType: "bytes21[]";
      };
    };
    namespace: string;
    name: "SystemHooks";
    tableId: `0x${string}`;
  };
  FunctionSelectors: {
    keySchema: {
      worldFunctionSelector: {
        type: "bytes4";
        internalType: "bytes4";
      };
    };
    valueSchema: {
      systemId: {
        type: "bytes32";
        internalType: "ResourceId";
      };
      systemFunctionSelector: {
        type: "bytes4";
        internalType: "bytes4";
      };
    };
    namespace: string;
    name: "FunctionSelectors";
    tableId: `0x${string}`;
  };
  FunctionSignatures: {
    keySchema: {
      functionSelector: {
        type: "bytes4";
        internalType: "bytes4";
      };
    };
    valueSchema: {
      functionSignature: {
        type: "string";
        internalType: "string";
      };
    };
    namespace: string;
    name: "FunctionSignatures";
    tableId: `0x${string}`;
  };
  InitModuleAddress: {
    keySchema: Record<string, never>;
    valueSchema: {
      value: {
        type: "address";
        internalType: "address";
      };
    };
    namespace: string;
    name: "InitModuleAddress";
    tableId: `0x${string}`;
  };
};
/**
 * Defines the union of definitions from the provided MUD configuration, original
 * MUD store and world configurations resolved into tables definitions, and any additional defs provided by the consumer.
 *
 * This type is used to extract types out of all tables definitions relevant to the registry, to provide type safety
 * for constant data such as schemas, keys, and other table metadata (e.g. namespace).
 *
 * @template config The type of the MUD configuration provided to the wrapper.
 * @template extraTableDefs The type of any additional contract tables definitions provided to the wrapper.
 * @see {@link WrapperOptions}
 * @see {@link storeTableDefs}
 * @see {@link worldTableDefs}
 * @category Tables
 */
type AllTableDefs<
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined = undefined,
> = ResolvedStoreConfig<storeToV1<config>>["tables"] &
  (extraTableDefs extends ContractTableDefs ? extraTableDefs : Record<string, never>) &
  typeof storeTableDefs &
  typeof worldTableDefs;

/**
 * A record is a string that represents a tuple of hex keys, to identify a row in a table.
 *
 * Note: Replaces RECS Entity.
 *
 * @category Record
 */
type $Record = Hex & {
  readonly __opaque__: "$Record";
};
/**
 * A singleton $Record associated with a table including a single row.
 *
 * Note: Replaces RECS singletonEntity.
 *
 * @category Record
 */
declare const default$Record: $Record;
/**
 * Concatenate a tuple of hex keys into a single record.
 *
 * Note: This is used when decoding a log inside the storage adapter to get the concerned record.
 *
 * @param hexKeyTuple Tuple of hex keys.
 * @returns A single record.
 *
 * @category Record
 */
declare function hexKeyTupleTo$Record(hexKeyTuple: readonly Hex[]): $Record;
/**
 * Convert a record into a tuple of hex keys.
 *
 * @param $record A single record.
 * @returns Tuple of hex keys.
 *
 * @category Record
 */
declare function $recordToHexKeyTuple($record: $Record): readonly Hex[];
/**
 * Concatenate a tuple of hex keys into a single record, after encoding them into hex strings.
 *
 * Note: This is especially useful when trying to retrieve a record using its separate key properties, as it is done in the table key
 * methods attached to contract tables (see {@link createTableKeyMethods}).
 *
 * @category Record
 */
declare const encode$Record: <KS extends KeySchema$1, T = unknown>(
  keySchema: KS,
  keys: Properties<AbiToKeySchema<KS>, T>,
) => $Record;
/**
 * Decode a record into a tuple of hex keys, after decoding them from hex strings.
 *
 * Note: This is useful for retrieving the values of each separate key property from a record, using its schema and actual record string.
 *
 * @category Record
 */
declare const decode$Record: <TKeySchema extends KeySchema$1>(
  keySchema: TKeySchema,
  $record: $Record,
) => SchemaToPrimitives<TKeySchema>;

declare const createCustomWriter: ({ store: _store }: { store: Store }) => (
  log:
    | (Partial<
        {
          address: `0x${string}`;
          blockHash: `0x${string}`;
          blockNumber: bigint;
          data: `0x${string}`;
          logIndex: number;
          transactionHash: `0x${string}`;
          transactionIndex: number;
          removed: boolean;
        } & {
          args: {
            tableId: `0x${string}`;
            keyTuple: readonly `0x${string}`[];
            staticData: `0x${string}`;
            encodedLengths: `0x${string}`;
            dynamicData: `0x${string}`;
          };
          eventName: "Store_SetRecord";
          topics: [`0x${string}`, `0x${string}`];
        }
      > &
        Pick<
          {
            address: `0x${string}`;
            blockHash: `0x${string}`;
            blockNumber: bigint;
            data: `0x${string}`;
            logIndex: number;
            transactionHash: `0x${string}`;
            transactionIndex: number;
            removed: boolean;
          } & {
            args: {
              tableId: `0x${string}`;
              keyTuple: readonly `0x${string}`[];
              staticData: `0x${string}`;
              encodedLengths: `0x${string}`;
              dynamicData: `0x${string}`;
            };
            eventName: "Store_SetRecord";
            topics: [`0x${string}`, `0x${string}`];
          },
          "address" | "args" | "eventName"
        >)
    | (Partial<
        {
          address: `0x${string}`;
          blockHash: `0x${string}`;
          blockNumber: bigint;
          data: `0x${string}`;
          logIndex: number;
          transactionHash: `0x${string}`;
          transactionIndex: number;
          removed: boolean;
        } & {
          args: {
            tableId: `0x${string}`;
            keyTuple: readonly `0x${string}`[];
            start: number;
            data: `0x${string}`;
          };
          eventName: "Store_SpliceStaticData";
          topics: [`0x${string}`, `0x${string}`];
        }
      > &
        Pick<
          {
            address: `0x${string}`;
            blockHash: `0x${string}`;
            blockNumber: bigint;
            data: `0x${string}`;
            logIndex: number;
            transactionHash: `0x${string}`;
            transactionIndex: number;
            removed: boolean;
          } & {
            args: {
              tableId: `0x${string}`;
              keyTuple: readonly `0x${string}`[];
              start: number;
              data: `0x${string}`;
            };
            eventName: "Store_SpliceStaticData";
            topics: [`0x${string}`, `0x${string}`];
          },
          "address" | "args" | "eventName"
        >)
    | (Partial<
        {
          address: `0x${string}`;
          blockHash: `0x${string}`;
          blockNumber: bigint;
          data: `0x${string}`;
          logIndex: number;
          transactionHash: `0x${string}`;
          transactionIndex: number;
          removed: boolean;
        } & {
          args: {
            tableId: `0x${string}`;
            keyTuple: readonly `0x${string}`[];
            dynamicFieldIndex: number;
            start: number;
            deleteCount: number;
            encodedLengths: `0x${string}`;
            data: `0x${string}`;
          };
          eventName: "Store_SpliceDynamicData";
          topics: [`0x${string}`, `0x${string}`];
        }
      > &
        Pick<
          {
            address: `0x${string}`;
            blockHash: `0x${string}`;
            blockNumber: bigint;
            data: `0x${string}`;
            logIndex: number;
            transactionHash: `0x${string}`;
            transactionIndex: number;
            removed: boolean;
          } & {
            args: {
              tableId: `0x${string}`;
              keyTuple: readonly `0x${string}`[];
              dynamicFieldIndex: number;
              start: number;
              deleteCount: number;
              encodedLengths: `0x${string}`;
              data: `0x${string}`;
            };
            eventName: "Store_SpliceDynamicData";
            topics: [`0x${string}`, `0x${string}`];
          },
          "address" | "args" | "eventName"
        >)
    | (Partial<
        {
          address: `0x${string}`;
          blockHash: `0x${string}`;
          blockNumber: bigint;
          data: `0x${string}`;
          logIndex: number;
          transactionHash: `0x${string}`;
          transactionIndex: number;
          removed: boolean;
        } & {
          args: {
            tableId: `0x${string}`;
            keyTuple: readonly `0x${string}`[];
          };
          eventName: "Store_DeleteRecord";
          topics: [`0x${string}`, `0x${string}`];
        }
      > &
        Pick<
          {
            address: `0x${string}`;
            blockHash: `0x${string}`;
            blockNumber: bigint;
            data: `0x${string}`;
            logIndex: number;
            transactionHash: `0x${string}`;
            transactionIndex: number;
            removed: boolean;
          } & {
            args: {
              tableId: `0x${string}`;
              keyTuple: readonly `0x${string}`[];
            };
            eventName: "Store_DeleteRecord";
            topics: [`0x${string}`, `0x${string}`];
          },
          "address" | "args" | "eventName"
        >),
) => void;

type StorageAdapter = ReturnType<typeof createCustomWriter>;
type DecodedTinyBaseType =
  | {
      [key: string]: DynamicPrimitiveType | StaticPrimitiveType | Hex | undefined;
    }
  | undefined;
type TinyBaseFormattedType = {
  [key: string]:
    | string
    | number
    | boolean
    | "string"
    | "number"
    | "boolean"
    | "bigint"
    | "string[]"
    | "number[]"
    | "boolean[]"
    | "bigint[]"
    | "undefined"
    | "undefined[]";
};
type Primitive = StaticPrimitiveType | DynamicPrimitiveType | undefined;

export {
  type $Record as $,
  type AllTableDefs as A,
  type BaseTableMetadata as B,
  type CreateTableWatcherOptions as C,
  type DecodedTinyBaseType as D,
  type Metadata as M,
  type OriginalTableMethods as O,
  type Properties as P,
  type QueryOptions as Q,
  type Store as S,
  type TableWatcherCallbacks as T,
  type UpdateType as U,
  type Schema as a,
  type TableWatcherParams as b,
  Type as c,
  type TinyQLQueryKeywords as d,
  type CreateTableWatcherResult as e,
  type StoreConfig as f,
  type ContractTableDefs as g,
  type ContractTables as h,
  type StorageAdapter as i,
  default$Record as j,
  type ContractTableDef as k,
  type TableUpdate as l,
  type AbiToPropertiesSchema as m,
  type AbiToKeySchema as n,
  type ContractTable as o,
  type PropertiesSansMetadata as p,
  type TinyBaseFormattedType as q,
  type Primitive as r,
  decode$Record as s,
  encode$Record as t,
  hexKeyTupleTo$Record as u,
  $recordToHexKeyTuple as v,
  schemaAbiTypeToRecsType as w,
};
