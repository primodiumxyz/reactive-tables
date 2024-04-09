import { Store as StoreConfig } from "@latticexyz/store";
import { Tables } from "@latticexyz/store/internal";
import { Subject } from "rxjs";

import { CreateComponentMethodsOptions, CreateComponentMethodsResult } from "@/types";

export const createComponentMethods = <config extends StoreConfig, tables extends Tables>({
  store,
  tableName,
  keySchema,
  valueSchema,
}: CreateComponentMethodsOptions): CreateComponentMethodsResult => {
  // TODO: return registerEntity, removeEntity; or maybe register can be if given id doesn't exist
  // Base
  const update$ = new Subject();
  const entities = () => store.getTable(`${tableName}__values`);

  // Extended

  return {
    update$,
    entities,
  };
};
