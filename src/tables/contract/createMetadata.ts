import { type ContractTableDef, Type, schemaAbiTypeToRecsType } from "@/lib";

/**
 * Creates and formats the metadata for a contract table.
 *
 * Note: This will convert the "valueSchema" key, as defined in MUD, into a "propertiesSchema" key.
 *
 * @param def The contract table definition.
 * @returns The relevant metadata for the contract table.
 * @category Tables
 * @internal
 */
export const createMetadata = <tableDef extends ContractTableDef>(def: tableDef) => {
  const schema = {
    ...Object.fromEntries(
      Object.entries(def.valueSchema).map(([fieldName, { type: schemaAbiType }]) => [
        fieldName,
        schemaAbiTypeToRecsType[schemaAbiType],
      ]),
    ),
    __staticData: Type.OptionalHex,
    __encodedLengths: Type.OptionalHex,
    __dynamicData: Type.OptionalHex,
    __lastSyncedAtBlock: Type.OptionalBigInt,
  } as const;

  return {
    id: def.tableId,
    schema,
    metadata: {
      name: def.name,
      globalName: `${def.namespace}__${def.name}`,
      keySchema: Object.fromEntries(
        Object.entries(def.keySchema).map(([fieldName, schemaAbiType]) => [fieldName, schemaAbiType["type"]]),
      ),
      propertiesSchema: Object.fromEntries(
        Object.entries(def.valueSchema).map(([fieldName, schemaAbiType]) => [fieldName, schemaAbiType["type"]]),
      ),
    },
  };
};
