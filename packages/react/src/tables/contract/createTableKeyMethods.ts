import { Properties, PropertiesSansMetadata, OriginalTableMethods } from "@/tables";
import { ContractTableMethods, ContractTableWithKeysMethods, KeySchema } from "@/tables/contract";
import { decode$Record, encode$Record, default$Record, $Record, Schema } from "@/lib";

export const createTableKeyMethods = <VS extends Schema, KS extends Schema = Schema, T = unknown>({
  keySchema,
  ...methods
}: { keySchema: KeySchema } & ContractTableMethods<VS, T> & OriginalTableMethods): ContractTableWithKeysMethods<
  VS,
  KS,
  T
> => {
  const { get, has, use, set } = methods;

  function getWithKeys(): Properties<VS, T> | undefined;
  function getWithKeys(keys?: Properties<KS, T>): Properties<VS, T> | undefined;
  function getWithKeys(keys?: Properties<KS, T>, defaultProps?: PropertiesSansMetadata<VS, T>): Properties<VS, T>;
  function getWithKeys(keys?: Properties<KS, T>, defaultProps?: PropertiesSansMetadata<VS, T>) {
    const $record = keys ? encode$Record(keySchema, keys) : default$Record;
    return get($record, defaultProps);
  }

  const hasWithKeys = (keys?: Properties<KS, T>) => {
    const $record = keys ? encode$Record(keySchema, keys) : default$Record;
    return has($record);
  };

  const useWithKeys = (keys?: Properties<KS, T>, defaultProps?: PropertiesSansMetadata<VS, T>) => {
    const $record = keys ? encode$Record(keySchema, keys) : default$Record;
    return use($record, defaultProps);
  };

  const setWithKeys = (properties: Properties<VS, T>, keys: Properties<KS, T>) => {
    const $record = keys ? encode$Record(keySchema, keys) : default$Record;
    return set(properties, $record);
  };

  const get$RecordKeys = ($record: $Record) => {
    return decode$Record(keySchema, $record) as unknown as Properties<KS, T>;
  };

  return {
    getWithKeys,
    hasWithKeys,
    useWithKeys:
      typeof window !== "undefined"
        ? useWithKeys
        : () => {
            throw new Error("The method useWithKeys is only available in the browser");
          },
    setWithKeys,
    get$RecordKeys,
  };
};
