import { Entity } from "@latticexyz/recs";
import { Queries } from "tinybase/queries";

import { TinyBaseFormattedType } from "@/adapter";
import { ComponentValue, MUDTable } from "@/components/types";
import { AbiToSchemaPlusMetadata } from "@/components/contract/types";

export type QueryOptions<table extends MUDTable> = {
  queries: Queries;
  tableId: string;
  value: Partial<ComponentValue<AbiToSchemaPlusMetadata<table["valueSchema"]>>>;
  formattedValue?: TinyBaseFormattedType;
};

export type QueryResult = {
  id: string;
  entities: Entity[];
};
