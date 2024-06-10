import { createTable, type ContractTables } from "@/tables";
import { default$Record, mapObject, resourceToLabel, schemaAbiTypeToRecsType, Type } from "@/lib";
import type { ContractTableDefs, StoreConfig, SchemaAbiType, AllTableDefs, Schema, World } from "@/lib";

type CreateContractTablesOptions<config extends StoreConfig, extraTableDefs extends ContractTableDefs | undefined> = {
  world: World;
  tableDefs: AllTableDefs<config, extraTableDefs>;
  skipUpdateStream?: boolean;
};

/**
 * Creates a registry of contract tables with both their metadata (see {@link createMetadata}) and methods to retrieve/update
 * properties (see {@link createTableMethods}).
 *
 * @param world The RECS world object.
 * @param tableDefs The contract table definitions.
 * @returns The contract tables registry.
 * @category Tables
 * @internal
 */
export const createContractTables = <config extends StoreConfig, extraTableDefs extends ContractTableDefs | undefined>({
  world,
  tableDefs,
}: CreateContractTablesOptions<config, extraTableDefs>) => {
  world.register$Record({ id: default$Record });

  return mapObject(tableDefs, (def) => {
    const propertiesSchema = {
      ...Object.fromEntries(
        Object.entries(def.valueSchema).map(([fieldName, { type: schemaAbiType }]) => [
          fieldName,
          schemaAbiTypeToRecsType[schemaAbiType as SchemaAbiType],
        ]),
      ),
      __staticData: Type.OptionalHex,
      __encodedLengths: Type.OptionalHex,
      __dynamicData: Type.OptionalHex,
      __lastSyncedAtBlock: Type.OptionalBigInt,
    } as const satisfies Schema;

    // const keySchema = {
    //   ...Object.fromEntries(
    //     Object.entries(def.keySchema).map(([fieldName, { type: schemaAbiType }]) => [
    //       fieldName,
    //       schemaAbiTypeToRecsType[schemaAbiType as SchemaAbiType],
    //     ]),
    //   ),
    // } as const satisfies Schema;

    return createTable(
      world,
      propertiesSchema,
      /* keySchema, */ {
        id: def.tableId,
        metadata: {
          name: def.name, // RECS `componentName`
          globalName: resourceToLabel(def), // namespaced; RECS `tableName`
          // @ts-expect-error complex union type
          abiKeySchema: mapObject(def.keySchema, ({ type }) => type),
          // @ts-expect-error complex union type
          abiPropertiesSchema: mapObject(def.valueSchema, ({ type }) => type),
        },
      },
    );
  }) as unknown as ContractTables<AllTableDefs<config, extraTableDefs>>;
};
