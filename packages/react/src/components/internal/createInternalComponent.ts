import { Metadata, Schema, Type } from "@latticexyz/recs";
import { uuid } from "@latticexyz/utils";
import { keccak256, toHex } from "viem";

import { createComponentMethods } from "@/components/createComponentMethods";
import { ComponentValue } from "@/components/types";
import { InternalTable, InternalTableMetadata } from "@/components/internal/types";
import { Store } from "@/lib";

// These components are meant to be created directly from the implementation, then usedalongside contract components
// the exact same way
export type CreateInternalComponentOptions<M extends Metadata> = {
  id: string; // default: uuid
  metadata?: M;
  indexed?: boolean;
  persist?: boolean;
};

// TODO: support indexed
export const createInternalComponent = <S extends Schema, M extends Metadata, T = unknown>(
  store: Store,
  schema: S,
  options?: CreateInternalComponentOptions<M>,
  defaultValue?: ComponentValue<S, T>,
): InternalTable<S, M, InternalTableMetadata<S, M>, T> => {
  const { id } = options ?? { id: uuid() };
  // Get the appropriate store instance
  const storeInstance = options?.persist ? store("PERSIST") : store();

  // Format metadata the same way as MUD tables to treat it the same way during methods creation
  const metadata = {
    tableId: keccak256(toHex(id)),
    namespace: "internal" as const,
    name: id,
    schema,
  } as InternalTableMetadata<S, M>;

  const component = {
    // Table data
    id: metadata.tableId,
    schema,
    metadata: {
      ...options?.metadata,
      componentName: id,
      tableName: `internal__${id}`,
    },
    // Methods
    ...createComponentMethods({ store: storeInstance, queries: storeInstance.getQueries(), metadata }),
  } as unknown as InternalTable<S, M, typeof metadata, T>;

  // Set the default value if provided; if the store is persistent, find out first if there is not already a value
  // from a previous session
  if (defaultValue) {
    const value = options?.persist ? component.get() : undefined;
    if (value === undefined) {
      component.set(defaultValue);
    }
  }

  return component;
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
