import { Type } from "@latticexyz/recs";
import { ResourceLabel, resourceToLabel } from "@latticexyz/common";
import { Store as StoreConfig } from "@latticexyz/store";
import { Table as MUDTable } from "@latticexyz/store/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";

import { schemaAbiTypeToRecsType } from "@/components/utils";
import { ComponentTable, ContractTable } from "@/components/contract/types";

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
      // @ts-expect-error one keySchema is more specific than the other
      keySchema: Object.fromEntries(
        Object.entries(table.keySchema).map(([fieldName, schemaAbiType]) => [fieldName, schemaAbiType["type"]]),
      ),
      // @ts-expect-error one keySchema is more specific than the other
      valueSchema: Object.fromEntries(
        Object.entries(table.valueSchema).map(([fieldName, schemaAbiType]) => [fieldName, schemaAbiType["type"]]),
      ),
    },
  } as const satisfies ComponentTable<table, config>;
};