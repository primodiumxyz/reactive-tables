import { keccak256, toHex } from "viem";

import { createTableMethods, Properties } from "@/tables";
import { LocalTable, LocalTableMetadata } from "@/tables/local";
import { Metadata, Schema, Store, Type, uuid } from "@/lib";

// These tables are meant to be created directly from the implementation, then used alongside contract tables
// the exact same way
export type CreateLocalTableOptions<M extends Metadata> = {
  id: string; // default: uuid
  metadata?: M;
  indexed?: boolean;
  persist?: boolean;
};

// TODO: support indexed
export const createLocalTable = <S extends Schema, M extends Metadata, T = unknown>(
  store: Store,
  schema: S,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<S, T>,
): LocalTable<S, M, LocalTableMetadata<S, M>, T> => {
  const { id } = options ?? { id: uuid() };
  // Get the appropriate store instance
  const storeInstance = options?.persist ? store("PERSIST") : store();

  // Format metadata the same way as MUD tables to treat it the same way during methods creation
  const metadata = {
    tableId: keccak256(toHex(id)),
    namespace: "internal" as const,
    name: id,
    schema,
  } as LocalTableMetadata<S, M>;

  const table = {
    // Table data
    id: metadata.tableId,
    schema,
    metadata: {
      ...options?.metadata,
      name: id,
      globalName: `internal__${id}`,
    },
    // Methods
    ...createTableMethods({ store: storeInstance, queries: storeInstance.getQueries(), metadata }),
  } as unknown as LocalTable<S, M, typeof metadata, T>;

  // Set the default properties if provided; if the store is persistent, find out first if there are no properties
  // from a previous session
  if (defaultProperties) {
    const props = options?.persist ? table.get() : undefined;
    if (props === undefined) {
      table.set(defaultProperties);
    }
  }

  return table;
};

// Modified from primodium
export type LocalNumberTable = ReturnType<typeof createLocalNumberTable>;
export const createLocalNumberTable = <M extends Metadata>(store: Store, options?: CreateLocalTableOptions<M>) => {
  return createLocalTable(store, { value: Type.Number }, options);
};

export type LocalBigIntTable = ReturnType<typeof createLocalBigIntTable>;
export const createLocalBigIntTable = <M extends Metadata>(store: Store, options?: CreateLocalTableOptions<M>) => {
  return createLocalTable(store, { value: Type.BigInt }, options);
};

export type LocalStringTable = ReturnType<typeof createLocalStringTable>;
export const createLocalStringTable = <M extends Metadata>(store: Store, options?: CreateLocalTableOptions<M>) => {
  return createLocalTable(store, { value: Type.String }, options);
};

export type LocalCoordTable = ReturnType<typeof createLocalCoordTable>;
export const createLocalCoordTable = <M extends Metadata>(store: Store, options?: CreateLocalTableOptions<M>) => {
  return createLocalTable(store, { x: Type.Number, y: Type.Number }, options);
};

export type LocalBoolTable = ReturnType<typeof createLocalBoolTable>;
export const createLocalBoolTable = <M extends Metadata>(store: Store, options?: CreateLocalTableOptions<M>) => {
  return createLocalTable(store, { value: Type.Boolean }, options);
};

export type Local$RecordTable = ReturnType<typeof createLocal$RecordTable>;
export const createLocal$RecordTable = <M extends Metadata>(store: Store, options?: CreateLocalTableOptions<M>) => {
  return createLocalTable(store, { $record: Type.$Record }, options);
};
