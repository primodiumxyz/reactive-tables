import { Subject, filter, map } from "rxjs";
import { useEffect, useMemo, useState } from "react";

import { createTableKeyMethods } from "@/tables/methods/createTableKeyMethods";
import { createTableWatcher } from "@/tables/methods/createTableWatcher";
import type { BaseTable, TableMethods, TableMutationOptions, TableUpdate } from "@/tables/types";
import { type TableWatcherParams, type TableMethodsWatcherOptions } from "@/queries/types";
import { defaultEntity, type Entity } from "@/lib/external/mud/entity";
import type { BaseTableMetadata, Properties, PropertiesSansMetadata, Schema } from "@/lib/external/mud/schema";
import { tableOperations } from "@/lib/external/mud/tables";
import { queries } from "@/lib/external/mud/queries";
import type { World } from "@/lib/external/mud/world";
import { type PersistentStorageAdapter } from "@/lib/persistence";
const {
  setEntity,
  removeEntity,
  updateEntity,
  getEntityProperties,
  hasEntity,
  isTableUpdate: _isTableUpdate,
} = tableOperations;
const { runQuery, defineQuery, useEntityQuery, With, WithProperties, WithoutProperties, MatchingProperties } = queries;

/* -------------------------------------------------------------------------- */
/*                               ATTACH METHODS                               */
/* -------------------------------------------------------------------------- */

export const createTableMethods = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
  world: World,
  table: BaseTable<PS, M, T>,
  storageAdapter: PersistentStorageAdapter,
  persist?: boolean,
  version?: string,
): TableMethods<PS, M, T> => {
  const paused: Map<Entity, boolean> = new Map();
  const blocked: Map<Entity, boolean> = new Map();
  const pendingUpdate: Map<Entity, TableUpdate<PS, M, T>> = new Map();

  // Update event stream that takes into account overridden entity values
  const update$ = new Subject<TableUpdate<PS, M, T>>();

  /* --------------------------------- STREAMS -------------------------------- */
  // Pause updates for an entity (don't react to changes in hooks, e.g. useProperties)
  const pauseUpdates = (
    entity?: Entity,
    properties?: Properties<PS, T>,
    options: TableMutationOptions = { skipUpdateStream: false },
  ) => {
    entity = entity ?? defaultEntity;

    paused.set(entity, true);
    if (properties) setEntity(table, entity, properties, options);
  };

  // Enable updates for an entity (react again to changes in the store, e.g. useProperties)
  // If any update happened during the pause, the state will be updated to the latest properties
  const resumeUpdates = (entity?: Entity, options: TableMutationOptions = { skipUpdateStream: false }) => {
    entity = entity ?? defaultEntity;

    if (!paused.get(entity)) return;
    paused.set(entity, false);

    const update = pendingUpdate.get(entity);
    if (!update) return;

    if (update.properties.prev) setEntity(table, entity, update.properties.prev, { skipUpdateStream: true });
    if (update.properties.current) setEntity(table, entity, update.properties.current, options);
    else removeEntity(table, entity);

    pendingUpdate.delete(entity);
  };

  // Block updates for an entity
  const blockUpdates = (entity?: Entity) => {
    blocked.set(entity ?? defaultEntity, true);
  };

  // Unblock updates for an entity
  const unblockUpdates = (entity?: Entity) => {
    blocked.set(entity ?? defaultEntity, false);
  };

  // Channel through update events from the original component if there are no overrides
  table.update$
    .pipe(
      filter((e) => !paused.get(e.entity)),
      map((update) => ({ ...update, table })),
    )
    .subscribe(update$);

  table.update$
    .pipe(
      filter((e) => !!paused.get(e.entity)),
      map((update) => {
        pendingUpdate.set(update.entity, update);
      }),
    )
    .subscribe();

  /* ----------------------------------- SET ---------------------------------- */
  // Set the properties for an entity
  const set = (properties: Properties<PS, T>, entity?: Entity, options?: TableMutationOptions) => {
    entity = entity ?? defaultEntity;

    if (blocked.get(entity)) return;
    if (paused.get(entity)) {
      const prevProperties = pendingUpdate.get(entity)?.properties.current ?? getEntityProperties(table, entity);
      pendingUpdate.set(entity, {
        entity,
        properties: { current: properties, prev: prevProperties },
        table,
        type: prevProperties ? "update" : "enter",
      });
    } else {
      setEntity(table, entity, properties, options);
    }

    if (options?.persist ?? persist) storageAdapter.setProperties(table, properties, entity, version);
  };

  /* ----------------------------------- GET ---------------------------------- */
  // Get the properties for an entity
  function get(): Properties<PS, T> | undefined;
  function get(entity: Entity | undefined): Properties<PS, T> | undefined;
  function get(entity?: Entity | undefined, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;
  function get(entity?: Entity, defaultProperties?: PropertiesSansMetadata<PS, T>) {
    entity = entity ?? defaultEntity;
    return getEntityProperties(table, entity) ?? defaultProperties;
  }

  /* --------------------------------- QUERIES -------------------------------- */
  // Get all entities inside the table
  const getAll = () => {
    const entities = runQuery([With(table)]);
    return [...entities];
  };

  // Get all entities with specific properties
  const getAllWith = (properties: Partial<Properties<PS, T>>) => {
    const entities = runQuery([WithProperties(table, properties)]);
    return [...entities];
  };

  // Get all entities without specific properties
  const getAllWithout = (properties: Partial<Properties<PS, T>>) => {
    const entities = runQuery([With(table), WithoutProperties(table, properties)]);
    return [...entities];
  };

  /* ---------------------------------- HOOKS --------------------------------- */
  // Hook to get all entities inside the table
  function useAll() {
    const entities = useEntityQuery([With(table)]);
    return [...entities];
  }

  // Hook to get all entities with specific properties
  const useAllWith = (properties: Partial<Properties<PS, T>>) => {
    const entities = useEntityQuery([WithProperties(table, properties)]);
    return [...entities];
  };

  // Hook to get all entities without specific properties
  const useAllWithout = (properties: Partial<Properties<PS, T>>) => {
    const entities = useEntityQuery([With(table), WithoutProperties(table, properties)]);
    return [...entities];
  };

  // Hook to get all entities matching arbitrary conditions
  const useAllMatching = (where: (properties: Properties<PS, T>) => boolean) => {
    const whereMemoized = useMemo(() => where, []);
    // @ts-expect-error TODO: fix weird typing issue
    const entities = useEntityQuery([With(table), MatchingProperties(table, whereMemoized)]);
    return [...entities];
  };

  /* --------------------------------- REMOVE --------------------------------- */
  // Remove an entity from the table (delete its properties)
  const remove = (entity?: Entity) => {
    entity = entity ?? defaultEntity;
    removeEntity(table, entity);
  };

  /* ---------------------------------- CLEAR --------------------------------- */
  // Clear the table (remove all entities)
  const clear = () => {
    for (const entity of runQuery([With(table)])) {
      removeEntity(table, entity);
    }
  };

  /* --------------------------------- UPDATE --------------------------------- */
  // Update the properties for an entity, possibly with partial properties
  const update = (properties: Partial<Properties<PS, T>>, entity?: Entity, options?: TableMutationOptions) => {
    entity = entity ?? defaultEntity;
    updateEntity(table, entity, properties, undefined, options);
    if (persist) storageAdapter.updateProperties(table, properties, entity, version);
  };

  /* ----------------------------------- HAS ---------------------------------- */
  // Check if an entity exists in the table
  const has = (entity?: Entity) => {
    if (!entity) return false;
    return hasEntity(table, entity);
  };

  const isTableUpdate = (update: TableUpdate<PS, M, T>): update is TableUpdate<PS, M, T> => {
    return _isTableUpdate(update, table);
  };

  /* ----------------------------- USE PROPERTIES ----------------------------- */
  // Hook to get the properties for an entity in real-time
  function useProperties(entity?: Entity): Properties<PS, T> | undefined;
  function useProperties(entity?: Entity, defaultProperties?: PropertiesSansMetadata<PS, T>): Properties<PS, T>;
  function useProperties(entity: Entity = defaultEntity, defaultProperties?: PropertiesSansMetadata<PS, T>) {
    const [properties, setProperties] = useState<Properties<PS, T> | PropertiesSansMetadata<PS, T> | undefined>(
      getEntityProperties(table, entity) ?? defaultProperties,
    );

    useEffect(() => {
      setProperties(getEntityProperties(table, entity));

      // fix: if pre-populated with state, useComponentValue doesn’t update when there’s a component that has been removed.
      const queryResult = defineQuery([With(table)], { runOnInit: true });
      const subscription = queryResult.update$.subscribe((_update) => {
        const update = _update as TableUpdate<PS, M, T>;
        if (isTableUpdate(update) && update.entity === entity) {
          const { current: nextProperties } = update.properties;
          setProperties(nextProperties);
        }
      });

      return () => subscription.unsubscribe();
    }, [table, entity]);

    return properties ?? defaultProperties;
  }

  /* ---------------------------------- WATCH --------------------------------- */
  // Create a query tied to this table, with callbacks on change, enter & exit from the query conditions
  // or if no query, on any change in the table
  const watch = (options: TableMethodsWatcherOptions<PS, M, T>, params?: TableWatcherParams) =>
    createTableWatcher({ world, table, ...options }, params);

  // Base methods available to all tables
  const baseMethods = {
    get,
    set,
    getAll,
    getAllWith,
    getAllWithout,
    remove,
    clear,
    update,
    has,
    pauseUpdates,
    resumeUpdates,
    blockUpdates,
    unblockUpdates,
    watch,
  };

  // Add hooks only if not in a node environment
  const hookMethods = { useAll, useAllWith, useAllWithout, useAllMatching, use: useProperties };
  if (typeof window === "undefined") {
    Object.keys(hookMethods).forEach((key) => {
      hookMethods[key as keyof typeof hookMethods] = () => {
        throw new Error(`The method ${key} is only available in the browser`);
      };
    });
  }

  const methods = {
    ...baseMethods,
    ...hookMethods,
  };

  return {
    ...methods,
    ...createTableKeyMethods({ ...methods, table }),
  };
};
