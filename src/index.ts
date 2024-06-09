/* -------------------------------- FUNCTIONS ------------------------------- */
// Wrapper (main entry point) for the library
export * from "@/createWrapper";

// Local tables (with custom schema and templates)
export * from "@/tables/local/createLocalTable";

// Queries: global (filtering keys and callbacks), query (direct query returning $Record[]), useQuery (React hook returning $Record[] with callbacks)
export { $query, query, useQuery } from "@/queries";

/* -------------------------------- CONSTANTS ------------------------------- */
export { default$Record, localProperties, metadataProperties } from "@/lib";

/* --------------------------------- TYPES --------------------------------- */
export type {
  AllTableDefs,
  ContractTableDef,
  ContractTableDefs,
  Metadata,
  $Record,
  Schema,
  StoreConfig,
  Store,
  TinyBaseQueries,
  TinyBaseStore,
} from "@/lib";
export { Type } from "@/lib/external/mud/schema";

export type { QueryOptions, TableWatcherCallbacks, TableUpdate, UpdateType } from "@/queries";
export type { StorageAdapter } from "@/adapter";

export type {
  AbiToPropertiesSchema,
  AbiToSchema,
  ContractTable,
  ContractTables,
  AbiKeySchema,
  AbiPropertiesSchema,
} from "@/tables/contract";
export type { LocalTable } from "@/tables/local";
export type { Properties, PropertiesSansMetadata } from "@/tables";
