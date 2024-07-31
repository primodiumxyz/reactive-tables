import { concat, EMPTY, from, Observable, Subject, takeUntil } from "rxjs";

import type { BaseTable, TableUpdate } from "@/tables/types";
import type { TableWatcherParams } from "@/queries/types";
import type { Entity } from "@/lib/external/mud/entity";
import { queries, type QueryFragment } from "@/lib/external/mud/queries";
import type { Properties, Schema } from "@/lib/external/mud/schema";
import { tableOperations } from "@/lib/external/mud/tables";
import type { World } from "@/lib/external/mud/world";
const { getTableEntities, setEntity, removeEntity, toUpdateStream } = tableOperations;
const { defineChangeQuery, defineEnterQuery, defineExitQuery, defineQuery } = queries;

// All of the following code is taken and modified from MUD to fit new types and naming conventions.

type Unsubscribe = () => void;

const _systems = () => {
  /**
   * Create a system that is called on every update of the given observable.
   *
   * @remarks
   * Advantage of using this function over directly subscribing to the RxJS observable is that the system is registered in the `world` and
   * disposed when the `world` is disposed (eg. during a hot reload in development).
   *
   * @param world {@link World} object this system should be registered in.
   * @param observable$ Observable to react to.
   * @param system System function to run on updates of the `observable$`. System function gets passed the update events from the `observable$`.
   * @param until Optional: Function to determine if the system should be terminated based on the update.
   * @returns Function to unsubscribe the system from the `observable$`.
   */
  const defineRxSystem = <T>(
    world: World,
    observable$: Observable<T>,
    system: (event: T) => void,
    until?: (event: T) => boolean,
  ): Unsubscribe => {
    // if until is provided, we want to close the sub when it returns true
    if (until) {
      const terminate = new Subject<void>();
      const subscription = observable$.pipe(takeUntil(terminate)).subscribe((update) => {
        system(update);
        if (until(update)) {
          terminate.next();
          terminate.complete();
        }
      });

      const unsubscribe = () => {
        if (subscription && !subscription.closed) subscription.unsubscribe();
        if (terminate && !terminate.closed) terminate.complete();
      };

      world.registerDisposer(() => unsubscribe());
      return unsubscribe;
    }

    const subscription = observable$.subscribe(system);
    const unsubscribe = () => {
      if (subscription && !subscription.closed) subscription.unsubscribe();
    };

    world.registerDisposer(() => unsubscribe());
    return unsubscribe;
  };

  /**
   * Create a system that is called on every event of the given {@link defineChangeQuery update query}.
   *
   * @param world {@link World} object this system should be registered in.
   * @param query Update query to react to.
   * @param system System function to run when the result of the given update query changes.
   * @param options Optional: {
   * runOnInit: if true, run this system for all entities matching the query when the system is created.
   * Else only run on updates after the system is created. Default true.
   * }
   * @returns Function to unsubscribe the system from the query.
   */
  const defineUpdateSystem = (
    world: World,
    query: QueryFragment[],
    system: (update: TableUpdate) => void,
    options: TableWatcherParams = { runOnInit: true },
  ): Unsubscribe => {
    return defineRxSystem(world, defineChangeQuery(query, options), system);
  };

  /**
   * Create a system that is called on every event of the given {@link defineEnterQuery enter query}.
   *
   * @param world {@link World} object this system should be registered in.
   * @param query Enter query to react to.
   * @param system System function to run when the result of the given enter query changes.
   * @param options Optional: {
   * runOnInit: if true, run this system for all entities matching the query when the system is created.
   * Else only run on updates after the system is created. Default true.
   * }
   * @returns Function to unsubscribe the system from the query.
   */
  const defineEnterSystem = (
    world: World,
    query: QueryFragment[],
    system: (update: TableUpdate) => void,
    options: TableWatcherParams = { runOnInit: true },
  ): Unsubscribe => {
    return defineRxSystem(world, defineEnterQuery(query, options), system);
  };

  /**
   * Create a system that is called on every event of the given {@link defineExitQuery exit query}.
   *
   * @param world {@link World} object this system should be registered in.
   * @param query Exit query to react to.
   * @param system System function to run when the result of the given exit query changes.
   * @param options Optional: {
   * runOnInit: if true, run this system for all entities matching the query when the system is created.
   * Else only run on updates after the system is created. Default true.
   * }
   * @returns Function to unsubscribe the system from the query.
   */
  const defineExitSystem = (
    world: World,
    query: QueryFragment[],
    system: (update: TableUpdate) => void,
    options: TableWatcherParams = { runOnInit: true },
  ): Unsubscribe => {
    return defineRxSystem(world, defineExitQuery(query, options), system);
  };

  /**
   * Create a system that is called on every event of the given {@link defineQuery query}.
   *
   * @param world {@link World} object this system should be registered in.
   * @param query Query to react to.
   * @param system System function to run when the result of the given query changes.
   * @param options Optional: {
   * runOnInit: if true, run this system for all entities matching the query when the system is created.
   * Else only run on updates after the system is created. Default true.
   * }
   * @returns Function to unsubscribe the system from the query.
   */
  const defineSystem = (
    world: World,
    query: QueryFragment[],
    system: (update: TableUpdate) => void,
    options: TableWatcherParams = { runOnInit: true },
  ): Unsubscribe => {
    return defineRxSystem(world, defineQuery(query, options).update$, system);
  };

  /**
   * Create a system that is called every time the given table is updated.
   *
   * @param world {@link World} object this system should be registered in.
   * @param component Component to whose updates to react.
   * @param system System function to run when the given table is updated.
   * @param options Optional: {
   * runOnInit: if true, run this system for all entities in the table when the system is created.
   * Else only run on updates after the system is created. Default true.
   * }
   * @param until Optional: Function to determine if the system should be terminated based on the update.
   * @returns Function to unsubscribe the system from the table.
   */
  const defineTableSystem = <S extends Schema>(
    world: World,
    table: BaseTable<S>,
    system: (update: TableUpdate<S>) => void,
    options: TableWatcherParams = { runOnInit: true },
    until?: (update: TableUpdate<S>) => boolean,
  ): Unsubscribe => {
    const initial$ = options?.runOnInit ? from(getTableEntities(table)).pipe(toUpdateStream(table)) : EMPTY;
    return defineRxSystem(world, concat(initial$, table.update$), system, until);
  };

  /**
   * Create a system to synchronize updates to one table with another table.
   *
   * @param world {@link World} object this system should be registered in.
   * @param query Result of `table` is added to all entities matching this query.
   * @param component Function returning the table to be added to all entities matching the given query.
   * @param value Function returning the table properties to be added to all entities matching the given query.
   * @param options Optional: {
   * runOnInit: if true, run this system for all entities matching the query when the system is created.
   * Else only run on updates after the system is created. Default true.
   * update: if true, run this system on every update of the table, not just on enter and exit. Default false.
   * }
   * @returns Function to unsubscribe the system from the query.
   */
  const defineSyncSystem = <S extends Schema>(
    world: World,
    query: QueryFragment[],
    table: (entity: Entity) => BaseTable<S>,
    properties: (entity: Entity) => Properties<S>,
    options: TableWatcherParams & { update?: boolean } = { runOnInit: true, update: false },
  ): Unsubscribe => {
    return defineSystem(
      world,
      query,
      ({ entity, type }) => {
        if (type === "enter") setEntity(table(entity), entity, properties(entity));
        if (type === "exit") removeEntity(table(entity), entity);
        if (options?.update && type === "update") setEntity(table(entity), entity, properties(entity));
      },
      options,
    );
  };

  return {
    defineRxSystem,
    defineUpdateSystem,
    defineEnterSystem,
    defineExitSystem,
    defineSystem,
    defineTableSystem,
    defineSyncSystem,
  };
};

export const systems = _systems();
