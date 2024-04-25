import { Entity } from "@latticexyz/recs";

import { TinyBaseFormattedType } from "@/adapter";
import { ComponentValue } from "@/components/types";
import { AbiToSchemaPlusMetadata } from "@/components/contract/types";
import { MUDTable, TinyBaseQueries } from "@/lib";

export type QueryOptions<table extends MUDTable> = {
  queries: TinyBaseQueries;
  tableId: string;
  value: Partial<ComponentValue<AbiToSchemaPlusMetadata<table["valueSchema"]>>>;
  formattedValue?: TinyBaseFormattedType;
};

export type QueryResult = {
  id: string;
  entities: Entity[];
};
