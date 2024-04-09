import { Store as StoreConfig } from "@latticexyz/store";
import { Type, World } from "@latticexyz/recs";
import { Tables } from "@latticexyz/store/internal";
import { mapObject } from "@latticexyz/utils";
import { Subject, map } from "rxjs";

import { createStorageAdapter } from "./createStorageAdapter";
import { CreateComponentsStoreOptions, CreateComponentsStoreResult } from "@/types";

import { storeTables, worldTables } from "@latticexyz/store-sync";
import { Row, createStore } from "tinybase/store";
import { resourceToLabel } from "@latticexyz/common";
import { TableToComponent } from "@latticexyz/store-sync/src/recs/tableToComponent";
import { schemaAbiTypeToRecsType } from "./formatters/schemaAbiTypeToRecsType";
import { createComponentMethods } from "./createComponentMethods";
import { SchemaAbiType } from "@latticexyz/schema-type/internal";

export const createComponentsStore = <world extends World, config extends StoreConfig, tables extends Tables>({
  world,
  tables,
}: CreateComponentsStoreOptions<world, config, tables>): CreateComponentsStoreResult => {
  // Create the TinyBase store
  const store = createStore();
  // Resolve tables into components
  const allTables = { ...tables, ...storeTables, ...worldTables };
  const components = mapObject(allTables, (table) => {
    if (Object.keys(table.valueSchema).length === 0) throw new Error("Component schema must have at least one key");

    // TODO: can we use the component name as the id? or should we use the table id? We shouldn't have multiple components with the
    // same name, as we wouldn't be able to access them by name.
    // Obviously here there would be a conflict if any schema property (value label) were to have the same name as
    // one of the keys here, but the issue already exists in RECS with __staticData, __encodedLengths, and __dynamicData;
    // so it's more of an implementation concern than a design issue.

    // Immutable
    const keySchema = mapObject(table.keySchema, ({ type }) => type) as Record<string, SchemaAbiType>;
    // TODO: fix types; that's probably here that we should handle autocomplete as well
    const valueSchema = mapObject(table.valueSchema, ({ type }) => type) as Record<string, SchemaAbiType>;

    store.setTable(table.name, {
      schema: {
        ...Object.fromEntries(
          Object.entries(table.valueSchema).map(([fieldName, { type: schemaAbiType }]) => [
            fieldName,
            schemaAbiTypeToRecsType[schemaAbiType],
          ]),
        ),
        __staticData: Type.OptionalString,
        __encodedLengths: Type.OptionalString,
        __dynamicData: Type.OptionalString,
      },
      metadata: {
        id: table.tableId,
        componentName: table.name,
        tableName: resourceToLabel(table),
      },
      keySchema: keySchema as Row,
      valueSchema: valueSchema as Row,
    });

    const { update$, entities } = createComponentMethods({ store, tableName: table.name, keySchema, valueSchema });
  });

  console.log(store.getTable("Counter"));
  console.log("-------------------");
  console.log(store.getTable("Position"));

  // Create the storage adapter for syncing with the sync-stack (logs -> component data)
  const storageAdapter = createStorageAdapter({ store });

  // return { components, store, storageAdapter };
  return { components, store, storageAdapter };
};
