import type { BaseTable } from "@/tables/types";
import { type Entity, type EntitySymbol, getEntityHex, getEntitySymbol } from "@/lib/external/mud/entity";
import { tableOperations } from "@/lib/external/mud/tables";
import { transformIterator } from "@/lib/external/mud/utils";
const { hasEntity: tableHasEntity, removeEntity: tableRemoveEntity } = tableOperations;

/**
 * Type of World returned by {@link createWorld}.
 *
 * Note: Modified from RECS.
 *
 * @category World
 */
export type World = {
  registerEntity: (options?: { id?: string; idSuffix?: string }) => Entity;
  registerTable: (table: BaseTable) => void;
  tables: BaseTable[];
  getEntities: () => IterableIterator<Entity>;
  dispose: (namespace?: string) => void;
  registerDisposer: (disposer: () => void, namespace?: string) => void;
  hasEntity: (entity: Entity) => boolean;
  deleteEntity: (entity: Entity) => void;
  entitySymbols: Set<EntitySymbol>;
};

/**
 * Create a new World.
 *
 * Note: Modified from RECS.
 *
 * @remarks
 * A World is the central object of an ECS application, where all {@link createTable Tables (prev Components)},
 * {@link registerEntity Records (prev Entities)} and {@link createTableWatcher watchers/listeners (prev Systems)} are registerd.
 *
 * @returns A new World
 * @category World
 */
export function createWorld() {
  const entitySymbols = new Set<EntitySymbol>();
  const tables: BaseTable[] = [];
  let disposers: [string, () => void][] = [];

  function registerEntity({ id, idSuffix }: { id?: string; idSuffix?: string } = {}) {
    const entity = (id || entitySymbols.size + (idSuffix ? "-" + idSuffix : "")) as Entity;
    const entitySymbol = getEntitySymbol(entity);

    // Register entity
    entitySymbols.add(entitySymbol);

    return entity;
  }

  function getEntities() {
    return transformIterator(entitySymbols.values(), getEntityHex);
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

  function hasEntity(entity: Entity): boolean {
    return entitySymbols.has(getEntitySymbol(entity));
  }

  function deleteEntity(entity: Entity) {
    for (const table of tables) {
      if (tableHasEntity(table, entity)) tableRemoveEntity(table, entity);
    }

    entitySymbols.delete(getEntitySymbol(entity));
  }

  return {
    registerEntity,
    tables,
    registerTable,
    dispose,
    registerDisposer,
    hasEntity,
    getEntities,
    entitySymbols,
    deleteEntity,
  } satisfies World;
}

/**
 * Create a new namespace from an existing World.
 * The `dispose` method of a namespaced World only calls disposers registered on this namespace.
 *
 * Note: Modified from RECS.
 *
 * @param world World to create a new namespace for.
 * @param namespace String descriptor of the new namespace.
 * @returns World with a new namespace.
 * @category World
 */
export function namespaceWorld(world: World, namespace: string) {
  return {
    ...world,
    registerDisposer: (disposer: () => void) => world.registerDisposer(disposer, namespace),
    dispose: () => world.dispose(namespace),
  };
}

/**
 * Get all tables that have a value for the given entity.
 *
 * @dev (MUD) Design decision: don't store a list of tables for each entity but compute it dynamically when needed
 * because there are less tables than entities and maintaining a list of tables per entity is a large overhead.
 *
 * @param world World object the given entity is registered on.
 * @param entity {@link Entity} to get the list of tables for.
 * @returns Array of tables that have a value for the given entity.
 * @category World
 */
export function getEntityTables(world: World, entity: Entity): BaseTable[] {
  return world.tables.filter((table) => tableHasEntity(table, entity));
}
