/* -------------------------------- FUNCTIONS ------------------------------- */
// Wrapper (main entry point) for the library
export * from "@/createWrapper";

// Local tables (with custom schema and templates)
export * from "@/tables/createLocalTable";

// Queries: global (filtering keys and callbacks), query (direct query returning Record[]), useQuery (React hook returning Record[] with callbacks)
export { $query, query, useQuery } from "@/queries";

/* -------------------------------- CONSTANTS ------------------------------- */
export { defaultRecord, localProperties, metadataProperties } from "@/lib";

/* --------------------------------- TYPES --------------------------------- */
export type {
  AbiKeySchema,
  AbiPropertiesSchema,
  AbiToSchema,
  AllTableDefs,
  ContractTableDef,
  ContractTableDefs,
  Metadata,
  Record,
  Schema,
  StoreConfig,
  World,
} from "@/lib";
export { createWorld, namespaceWorld, Type } from "@/lib";

export type { QueryOptions, TableWatcherCallbacks, TableUpdate, UpdateType } from "@/queries";
export type { StorageAdapter } from "@/adapter";

export type {
  BaseTable,
  BaseTableMetadata,
  ContractTable,
  ContractTables,
  ContractTableMetadata,
  IndexedBaseTable,
  Properties,
  PropertiesSansMetadata,
  Table,
  Tables,
} from "@/tables";
