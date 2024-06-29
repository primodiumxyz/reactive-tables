import { createLocalTable } from "@/tables";
import { Type } from "@/lib/external/mud/schema";
import { createWorld } from "@/lib/external/mud/world";

const world = createWorld();

export const ConfigTable = createLocalTable(
  world,
  { shrinkEntities: Type.Boolean, filter: Type.String },
  { id: "Config", persist: true },
  { shrinkEntities: true, filter: "" },
);

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
