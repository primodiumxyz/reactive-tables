import { Entity, Schema } from "@latticexyz/recs";
import { KeySchema } from "@latticexyz/protocol-parser/internal";

import { decodeEntity, encodeEntity } from "@/components/contract/utils";
import { singletonEntity } from "@/utils";
import { ComponentKey, ComponentValue, ComponentValueSansMetadata, OriginalComponentMethods } from "@/components/types";
import { ContractTableMethods, ContractTableWithKeysMethods } from "./types";

export const createContractComponentMethods = <VS extends Schema, KS extends Schema = Schema, T = unknown>({
  keySchema,
  ...methods
}: { keySchema: KeySchema } & ContractTableMethods<VS, T> & OriginalComponentMethods): ContractTableWithKeysMethods<
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

  const useWithKeys = (keys?: ComponentKey<KS, T>, defaultValue?: ComponentValueSansMetadata<VS, T>) => {
    const entity = keys ? encodeEntity(keySchema, keys) : singletonEntity;
    return use(entity, defaultValue);
  };

  const setWithKeys = (value: ComponentValue<VS, T>, keys: ComponentKey<KS, T>) => {
    const entity = keys ? encodeEntity(keySchema, keys) : singletonEntity;
    return set(value, entity);
  };

  const getEntityKeys = (entity: Entity) => {
    return decodeEntity(keySchema, entity) as unknown as ComponentKey<KS, T>;
  };

  return {
    getWithKeys,
    hasWithKeys,
    useWithKeys:
      typeof window !== "undefined"
        ? useWithKeys
        : () => {
            console.warn("useWithKeys is only available in the browser");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return undefined as any;
          },
    setWithKeys,
    getEntityKeys,
  };
};
