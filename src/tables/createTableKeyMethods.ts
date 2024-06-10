import type {
  BaseTable,
  BaseTableMetadata,
  Keys,
  Properties,
  PropertiesSansMetadata,
  TableBaseMethods,
  TableWithKeysMethods,
} from "@/tables";
import { decodeRecord, encodeRecord, defaultRecord, type Record, type Schema } from "@/lib";

/**
 * Create a set of methods to interact with a table using values for its keys properties,
 * that get encoded into a Record.
 *
 * Note: See {@link TableWithKeyMethods} for more information about each method.
 *
 * @param table The BaseTable object.
 * @param methods The original table methods (see {@link TableMethods}).
 * @returns The key-specific table methods (see {@link TableWithKeyMethods}).
 * @category Table
 */
export const createTableKeyMethods = <PS extends Schema, M extends BaseTableMetadata, T = unknown>({
  table,
  ...methods
}: TableBaseMethods<PS, M, T> & {
  table: BaseTable<PS, M, T>;
}): TableWithKeysMethods<PS, M, T> => {
  const {
    metadata: { abiKeySchema },
  } = table;
  const { get, has, use, set } = methods;

  // Get the properties of a record using its keys
  function getWithKeys(): Properties<PS, T> | undefined;
  function getWithKeys(keys?: Keys<M["abiKeySchema"], T>): Properties<PS, T> | undefined;
  function getWithKeys(
    keys?: Keys<M["abiKeySchema"], T>,
    defaultProperties?: PropertiesSansMetadata<PS, T>,
  ): Properties<PS, T>;
  function getWithKeys(keys?: Keys<M["abiKeySchema"], T>, defaultProperties?: PropertiesSansMetadata<PS, T>) {
    const record = keys ? encodeRecord(abiKeySchema, keys) : defaultRecord;
    return get(record, defaultProperties);
  }

  // Check if a record exists inside the table using its keys
  const hasWithKeys = (keys?: Keys<M["abiKeySchema"], T>) => {
    const record = keys ? encodeRecord(abiKeySchema, keys) : defaultRecord;
    return has(record);
  };

  // Use (hook) the properties of a record using its keys
  const useWithKeys = (keys?: Keys<M["abiKeySchema"], T>, defaultProperties?: PropertiesSansMetadata<PS, T>) => {
    const record = keys ? encodeRecord(abiKeySchema, keys) : defaultRecord;
    return use(record, defaultProperties);
  };

  // Set the properties of a record using its keys
  const setWithKeys = (properties: Properties<PS, T>, keys: Keys<M["abiKeySchema"], T>) => {
    const record = keys ? encodeRecord(abiKeySchema, keys) : defaultRecord;
    return set(properties, record);
  };

  // Get the keys properties of a record using its record
  const getRecordKeys = (record: Record) => {
    return decodeRecord(abiKeySchema, record) as unknown as Keys<M["abiKeySchema"], T>;
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
    getRecordKeys,
  };
};
