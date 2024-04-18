import { Type } from "@latticexyz/recs";
import { ResourceLabel, resourceToLabel } from "@latticexyz/common";
import { Store as StoreConfig } from "@latticexyz/store";
import { Table as MUDTable } from "@latticexyz/store/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";

import { schemaAbiTypeToRecsType } from "@/store/utils";
import { ComponentTable, ContractTable, InternalTable } from "@/store/component/types";

export const createComponentTable = <table extends ContractTable | MUDTable, config extends StoreConfig>(
  table: table,
) => {
  return {
    id: table.tableId,
    namespace: table.namespace ?? "contract",
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
      componentName: table.name,
      tableName: resourceToLabel(table) as ResourceLabel<storeToV1<config>["namespace"], string>,
      // @ts-expect-error
      keySchema: Object.fromEntries(
        Object.entries(table.keySchema).map(([fieldName, schemaAbiType]) => [fieldName, schemaAbiType["type"]]),
      ),
      // @ts-expect-error
      valueSchema: Object.fromEntries(
        Object.entries(table.valueSchema).map(([fieldName, schemaAbiType]) => [fieldName, schemaAbiType["type"]]),
      ),
    },
  } as const satisfies ComponentTable<table, config>;
};

export const createInternalComponentTable = <table extends InternalTable, config extends StoreConfig>(table: table) => {
  return {
    id: table.tableId,
    namespace: table.namespace,
    schema: table.schema,
    metadata: {
      componentName: table.name,
      tableName: resourceToLabel(table) as ResourceLabel<storeToV1<config>["namespace"], string>,
    },
  } as const satisfies ComponentTable<table, config>;
};
