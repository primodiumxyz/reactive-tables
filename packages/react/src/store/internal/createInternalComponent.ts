import { ResourceLabel, resourceToLabel } from "@latticexyz/common";
import { Metadata, Schema, Type } from "@latticexyz/recs";
import { uuid } from "@latticexyz/utils";
import { keccak256, toHex } from "viem";
import { Store } from "tinybase/store";
import { createQueries } from "tinybase/queries";

import { createComponentMethods } from "@/store/component/createComponentMethods";
import { ComponentMethods } from "@/store/component/types";

// These components will be created alongside the contract components, in a different process,
// but aggregated into the same store to be used the exact same way to reduce complexity and computation
export type CreateInternalComponentOptions<M extends Metadata> = {
  id: string; // default: uuid
  metadata?: M;
  indexed?: boolean;
};

export type InternalComponentTable<S extends Schema, M extends Metadata> = {
  id: string;
  tableId: string;
  namespace: "internal";
  name: string;
  schema: S;
  metadata: M & {
    componentName: string;
    tableName: ResourceLabel<"internal", string>;
  };
};
export type InternalComponent<S extends Schema, M extends Metadata, T> = InternalComponentTable<S, M> &
  ComponentMethods<S, T>;

export const createInternalComponent = <S extends Schema, M extends Metadata = Metadata, T = unknown>(
  store: Store,
  schema: S,
  options?: CreateInternalComponentOptions<M>,
): InternalComponent<S, M, T> => {
  // TODO: support indexed
  const { id } = options ?? { id: uuid() };

  // TODO: we need to add id because confusion around base table & ComponentTable, which might not be necessary at all (remove it)
  const table = {
    id: keccak256(toHex(id)),
    tableId: keccak256(toHex(id)),
    namespace: "internal" as const,
    name: id,
    schema,
    // @ts-expect-error TODO: fix
    metadata: {
      ...options?.metadata,
      componentName: id,
      tableName: resourceToLabel({ namespace: "internal", name: id }) as ResourceLabel<"internal", string>,
    },
  } satisfies InternalComponentTable<S, M>;

  const methods = createComponentMethods({ store, queries: createQueries(store), table, tableId: table.id });

  return {
    ...table,
    ...methods,
  } as unknown as InternalComponent<S, M, T>;
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
