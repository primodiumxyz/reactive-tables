import { World } from "@latticexyz/recs";
import { Table } from "@latticexyz/store-sync";

export const createComponentStore = <world extends World>(args: {
  world: world;
  tables: Record<string, Table>;
  extend?: boolean;
}) => {
  const { world, tables, extend } = args;

  // TODO: Retrieve components as a TinyBase store

  return { components: {} as unknown, tables: {} as unknown };
};
