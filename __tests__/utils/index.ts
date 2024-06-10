import { Schema } from "@/lib";
import { BaseTable, BaseTableMetadata, Table } from "@/tables";

export * from "./networkConfig";
export * from "./actions";

export * from "./sync";

export const toBaseTable = <PS extends Schema = Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
  table: Table<PS, M, T>,
): BaseTable<PS, M, T> => {
  return {
    id: table.id,
    properties: table.properties,
    propertiesSchema: table.propertiesSchema,
    metadata: table.metadata,
    world: table.world,
    $records: table.$records,
    update$: table.update$,
  };
};
