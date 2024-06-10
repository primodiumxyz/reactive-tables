import type { BaseTable } from "@/tables";
import {
  getRecordHex,
  getRecordSymbol,
  tableOperations,
  transformIterator,
  type Record,
  type RecordSymbol,
} from "@/lib";
const { hasRecord: tableHasRecord, removeRecord: tableRemoveRecord } = tableOperations();

/**
 * Type of World returned by {@link createWorld}.
 */
export type World = {
  registerRecord: (options?: { id?: string; idSuffix?: string }) => Record;
  registerTable: (table: BaseTable) => void;
  tables: BaseTable[];
  getRecords: () => IterableIterator<Record>;
  dispose: (namespace?: string) => void;
  registerDisposer: (disposer: () => void, namespace?: string) => void;
  hasRecord: (record: Record) => boolean;
  deleteRecord: (record: Record) => void;
  recordSymbols: Set<RecordSymbol>;
};

/**
 * Create a new World.
 *
 * @remarks
 * A World is the central object of an ECS application, where all {@link createTable Tables (prev Components)},
 * {@link registerRecord Records (prev Entities)} and {@link createTableWatcher watchers/listeners (prev Systems)} are registerd.
 *
 * @returns A new World
 */
export function createWorld() {
  const recordSymbols = new Set<RecordSymbol>();
  const tables: BaseTable[] = [];
  let disposers: [string, () => void][] = [];

  function registerRecord({ id, idSuffix }: { id?: string; idSuffix?: string } = {}) {
    const record = (id || recordSymbols.size + (idSuffix ? "-" + idSuffix : "")) as Record;
    const recordSymbol = getRecordSymbol(record);

    // Register record
    recordSymbols.add(recordSymbol);

    return record;
  }

  function getRecords() {
    return transformIterator(recordSymbols.values(), getRecordHex);
  }

  function registerTable(table: BaseTable) {
    tables.push(table);
  }

  function dispose(namespace?: string) {
    for (const [, disposer] of disposers.filter((d) => !namespace || d[0] === namespace)) {
      disposer();
    }

    disposers = disposers.filter((d) => namespace && d[0] !== namespace);
  }

  function registerDisposer(disposer: () => void, namespace = "") {
    disposers.push([namespace, disposer]);
  }

  function hasRecord(record: Record): boolean {
    return recordSymbols.has(getRecordSymbol(record));
  }

  function deleteRecord(record: Record) {
    for (const table of tables) {
      if (tableHasRecord(table, record)) tableRemoveRecord(table, record);
    }

    recordSymbols.delete(getRecordSymbol(record));
  }

  return {
    registerRecord,
    tables,
    registerTable,
    dispose,
    registerDisposer,
    hasRecord,
    getRecords,
    recordSymbols,
    deleteRecord,
  } satisfies World;
}

/**
 * Create a new namespace from an existing World.
 * The `dispose` method of a namespaced World only calls disposers registered on this namespace.
 *
 * @param world World to create a new namespace for.
 * @param namespace String descriptor of the new namespace.
 * @returns World with a new namespace.
 */
export function namespaceWorld(world: World, namespace: string) {
  return {
    ...world,
    registerDisposer: (disposer: () => void) => world.registerDisposer(disposer, namespace),
    dispose: () => world.dispose(namespace),
  };
}

/**
 * Get all tables that have a value for the given record.
 *
 * @dev (MUD) Design decision: don't store a list of tables for each record but compute it dynamically when needed
 * because there are less tables than records and maintaining a list of tables per record is a large overhead.
 *
 * @param world World object the given record is registered on.
 * @param record {@link Record} to get the list of tables for.
 * @returns Array of tables that have a value for the given record.
 */
export function getRecordTables(world: World, record: Record): BaseTable[] {
  return world.tables.filter((table) => tableHasRecord(table, record));
}
