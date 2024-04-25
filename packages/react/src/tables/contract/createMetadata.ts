import { ContractTableDef, Type, schemaAbiTypeToRecsType } from "@/lib";

export const createMetadata = <tableDef extends ContractTableDef>(def: tableDef) => {
  const schema = {
    ...Object.fromEntries(
      Object.entries(def.valueSchema).map(([fieldName, { type: schemaAbiType }]) => [
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
    id: def.tableId,
    schema,
    metadata: {
      name: def.name,
      globalName: `${def.namespace}__${def.name}`,
      keySchema: Object.fromEntries(
        Object.entries(def.keySchema).map(([fieldName, schemaAbiType]) => [fieldName, schemaAbiType["type"]]),
      ),
      propsSchema: Object.fromEntries(
        Object.entries(def.valueSchema).map(([fieldName, schemaAbiType]) => [fieldName, schemaAbiType["type"]]),
      ),
    },
  };
};
