import { Entity, Schema } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { KeySchema } from "@latticexyz/store/internal";

import { decodeEntity, encodeEntity } from "./utils";
import {
  ComponentKey,
  ComponentMethods,
  ComponentValue,
  ComponentValueSansMetadata,
  ContractComponentMethods,
  OriginalComponentMethods,
} from "./types";

export const createContractComponentMethods = <VS extends Schema, KS extends Schema = Schema, T = unknown>({
  keySchema,
  ...methods
}: { keySchema: KeySchema } & ComponentMethods<VS, T> & OriginalComponentMethods): ContractComponentMethods<
  VS,
  KS,
  T
> => {
  const { get, has, use, set } = methods;

  function getWithKeys(): ComponentValue<VS, T> | undefined;
  function getWithKeys(keys?: ComponentKey<KS, T>): ComponentValue<VS, T> | undefined;
  function getWithKeys(
    keys?: ComponentKey<KS, T>,
    defaultValue?: ComponentValueSansMetadata<VS, T>,
  ): ComponentValue<VS, T>;
  function getWithKeys(keys?: ComponentKey<KS, T>, defaultValue?: ComponentValueSansMetadata<VS, T>) {
    const entity = keys ? encodeEntity(keySchema, keys) : singletonEntity;
    return get(entity, defaultValue);
  }

  const hasWithKeys = (keys?: ComponentKey<KS, T>) => {
    const entity = keys ? encodeEntity(keySchema, keys) : singletonEntity;
    return has(entity);
  };

  const useWithKeys = (key?: ComponentKey<KS, T>, defaultValue?: ComponentValueSansMetadata<VS, T>) => {
    const entity = key ? encodeEntity(keySchema, key) : singletonEntity;
    return use(entity, defaultValue);
  };

  const setWithKeys = (value: ComponentValue<VS, T>, key: ComponentKey<KS, T>) => {
    const entity = key ? encodeEntity(keySchema, key) : singletonEntity;
    return set(value, entity);
  };

  const getEntityKeys = (entity: Entity) => {
    return decodeEntity(keySchema, entity) as unknown as ComponentKey<KS, T>;
  };

  return {
    getWithKeys,
    hasWithKeys,
    useWithKeys,
    setWithKeys,
    getEntityKeys,
  };
};
