import { concat, EMPTY, from, Observable } from "rxjs";

import type { BaseTable, Properties } from "@/tables";
import type { TableUpdate, TableWatcherParams } from "@/queries";
import { tableOperations, queries, type World, type QueryFragment, type Schema, type Record } from "@/lib";
const { getTableRecords, setRecord, removeRecord, toUpdateStream } = tableOperations();
const { defineChangeQuery, defineEnterQuery, defineExitQuery, defineQuery } = queries();

// All of the following code is taken and modified from MUD to fit new types and naming conventions.

export const systems = () => {
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
   */
  const defineRxSystem = <T>(world: World, observable$: Observable<T>, system: (event: T) => void) => {
    const subscription = observable$.subscribe(system);
    world.registerDisposer(() => subscription?.unsubscribe());
  };

  /**
   * Create a system that is called on every event of the given {@link defineChangeQuery update query}.
   *
   * @param world {@link World} object this system should be registered in.
   * @param query Update query to react to.
   * @param system System function to run when the result of the given update query changes.
   * @param options Optional: {
   * runOnInit: if true, run this system for all records matching the query when the system is created.
   * Else only run on updates after the system is created. Default true.
   * }
   */
  const defineUpdateSystem = (
    world: World,
    query: QueryFragment[],
    system: (update: TableUpdate) => void,
    options: TableWatcherParams = { runOnInit: true },
  ) => {
    defineRxSystem(world, defineChangeQuery(query, options), system);
  };

  /**
   * Create a system that is called on every event of the given {@link defineEnterQuery enter query}.
   *
   * @param world {@link World} object this system should be registered in.
   * @param query Enter query to react to.
   * @param system System function to run when the result of the given enter query changes.
   * @param options Optional: {
   * runOnInit: if true, run this system for all records matching the query when the system is created.
   * Else only run on updates after the system is created. Default true.
   * }
   */
  const defineEnterSystem = (
    world: World,
    query: QueryFragment[],
    system: (update: TableUpdate) => void,
    options: TableWatcherParams = { runOnInit: true },
  ) => {
    defineRxSystem(world, defineEnterQuery(query, options), system);
  };

  /**
   * Create a system that is called on every event of the given {@link defineExitQuery exit query}.
   *
   * @param world {@link World} object this system should be registered in.
   * @param query Exit query to react to.
   * @param system System function to run when the result of the given exit query changes.
   * @param options Optional: {
   * runOnInit: if true, run this system for all records matching the query when the system is created.
   * Else only run on updates after the system is created. Default true.
   * }
   */
  const defineExitSystem = (
    world: World,
    query: QueryFragment[],
    system: (update: TableUpdate) => void,
    options: TableWatcherParams = { runOnInit: true },
  ) => {
    defineRxSystem(world, defineExitQuery(query, options), system);
  };

  /**
   * Create a system that is called on every event of the given {@link defineQuery query}.
   *
   * @param world {@link World} object this system should be registered in.
   * @param query Query to react to.
   * @param system System function to run when the result of the given query changes.
   * @param options Optional: {
   * runOnInit: if true, run this system for all records matching the query when the system is created.
   * Else only run on updates after the system is created. Default true.
   * }
   */
  const defineSystem = (
    world: World,
    query: QueryFragment[],
    system: (update: TableUpdate) => void,
    options: TableWatcherParams = { runOnInit: true },
  ) => {
    defineRxSystem(world, defineQuery(query, options).update$, system);
  };

  /**
   * Create a system that is called every time the given table is updated.
   *
   * @param world {@link World} object this system should be registered in.
   * @param component Component to whose updates to react.
   * @param system System function to run when the given table is updated.
   * @param options Optional: {
   * runOnInit: if true, run this system for all records in the table when the system is created.
   * Else only run on updates after the system is created. Default true.
   * }
   */
  const defineTableSystem = <S extends Schema>(
    world: World,
    table: BaseTable<S>,
    system: (update: TableUpdate<S>) => void,
    options: TableWatcherParams = { runOnInit: true },
  ) => {
    const initial$ = options?.runOnInit ? from(getTableRecords(table)).pipe(toUpdateStream(table)) : EMPTY;
    defineRxSystem(world, concat(initial$, table.update$), system);
  };

  /**
   * Create a system to synchronize updates to one table with another table.
   *
   * @param world {@link World} object this system should be registered in.
   * @param query Result of `table` is added to all records matching this query.
   * @param component Function returning the table to be added to all records matching the given query.
   * @param value Function returning the table properties to be added to all records matching the given query.
   */
  const defineSyncSystem = <S extends Schema>(
    world: World,
    query: QueryFragment[],
    table: (record: Record) => BaseTable<S>,
    properties: (record: Record) => Properties<S>,
    options: TableWatcherParams & { update?: boolean } = { runOnInit: true, update: false },
  ) => {
    defineSystem(
      world,
      query,
      ({ record, type }) => {
        if (type === "enter") setRecord(table(record), record, properties(record));
        if (type === "exit") removeRecord(table(record), record);
        if (options?.update && type === "change") setRecord(table(record), record, properties(record));
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
