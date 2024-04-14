import { Metadata, Schema, Type, ValueType } from "@latticexyz/recs";
import { KeySchema, Table, ValueSchema } from "@latticexyz/store/internal";
import { uuid } from "@latticexyz/utils";
import { keccak256, toHex } from "viem";

import { InternalComponentTable } from "./types";
import { ComponentValueSansMetadata } from "../component/types";

// These components will be created alongside the contract components, in a different process,
// but aggregated into the same store to be used the exact same way to reduce complexity and computation
export type CreateInternalComponentOptions<M extends Metadata> = {
  id: string; // default: uuid
  metadata?: M;
  indexed?: boolean;
};

export const createInternalComponent = <S extends Schema, M extends Metadata = Metadata, T = unknown>(
  schema: S,
  options?: CreateInternalComponentOptions<M>,
) => {
  const { id, indexed } = options ?? { id: uuid() };

  // const toSchemaAbiType = (recsSchema: Record<string, Type>): KeySchema | ValueSchema => {
  //   return Object.fromEntries(
  //     Object.entries(recsSchema).map(([key, type]) => [
  //       key,
  //       { type: recsTypeToSchemaAbiType[type] as RecsTypeToSchemaAbiType<Type> },
  //     ]),
  //   );
  // };

  return {
    id: keccak256(toHex(id)),
    namespace: "internal",
    name: `internal_${id}`,
    schema,
    metadata: {
      ...options?.metadata,
      componentName: id,
      tableName: id,
      // keySchema: {} as { [K in keyof S]: Type },
      // valueSchema: schema,
    },
  };
};

// Modified from primodium
export type InternalNumberComponent = ReturnType<typeof createInternalNumberComponent>;
export const createInternalNumberComponent = <M extends Metadata>(options?: CreateInternalComponentOptions<M>) => {
  return createInternalComponent({ value: Type.Number }, options);
};

export type InternalBigIntComponent = ReturnType<typeof createInternalBigIntComponent>;
export const createInternalBigIntComponent = <M extends Metadata>(options?: CreateInternalComponentOptions<M>) => {
  return createInternalComponent({ value: Type.BigInt }, options);
};

export type InternalStringComponent = ReturnType<typeof createInternalStringComponent>;
export const createInternalStringComponent = <M extends Metadata>(options?: CreateInternalComponentOptions<M>) => {
  return createInternalComponent({ value: Type.String }, options);
};

export type InternalCoordComponent = ReturnType<typeof createInternalCoordComponent>;
export const createInternalCoordComponent = <M extends Metadata>(options?: CreateInternalComponentOptions<M>) => {
  return createInternalComponent({ x: Type.Number, y: Type.Number }, options);
};

export type InternalBoolComponent = ReturnType<typeof createInternalBoolComponent>;
export const createInternalBoolComponent = <M extends Metadata>(options?: CreateInternalComponentOptions<M>) => {
  return createInternalComponent({ value: Type.Boolean }, options);
};

export type InternalEntityComponent = ReturnType<typeof createInternalEntityComponent>;
export const createInternalEntityComponent = <M extends Metadata>(options?: CreateInternalComponentOptions<M>) => {
  return createInternalComponent({ entity: Type.Entity }, options);
};
