import { createTable } from "@/tables/core/createTable";
import type { ContractTables } from "@/tables/types";
import { resourceToLabel } from "@/lib/external/mud/common";
import { defaultEntity } from "@/lib/external/mud/entity";
import { schemaAbiTypeToRecsType, Type, type Schema, type SchemaAbiType } from "@/lib/external/mud/schema";
import { mapObject } from "@/lib/external/mud/utils";
import type { World } from "@/lib/external/mud/world";
import type { AllTableDefs, ContractTableDefs, StoreConfig } from "@/lib/definitions";

type CreateContractTablesOptions<config extends StoreConfig, extraTableDefs extends ContractTableDefs | undefined> = {
  world: World;
  tableDefs: AllTableDefs<config, extraTableDefs>;
  skipUpdateStream?: boolean;
};

/**
 * Creates a registry of contract tables with both their metadata and methods to retrieve/update properties (see {@link createTable}).
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
  if (!world.hasEntity(defaultEntity)) {
    world.registerEntity({ id: defaultEntity });
  }

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
