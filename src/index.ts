/* -------------------------------- FUNCTIONS ------------------------------- */
// Wrapper (main entry point) for the library
export * from "@/createWrapper";

// Local tables (with custom schema and templates)
export * from "@/tables/core/createLocalTable";

// Queries: global (filtering keys and callbacks), query (direct query returning Entity[]), useQuery (React hook returning Entity[] with callbacks)
export { queryMatchingCondition, queryPropertiesCondition, $query, query, useQuery } from "@/queries";

/* -------------------------------- CONSTANTS ------------------------------- */
export { defaultEntity, localProperties, metadataProperties } from "@/lib";

/* --------------------------------- TYPES --------------------------------- */
export type {
  AbiKeySchema,
  AbiPropertiesSchema,
  AdjustedPropertiesSchema,
  UnparsedAbiKeySchema,
  UnparsedAbiPropertiesSchema,
  AbiToSchema,
  AllTableDefs,
  BaseTableMetadata,
  ContractTableDef,
  ContractTableDefs,
  ContractTableMetadata,
  Entity,
  EntitySymbol,
  Keys,
  Metadata,
  OptionalSchema,
  OptionalTypes,
  Properties,
  PropertiesSansMetadata,
  Schema,
  StoreConfig,
  PersistentStorageAdapter,
  TableProperties,
  World,
} from "@/lib";
export { createWorld, namespaceWorld, Type } from "@/lib";

export type { StorageAdapter } from "@/adapter";
export type {
  QueryOptions,
  QueryMatchingCondition,
  QueryPropertiesCondition,
  TableWatcherCallbacks,
  TableWatcherOptions,
  WatcherOptions,
} from "@/queries";
export type {
  BaseTable,
  BaseTables,
  ContractTable,
  ContractTables,
  IndexedBaseTable,
  Table,
  Tables,
  TableOptions,
  TableUpdate,
  UpdateType,
} from "@/tables";
