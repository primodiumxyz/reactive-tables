import type { Hex, PublicClient } from "viem";
import { Subject } from "rxjs";

import type { ContractTable, ContractTables, Tables } from "@/tables/types";
import type { Entity } from "@/lib/external/mud/entity";
import type { Properties } from "@/lib/external/mud/schema";
import type { World } from "@/lib/external/mud/world";
import type { AllTableDefs, ContractTableDefs, StoreConfig } from "@/lib/definitions";

export type DevTools<otherDevTables extends Tables | undefined> = {
  visualizer?: boolean;
  publicClient?: PublicClient;
  worldAddress?: Hex;
  otherTables?: otherDevTables;
};

export type VisualizerOptions<
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined,
> = Omit<DevTools<otherDevTables>, "visualizer"> & {
  mudConfig: config;
  world: World;
  contractTables: ContractTables<AllTableDefs<config, extraTableDefs>>;
  adapterUpdate$: Subject<StorageAdapterUpdate>;
};

export type StorageAdapterUpdate<table extends ContractTable = ContractTable, T = unknown> = {
  table: table;
  entity: Entity;
  properties: Properties<table["propertiesSchema"], T>;
  blockNumber?: bigint;
};

export type StorageAdapterUpdateFormatted<table extends ContractTable = ContractTable, T = unknown> = {
  tableName: string;
  tablePropertiesSchema: table["propertiesSchema"];
  entity: Entity;
  properties: Properties<table["propertiesSchema"], T>;
  blockNumber?: bigint;
};
