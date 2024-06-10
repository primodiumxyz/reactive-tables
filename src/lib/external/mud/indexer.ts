import { type Schema, type Record, type RecordSymbol, getRecordHex, getRecordSymbol, tableOperations } from "@/lib";
import type { BaseTable, BaseTableMetadata, Properties } from "@/tables";

/**
 * Create an indexed table from a given table.
 *
 * Note: Modified from RECS.
 *
 * @remarks
 * An indexed table keeps a "reverse mapping" from {@link Properties} to the Set of records with this properties.
 * This adds a performance overhead to modifying table properties and a memory overhead since in the worst case there is one
 * Set per record (if every record has different properties).
 * In return the performance for querying for records with given table properties is close to O(1) (instead of O(#records) in a regular non-indexed table).
 * As a rule of thumb only tables that are added to many records and are queried with {@link HasValue} a lot should be indexed (eg. the Position table).
 *
 * @dev (MUD) This could be made more (memory) efficient by using a hash of the component properties as key, but would require handling hash collisions.
 *
 * @param table base table to index.
 * @returns Indexed version of the table.
 */
export const createIndexer = <S extends Schema, M extends BaseTableMetadata, T = unknown>(
  table: BaseTable<S, M, T>,
): BaseTable<S, M, T> & {
  getRecordsWithValue: (properties: Properties<S, T>) => Set<Record>;
} => {
  const propertiesToRecords = new Map<string, Set<RecordSymbol>>();

  function getRecordsWithValue(properties: Properties<S, T>) {
    const records = propertiesToRecords.get(getPropertiesKey(properties));
    return records ? new Set([...records].map(getRecordHex)) : new Set<Record>();
  }

  function getPropertiesKey(properties: Properties<S, T>): string {
    return Object.values(properties).join("/");
  }

  function add(record: RecordSymbol, properties: Properties<S, T> | undefined) {
    if (!properties) return;
    const propertiesKey = getPropertiesKey(properties);
    let recordsWithProperties = propertiesToRecords.get(propertiesKey);
    if (!recordsWithProperties) {
      recordsWithProperties = new Set<RecordSymbol>();
      propertiesToRecords.set(propertiesKey, recordsWithProperties);
    }
    recordsWithProperties.add(record);
  }

  function remove(record: RecordSymbol, properties: Properties<S, T> | undefined) {
    if (!properties) return;
    const propertiesKey = getPropertiesKey(properties);
    const recordsWithProperties = propertiesToRecords.get(propertiesKey);
    if (!recordsWithProperties) return;
    recordsWithProperties.delete(record);
  }

  // Initial indexing
  for (const record of table.records()) {
    const properties = tableOperations().getRecordProperties(table, record);
    add(getRecordSymbol(record), properties);
  }

  // Keeping index up to date
  const subscription = table.update$.subscribe(({ record, properties }) => {
    // Remove from previous location
    remove(getRecordSymbol(record), properties.prev);

    // Add to new location
    add(getRecordSymbol(record), properties.current);
  });

  table.world.registerDisposer(() => subscription?.unsubscribe());

  return { ...table, getRecordsWithValue };
};
