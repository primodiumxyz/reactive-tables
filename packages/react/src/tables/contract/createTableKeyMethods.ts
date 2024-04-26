import { Properties, PropertiesSansMetadata, OriginalTableMethods } from "@/tables";
import { ContractTableMethods, ContractTableWithKeysMethods, KeySchema } from "@/tables/contract";
import { decode$Record, encode$Record, default$Record, $Record, Schema } from "@/lib";

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
export const createTableKeyMethods = <VS extends Schema, KS extends Schema = Schema, T = unknown>({
  keySchema,
  ...methods
}: { keySchema: KeySchema } & ContractTableMethods<VS, T> & OriginalTableMethods): ContractTableWithKeysMethods<
  VS,
  KS,
  T
> => {
  const { get, has, use, set } = methods;

  // Get the properties of a record using its keys
  function getWithKeys(): Properties<VS, T> | undefined;
  function getWithKeys(keys?: Properties<KS, T>): Properties<VS, T> | undefined;
  function getWithKeys(keys?: Properties<KS, T>, defaultProps?: PropertiesSansMetadata<VS, T>): Properties<VS, T>;
  function getWithKeys(keys?: Properties<KS, T>, defaultProps?: PropertiesSansMetadata<VS, T>) {
    const $record = keys ? encode$Record(keySchema, keys) : default$Record;
    return get($record, defaultProps);
  }

  // Check if a record exists inside the table using its keys
  const hasWithKeys = (keys?: Properties<KS, T>) => {
    const $record = keys ? encode$Record(keySchema, keys) : default$Record;
    return has($record);
  };

  // Use (hook) the properties of a record using its keys
  const useWithKeys = (keys?: Properties<KS, T>, defaultProps?: PropertiesSansMetadata<VS, T>) => {
    const $record = keys ? encode$Record(keySchema, keys) : default$Record;
    return use($record, defaultProps);
  };

  // Set the properties of a record using its keys
  const setWithKeys = (properties: Properties<VS, T>, keys: Properties<KS, T>) => {
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
