import { createLocalTable } from "@/tables";
import { Type } from "@/lib/external/mud/schema";
import { createWorld } from "@/lib/external/mud/world";

const world = createWorld();

export const SettingsTable = createLocalTable(
  world,
  { shrinkEntities: Type.Boolean, filter: Type.String },
  { id: "Config", persist: true },
  { shrinkEntities: true, filter: "" },
);
