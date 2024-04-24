import { Type } from "@latticexyz/recs";

import { MUDTable, schemaAbiTypeToRecsType } from "@/lib";

export const createComponentTable = <table extends MUDTable>(metadata: table) => {
  const schema = {
    ...Object.fromEntries(
      Object.entries(metadata.valueSchema).map(([fieldName, { type: schemaAbiType }]) => [
        fieldName,
        schemaAbiTypeToRecsType[schemaAbiType],
      ]),
    ),
    __staticData: Type.OptionalString,
    __encodedLengths: Type.OptionalString,
    __dynamicData: Type.OptionalString,
    __lastSyncedAtBlock: Type.OptionalBigInt,
  };

  return {
    id: metadata.tableId,
    schema,
    metadata: {
      componentName: metadata.name,
      tableName: `${metadata.namespace}__${metadata.name}`,
      keySchema: Object.fromEntries(
        Object.entries(metadata.keySchema).map(([fieldName, schemaAbiType]) => [fieldName, schemaAbiType["type"]]),
      ),
      valueSchema: Object.fromEntries(
        Object.entries(metadata.valueSchema).map(([fieldName, schemaAbiType]) => [fieldName, schemaAbiType["type"]]),
      ),
    },
  };
};
