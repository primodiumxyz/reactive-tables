import { BaseTable } from "@/tables";
import { tables as tableMethods } from "@/tables";
import { get$RecordHex, get$RecordSymbol, transformIterator, type $Record, type $RecordSymbol } from "@/lib";

/**
 * Type of World returned by {@link createWorld}.
 */
export type World = {
  register$Record: (options?: { id?: string; idSuffix?: string }) => $Record;
  registerTable: (table: BaseTable) => void;
  tables: BaseTable[];
  get$Records: () => IterableIterator<$Record>;
  dispose: (namespace?: string) => void;
  registerDisposer: (disposer: () => void, namespace?: string) => void;
  has$Record: ($record: $Record) => boolean;
  delete$Record: ($record: $Record) => void;
  $recordSymbols: Set<$RecordSymbol>;
};

/**
 * Create a new World.
 *
 * @remarks
 * A World is the central object of an ECS application, where all {@link createTable Tables (prev Components)},
 * {@link register$Record Records (prev Entities)} and {@link createTableWatcher watchers/listeners (prev Systems)} are registerd.
 *
 * @returns A new World
 */
export function createWorld() {
  const $recordSymbols = new Set<$RecordSymbol>();
  const tables: BaseTable[] = [];
  let disposers: [string, () => void][] = [];

  function register$Record({ id, idSuffix }: { id?: string; idSuffix?: string } = {}) {
    const $record = (id || $recordSymbols.size + (idSuffix ? "-" + idSuffix : "")) as $Record;
    const $recordSymbol = get$RecordSymbol($record);

    // Register $record
    $recordSymbols.add($recordSymbol);

    return $record;
  }

  function get$Records() {
    return transformIterator($recordSymbols.values(), get$RecordHex);
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

  function has$Record($record: $Record): boolean {
    return $recordSymbols.has(get$RecordSymbol($record));
  }

  function delete$Record($record: $Record) {
    for (const table of tables) {
      if (tableMethods.has$Record(table, $record)) tableMethods.remove$Record(table, $record);
    }

    $recordSymbols.delete(get$RecordSymbol($record));
  }

  return {
    register$Record,
    tables,
    registerTable,
    dispose,
    registerDisposer,
    has$Record,
    get$Records,
    $recordSymbols,
    delete$Record,
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
 * Get all tables that have a value for the given $record.
 *
 * @dev (MUD) Design decision: don't store a list of tables for each $record but compute it dynamically when needed
 * because there are less tables than $records and maintaining a list of tables per $record is a large overhead.
 *
 * @param world World object the given $record is registered on.
 * @param $record {@link $Record} to get the list of tables for.
 * @returns Array of tables that have a value for the given $record.
 */
export function get$RecordTables(world: World, $record: $Record): BaseTable[] {
  return world.tables.filter((table) => tableMethods.has$Record(table, $record));
}
