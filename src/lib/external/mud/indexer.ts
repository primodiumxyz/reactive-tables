import { type Schema, type $Record, type $RecordSymbol, get$RecordHex, get$RecordSymbol, tableOperations } from "@/lib";
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
  get$RecordsWithValue: (properties: Properties<S, T>) => Set<$Record>;
} => {
  const propertiesTo$Records = new Map<string, Set<$RecordSymbol>>();

  function get$RecordsWithValue(properties: Properties<S, T>) {
    const $records = propertiesTo$Records.get(getPropertiesKey(properties));
    return $records ? new Set([...$records].map(get$RecordHex)) : new Set<$Record>();
  }

  function getPropertiesKey(properties: Properties<S, T>): string {
    return Object.values(properties).join("/");
  }

  function add($record: $RecordSymbol, properties: Properties<S, T> | undefined) {
    if (!properties) return;
    const propertiesKey = getPropertiesKey(properties);
    let $recordsWithProperties = propertiesTo$Records.get(propertiesKey);
    if (!$recordsWithProperties) {
      $recordsWithProperties = new Set<$RecordSymbol>();
      propertiesTo$Records.set(propertiesKey, $recordsWithProperties);
    }
    $recordsWithProperties.add($record);
  }

  function remove($record: $RecordSymbol, properties: Properties<S, T> | undefined) {
    if (!properties) return;
    const propertiesKey = getPropertiesKey(properties);
    const $recordsWithProperties = propertiesTo$Records.get(propertiesKey);
    if (!$recordsWithProperties) return;
    $recordsWithProperties.delete($record);
  }

  // Initial indexing
  for (const $record of table.$records()) {
    const properties = tableOperations().get$RecordProperties(table, $record);
    add(get$RecordSymbol($record), properties);
  }

  // Keeping index up to date
  const subscription = table.update$.subscribe(({ $record, properties }) => {
    // Remove from previous location
    remove(get$RecordSymbol($record), properties.prev);

    // Add to new location
    add(get$RecordSymbol($record), properties.current);
  });

  table.world.registerDisposer(() => subscription?.unsubscribe());

  return { ...table, get$RecordsWithValue };
};
