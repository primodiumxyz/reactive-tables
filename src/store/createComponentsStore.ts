import { Store as StoreConfig } from "@latticexyz/store";
import { Schema, Type, World } from "@latticexyz/recs";
import { resourceToLabel } from "@latticexyz/common";
import { mapObject } from "@latticexyz/utils";
import { Tables } from "@latticexyz/store/internal";
import { SchemaAbiType } from "@latticexyz/schema-type/internal";
import { createStore } from "tinybase/store";

import { createComponentMethods } from "@/store/component/createComponentMethods";
import { setComponentTable } from "@/store/utils";
import { schemaAbiTypeToRecsType } from "@/utils";
import { CreateComponentsStoreOptions, CreateComponentsStoreResult } from "@/types";
import { Components, ComponentTable, ComponentMethods } from "@/store/component/types";

export const createComponentsStore = <
  world extends World,
  config extends StoreConfig,
  extraTables extends Tables | undefined,
>({
  world,
  tables,
}: CreateComponentsStoreOptions<world, config, extraTables>): CreateComponentsStoreResult<config, extraTables> => {
  // Create the TinyBase store
  const store = createStore();

  // Resolve tables into components
  // @ts-ignore excessively deep and possibly infinite type instantiation
  const components = mapObject(tables, (table) => {
    if (Object.keys(table.valueSchema).length === 0) throw new Error("Component schema must have at least one key");

    // Immutable
    const componentTable = {
      id: table.tableId,
      // TODO: we're actually never using the schema; should we include it? what should its purpose be?
      // schema: {
      //   ...Object.fromEntries(
      //     Object.entries(table.valueSchema).map(([fieldName, schemaAbiType]) => [
      //       fieldName,
      //       schemaAbiTypeToRecsType[schemaAbiType["type"]],
      //     ]),
      //   ),
      //   __staticData: Type.OptionalString,
      //   __encodedLengths: Type.OptionalString,
      //   __dynamicData: Type.OptionalString,
      // },
      metadata: {
        componentName: table.name,
        tableName: resourceToLabel(table),
        keySchema: mapObject(table.keySchema, ({ type }) => type),
        valueSchema: mapObject(table.valueSchema, ({ type }) => type),
      },
    } as ComponentTable<typeof table, config>;

    const methods: ComponentMethods<Schema> = createComponentMethods({
      store,
      tableId: table.tableId,
    });

    // Register immutable data (basically formatted table) in the store for efficient access
    setComponentTable(store, componentTable);

    return {
      ...componentTable,
      ...methods,
    };
  }) as Components<typeof tables, config>;

  return { components, store };
};
