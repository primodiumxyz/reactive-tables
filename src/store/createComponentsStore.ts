import { Store as StoreConfig } from "@latticexyz/store";
import { Schema, Type, World } from "@latticexyz/recs";
import { resourceToLabel } from "@latticexyz/common";
import { mapObject } from "@latticexyz/utils";
import { Tables } from "@latticexyz/store/internal";
import { KeySchema, ValueSchema } from "@latticexyz/protocol-parser/internal";
import { createStore } from "tinybase/store";

import { createComponentMethods } from "@/store/component/createComponentMethods";
import { schemaAbiTypeToRecsType } from "@/utils";
import { Components, CreateComponentsStoreOptions, CreateComponentsStoreResult } from "@/types";
import { BaseComponent, ExtendedComponentMethods } from "@/store/component/types";

export const createComponentsStore = <world extends World, config extends StoreConfig, tables extends Tables>({
  world,
  tables,
}: CreateComponentsStoreOptions<world, config, tables>): CreateComponentsStoreResult<config, tables> => {
  // Create the TinyBase store
  const store = createStore();

  // Resolve tables into components
  const components = mapObject(tables, (table) => {
    if (Object.keys(table.valueSchema).length === 0) throw new Error("Component schema must have at least one key");

    // Immutable
    // TODO: Add types from https://github.com/latticexyz/mud/blob/ade94a7fa761070719bcd4b4dac6cb8cc7783c3b/packages/store-sync/src/recs/tableToComponent.ts#L9
    const componentTable: BaseComponent<Schema, config> = {
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
      keySchema: mapObject(table.keySchema, ({ type }) => type) as KeySchema,
      valueSchema: mapObject(table.valueSchema, ({ type }) => type) as ValueSchema,
    };

    const methods: ExtendedComponentMethods<Schema> = createComponentMethods({
      store,
      tableId: table.tableId,
      keySchema: componentTable.keySchema,
      valueSchema: componentTable.valueSchema,
      schema: componentTable.schema,
    });

    // Register immutable data (basically formatted table) in the store for efficient access
    store.setTable(`table__${table.tableId}`, componentTable);

    return {
      ...componentTable,
      ...methods,
    };
  }) as Components<Schema, config, tables>;

  return { components, store };
};
