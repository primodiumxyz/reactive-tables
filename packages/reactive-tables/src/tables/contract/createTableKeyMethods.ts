import type { Properties, PropertiesSansMetadata, OriginalTableMethods } from "@/tables";
import type { AbiToKeySchema, ContractTableMethods, ContractTableWithKeysMethods, KeySchema } from "@/tables/contract";
import { decode$Record, encode$Record, default$Record, type $Record, type Schema } from "@/lib";

/**
 * Create a set of methods to interact with a contract table using values for its keys properties,
 * that get encoded into a $Record.
 *
 * Note: See {@link ContractTableWithKeysMethods} for more information about each method.
 *
 * @param keySchema The schema of the keys properties.
 * @param methods The original table methods (see {@link ContractTableMethods}).
 * @returns The key-specific table methods (see {@link ContractTableWithKeysMethods}).
 * @category Table
 */
export const createTableKeyMethods = <
  PS extends Schema,
  TKeySchema extends KeySchema,
  KS extends AbiToKeySchema<TKeySchema>,
  T = unknown,
>({
  keySchema,
  ...methods
}: { keySchema: TKeySchema } & ContractTableMethods<PS, T> & OriginalTableMethods): ContractTableWithKeysMethods<
  PS,
  KS,
  T
> => {
  const { get, has, use, set } = methods;

  // Get the properties of a record using its keys
  function getWithKeys(): Properties<PS, T> | undefined;
  function getWithKeys(keys?: Properties<KS, T>): Properties<PS, T> | undefined;
  function getWithKeys(keys?: Properties<KS, T>, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;
  function getWithKeys(keys?: Properties<KS, T>, defaultProperties?: PropertiesSansMetadata<PS, T>) {
    const $record = keys ? encode$Record(keySchema, keys) : default$Record;
    return get($record, defaultProperties);
  }

  // Check if a record exists inside the table using its keys
  const hasWithKeys = (keys?: Properties<KS, T>) => {
    const $record = keys ? encode$Record(keySchema, keys) : default$Record;
    return has($record);
  };

  // Use (hook) the properties of a record using its keys
  const useWithKeys = (keys?: Properties<KS, T>, defaultProperties?: PropertiesSansMetadata<PS, T>) => {
    const $record = keys ? encode$Record(keySchema, keys) : default$Record;
    return use($record, defaultProperties);
  };

  // Set the properties of a record using its keys
  const setWithKeys = (properties: Properties<PS, T>, keys: Properties<KS, T>) => {
    const $record = keys ? encode$Record(keySchema, keys) : default$Record;
    return set(properties, $record);
  };

  // Get the keys properties of a record using its record
  const get$RecordKeys = ($record: $Record) => {
    return decode$Record(keySchema, $record) as unknown as Properties<KS, T>;
  };

  return {
    getWithKeys,
    hasWithKeys,
    // Don't expose useWithKeys in a non-browser environment
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
