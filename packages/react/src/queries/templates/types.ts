import { TinyBaseFormattedType } from "@/adapter";
import { Properties } from "@/tables";
import { AbiToSchemaPlusMetadata } from "@/tables/contract";
import { ContractTableDef, $Record, TinyBaseQueries } from "@/lib";

export type QueryTableOptions<tableDef extends ContractTableDef> = {
  queries: TinyBaseQueries;
  tableId: string;
  properties: Partial<Properties<AbiToSchemaPlusMetadata<tableDef["valueSchema"]>>>;
  formattedProps?: TinyBaseFormattedType;
};

export type QueryTableResult = {
  id: string;
  $records: $Record[];
};
