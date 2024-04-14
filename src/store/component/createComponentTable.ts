import { Type } from "@latticexyz/recs";
import { ResourceLabel, resourceToLabel } from "@latticexyz/common";
import { Store as StoreConfig } from "@latticexyz/store";
import { Table } from "@latticexyz/store/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Store } from "tinybase/store";

import { ComponentTable } from "./types";
import { schemaAbiTypeToRecsType } from "../utils";

export const createComponentTable = <table extends Table, config extends StoreConfig>(table: table, store: Store) => {
  return {
    id: table.tableId,
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
    // TODO: we're actually never using the schema; should we include it? what should its purpose be?
    schema: {
      ...Object.fromEntries(
        Object.entries(table.valueSchema).map(([fieldName, schemaAbiType]) => [
          fieldName,
          schemaAbiTypeToRecsType[schemaAbiType["type"]],
        ]),
      ),
      __staticData: Type.OptionalString,
      __encodedLengths: Type.OptionalString,
      __dynamicData: Type.OptionalString,
    },
  } as const satisfies ComponentTable<table, config>;
};
