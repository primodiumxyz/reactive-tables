/* -------------------------------- FUNCTIONS ------------------------------- */
// Wrapper (main entry point) for the library
export * from "@/createWrapper";

// Local tables (with custom schema and templates)
export * from "@/tables/local/createLocalTable";

// Queries: global (filtering keys and callbacks), query (direct query returning $Record[]), useQuery (React hook returning $Record[] with callbacks)
export { createQuery, query, useQuery } from "@/queries";

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
  TinyBaseQueries,
  TinyBaseStore,
} from "@/lib";
export { Type as PropType } from "@/lib/external/mud/schema";
export type { Store } from "@/lib/tinybase/store";

export type { QueryOptions, TableWatcherCallbacks, TableUpdate, UpdateType } from "@/queries";
export type { StorageAdapter } from "@/adapter";

export type {
  AbiToPropsSchema,
  AbiToKeySchema,
  ContractTable,
  ContractTables,
  KeySchema,
  PropsSchema,
} from "@/tables/contract";
export type { LocalTable } from "@/tables/local";
export type { Properties, PropertiesSansMetadata } from "@/tables";
