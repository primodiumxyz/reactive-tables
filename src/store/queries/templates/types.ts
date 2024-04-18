import { Entity, Schema } from "@latticexyz/recs";
import { Queries } from "tinybase/queries";

import { TinyBaseFormattedType } from "@/adapter";
import { ComponentValue } from "@/store/component/types";

export type QueryOptions = {
  queries: Queries;
  tableId: string;
  value: Partial<ComponentValue<Schema>>;
  formattedValue?: TinyBaseFormattedType;
};

export type QueryResult = {
  id: string;
  entities: Entity[];
};
