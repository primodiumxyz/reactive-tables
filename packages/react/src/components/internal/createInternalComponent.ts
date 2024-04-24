import { Metadata, Schema, Type } from "@latticexyz/recs";
import { uuid } from "@latticexyz/utils";
import { keccak256, toHex } from "viem";
import { Store } from "tinybase/store";
import { createQueries } from "tinybase/queries";

import { createComponentMethods } from "@/components/createComponentMethods";
import { InternalTable, InternalTableMetadata } from "@/components/internal/types";

// These components are meant to be created directly from the implementation, then usedalongside contract components
// the exact same way
export type CreateInternalComponentOptions<M extends Metadata> = {
  id: string; // default: uuid
  metadata?: M;
  indexed?: boolean;
};

// TODO: support indexed
export const createInternalComponent = <S extends Schema, M extends Metadata, T = unknown>(
  store: Store,
  schema: S,
  options?: CreateInternalComponentOptions<M>,
): InternalTable<S, M, InternalTableMetadata<S, M>, T> => {
  const { id } = options ?? { id: uuid() };

  // Format metadata the same way as MUD tables to treat it the same way during methods creation
  const metadata = {
    tableId: keccak256(toHex(id)),
    namespace: "internal" as const,
    name: id,
    schema,
  } as InternalTableMetadata<S, M>;

  return {
    // Table data
    id: metadata.tableId,
    schema,
    metadata: {
      ...options?.metadata,
      componentName: id,
      tableName: `internal__${id}`,
    },
    // Methods
    ...createComponentMethods({ store, queries: createQueries(store), metadata }),
  } as unknown as InternalTable<S, M, typeof metadata, T>;
};

// Modified from primodium
export type InternalNumberComponent = ReturnType<typeof createInternalNumberComponent>;
export const createInternalNumberComponent = <M extends Metadata>(
  store: Store,
  options?: CreateInternalComponentOptions<M>,
) => {
  return createInternalComponent(store, { value: Type.Number }, options);
};

export type InternalBigIntComponent = ReturnType<typeof createInternalBigIntComponent>;
export const createInternalBigIntComponent = <M extends Metadata>(
  store: Store,
  options?: CreateInternalComponentOptions<M>,
) => {
  return createInternalComponent(store, { value: Type.BigInt }, options);
};

export type InternalStringComponent = ReturnType<typeof createInternalStringComponent>;
export const createInternalStringComponent = <M extends Metadata>(
  store: Store,
  options?: CreateInternalComponentOptions<M>,
) => {
  return createInternalComponent(store, { value: Type.String }, options);
};

export type InternalCoordComponent = ReturnType<typeof createInternalCoordComponent>;
export const createInternalCoordComponent = <M extends Metadata>(
  store: Store,
  options?: CreateInternalComponentOptions<M>,
) => {
  return createInternalComponent(store, { x: Type.Number, y: Type.Number }, options);
};

export type InternalBoolComponent = ReturnType<typeof createInternalBoolComponent>;
export const createInternalBoolComponent = <M extends Metadata>(
  store: Store,
  options?: CreateInternalComponentOptions<M>,
) => {
  return createInternalComponent(store, { value: Type.Boolean }, options);
};

export type InternalEntityComponent = ReturnType<typeof createInternalEntityComponent>;
export const createInternalEntityComponent = <M extends Metadata>(
  store: Store,
  options?: CreateInternalComponentOptions<M>,
) => {
  return createInternalComponent(store, { entity: Type.Entity }, options);
};
