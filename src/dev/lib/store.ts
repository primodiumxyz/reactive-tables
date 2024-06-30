import { createLocalTable } from "@/tables/core/createLocalTable";
import type { Entity } from "@/lib/external/mud/entity";
import { type Properties, type Schema, Type } from "@/lib/external/mud/schema";
import { createWorld } from "@/lib/external/mud/world";

const world = createWorld();

export const ConfigTable = createLocalTable(
  world,
  { shrinkEntities: Type.Boolean, filter: Type.String },
  { id: "Config", persist: true },
  { shrinkEntities: true, filter: "" },
);

export type StorageAdapterUpdateTableProperties<PS extends Schema = Schema, T = unknown> = {
  tableName: string;
  tablePropertiesSchema: PS;
  entity: Entity;
  properties: Properties<PS, T>;
  blockNumber: bigint | null;
};

export const StorageAdapterUpdateTable = createLocalTable(
  world,
  {
    tableName: Type.String,
    tablePropertiesSchema: Type.T,
    entity: Type.Entity,
    properties: Type.T,
    blockNumber: Type.OptionalBigInt,
  },
  { id: "StorageAdapterUpdate" },
);

export const QueryOptionsTable = createLocalTable(
  world,
  {
    with: Type.OptionalT,
    without: Type.OptionalT,
    withProperties: Type.OptionalT,
    withoutProperties: Type.OptionalT,
  },
  { id: "QueryOptionsTable" },
);
