import {
  concat,
  concatMap,
  distinctUntilChanged,
  filter,
  from,
  map,
  merge,
  Observable,
  of,
  type OperatorFunction,
  pipe,
  share,
} from "rxjs";
import { observable, ObservableSet } from "mobx";
import isEqual from "fast-deep-equal";
import { useEffect, useMemo, useState } from "react";

import type { TableUpdate } from "@/queries";
import type { BaseTable, Properties } from "@/tables";
import { type $Record, type Schema, tableOperations, Type } from "@/lib";

// All of the following code is taken and modified from MUD to fit new types and naming conventions.

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export enum QueryFragmentType {
  With,
  WithProperties,
  Without,
  WithoutProperties,
  ProxyRead,
  ProxyExpand,
}

export type WithQueryFragment<T extends Schema> = {
  type: QueryFragmentType.With;
  table: BaseTable<T>;
};

export type WithPropertiesQueryFragment<T extends Schema> = {
  type: QueryFragmentType.WithProperties;
  table: BaseTable<T>;
  properties: Partial<Properties<T>>;
};

export type WithoutQueryFragment<T extends Schema> = {
  type: QueryFragmentType.Without;
  table: BaseTable<T>;
};

export type WithoutPropertiesQueryFragment<T extends Schema> = {
  type: QueryFragmentType.WithoutProperties;
  table: BaseTable<T>;
  properties: Partial<Properties<T>>;
};

export type ProxyReadQueryFragment = {
  type: QueryFragmentType.ProxyRead;
  table: BaseTable<{ properties: Type.$Record }>;
  depth: number;
};

export type ProxyExpandQueryFragment = {
  type: QueryFragmentType.ProxyExpand;
  table: BaseTable<{ properties: Type.$Record }>;
  depth: number;
};

export type QueryFragment<T extends Schema = Schema> =
  | WithQueryFragment<T>
  | WithPropertiesQueryFragment<T>
  | WithoutQueryFragment<T>
  | WithoutPropertiesQueryFragment<T>
  | ProxyReadQueryFragment
  | ProxyExpandQueryFragment;

export type $RecordQueryFragment<T extends Schema = Schema> =
  | WithQueryFragment<T>
  | WithPropertiesQueryFragment<T>
  | WithoutQueryFragment<T>
  | WithoutPropertiesQueryFragment<T>;

export type SettingQueryFragment = ProxyReadQueryFragment | ProxyExpandQueryFragment;

export type QueryFragments = QueryFragment<Schema>[];

/* -------------------------------------------------------------------------- */
/*                                   QUERIES                                  */
/* -------------------------------------------------------------------------- */

function filterNullish<T>(): OperatorFunction<T, NonNullable<T>> {
  return pipe<Observable<T>, Observable<NonNullable<T>>>(
    filter<T>((x: T) => x != null) as OperatorFunction<T, NonNullable<T>>,
  );
}

function useDeepMemo<T>(currentProperties: T): T {
  const [stableProperties, setStableProperties] = useState(currentProperties);

  useEffect(() => {
    if (!isEqual(currentProperties, stableProperties)) {
      setStableProperties(currentProperties);
    }
  }, [currentProperties]);

  return stableProperties;
}

export const queries = {
  /**
   * Create a {@link WithQueryFragment}.
   *
   * @remarks
   * The {@link WithQueryFragment} filters for $records that have the given table,
   * independent from the table properties.
   *
   * @example
   * Query for all $records with a `Position`.
   * ```
   * runQuery([With(Position)]);
   * ```
   *
   * @param table BaseTable this query fragment refers to.
   * @returns query fragment to be used in {@link queries.runQuery} or {@link queries.defineQuery}.
   */
  With<T extends Schema>(table: BaseTable<T>): WithQueryFragment<T> {
    return { type: QueryFragmentType.With, table };
  },

  /**
   * Create a {@link WithoutQueryFragment}.
   *
   * @remarks
   * The {@link WithoutQueryFragment} filters for $records that don't have the given table,
   * independent from the table properties.
   *
   * @example
   * Query for all $records with a `Position` that are not `Movable`.
   * ```
   * runQuery([With(Position), Without(Movable)]);
   * ```
   *
   * @param table BaseTable this query fragment refers to.
   * @returns query fragment to be used in {@link queries.runQuery} or {@link queries.defineQuery}.
   */
  Without<T extends Schema>(table: BaseTable<T>): WithoutQueryFragment<T> {
    return { type: QueryFragmentType.Without, table };
  },

  /**
   * Create a {@link WithPropertiesQueryFragment}.
   *
   * @remarks
   * The {@link WithPropertiesQueryFragment} filters for $records that have the given table
   * with the given table properties.
   *
   * @example
   * Query for all $records at Position (0,0).
   * ```
   * runQuery([WithProperties(Position, { x: 0, y: 0 })]);
   * ```
   *
   * @param table BaseTable this query fragment refers to.
   * @param properties Only include $records with this (partial) table properties from the result.
   * @returns query fragment to be used in {@link queries.runQuery} or {@link queries.defineQuery}.
   */
  WithProperties<T extends Schema>(
    table: BaseTable<T>,
    properties: Partial<Properties<T>>,
  ): WithPropertiesQueryFragment<T> {
    return { type: QueryFragmentType.WithProperties, table, properties };
  },

  /**
   * Create a {@link WithoutPropertiesQueryFragment}.
   *
   * @remarks
   * The {@link WithoutPropertiesQueryFragment} filters for $records that don't have the given table
   * with the given table properties.
   *
   * @example
   * Query for all $records that have a `Position`, except for those at `Position` (0,0).
   * ```
   * runQuery([With(Position), WithoutProperties(Position, { x: 0, y: 0 })]);
   * ```
   *
   * @param table BaseTable this query fragment refers to.
   * @param properties Exclude $records with this (partial) table properties from the result.
   * @returns query fragment to be used in {@link queries.runQuery} or {@link queries.defineQuery}.
   */
  WithoutProperties<T extends Schema>(
    table: BaseTable<T>,
    properties: Partial<Properties<T>>,
  ): WithoutPropertiesQueryFragment<T> {
    return { type: QueryFragmentType.WithoutProperties, table, properties };
  },

  /**
   * Create a {@link ProxyReadQueryFragment}.
   *
   * @remarks
   * The {@link ProxyReadQueryFragment} activates the "proxy read mode" for the rest of the query.
   * This means that for all remaining fragments in the query not only the $records themselves are checked, but also
   * their "ancestors" up to the given `depth` on the relationship chain defined by the given `table`.
   *
   * @example
   * Query for all $records that have a `Position` and are (directly or indirectly) owned by a $record with `Name` "Alice".
   * ```
   * runQuery([With(Position), ProxyRead(OwnedByEntity, Number.MAX_SAFE_INTEGER), WithProperties(Name, { name: "Alice" })]);
   * ```
   *
   * @param table BaseTable this query fragment refers to.
   * @param depth Max depth in the relationship chain to traverse.
   * @returns query fragment to be used in {@link queries.runQuery} or {@link queries.defineQuery}.
   */
  ProxyRead(table: BaseTable<{ properties: Type.$Record }>, depth: number): ProxyReadQueryFragment {
    return { type: QueryFragmentType.ProxyRead, table, depth };
  },

  /**
   * Create a {@link ProxyExpandQueryFragment}.
   *
   * @remarks
   * The {@link ProxyExpandQueryFragment} activates the "proxy expand mode" for the rest of the query.
   * This means that for all remaining fragments in the query not only the matching $records themselves are included in the intermediate set,
   * but also all their "children" down to the given `depth` on the relationship chain defined by the given `table`.
   *
   * @example
   * Query for all $records (directly or indirectly) owned by a $record with `Name` "Alice".
   * ```
   * runQuery([ProxyExpand(OwnedByEntity, Number.MAX_SAFE_INTEGER), WithProperties(Name, { name: "Alice" })]);
   * ```
   *
   * @param table BaseTable to apply this query fragment to.
   * @param depth Max depth in the relationship chain to traverse.
   * @returns query fragment to be used in {@link queries.runQuery} or {@link queries.defineQuery}.
   */
  ProxyExpand(table: BaseTable<{ properties: Type.$Record }>, depth: number): ProxyExpandQueryFragment {
    return { type: QueryFragmentType.ProxyExpand, table, depth };
  },

  /**
   * Helper function to check whether a given $record passes a given query fragment.
   *
   * @param $record $Record to check.
   * @param fragment Query fragment to check.
   * @returns True if the $record passes the query fragment, else false.
   */
  passesQueryFragment<T extends Schema>($record: $Record, fragment: $RecordQueryFragment<T>): boolean {
    if (fragment.type === QueryFragmentType.With) {
      // $Record must have the given table
      return tableOperations.has$Record(fragment.table, $record);
    }

    if (fragment.type === QueryFragmentType.WithProperties) {
      // $Record must have the given table properties
      return tableOperations.$recordPropertiesEqual(
        fragment.properties,
        tableOperations.get$RecordProperties(fragment.table, $record),
      );
    }

    if (fragment.type === QueryFragmentType.Without) {
      // $Record must not have the given table
      return !tableOperations.has$Record(fragment.table, $record);
    }

    if (fragment.type === QueryFragmentType.WithoutProperties) {
      // $Record must not have the given table properties
      return !tableOperations.$recordPropertiesEqual(
        fragment.properties,
        tableOperations.get$RecordProperties(fragment.table, $record),
      );
    }

    throw new Error("Unknown query fragment");
  },

  /**
   * Helper function to check whether a query fragment is "positive" (ie `With` or `WithProperties`)
   *
   * @param fragment Query fragment to check.
   * @returns True if the query fragment is positive, else false.
   */
  isPositiveFragment<T extends Schema>(
    fragment: QueryFragment<T>,
  ): fragment is WithQueryFragment<T> | WithPropertiesQueryFragment<T> {
    return fragment.type === QueryFragmentType.With || fragment.type == QueryFragmentType.WithProperties;
  },

  /**
   * Helper function to check whether a query fragment is "negative" (ie `Without` or `WithoutProperties`)
   *
   * @param fragment Query fragment to check.
   * @returns True if the query fragment is negative, else false.
   */
  isNegativeFragment<T extends Schema>(
    fragment: QueryFragment<T>,
  ): fragment is WithoutQueryFragment<T> | WithoutPropertiesQueryFragment<T> {
    return fragment.type === QueryFragmentType.Without || fragment.type == QueryFragmentType.WithoutProperties;
  },

  /**
   * Helper function to check whether a query fragment is a setting fragment (ie `ProxyExpand` or `ProxyRead`)
   *
   * @param fragment Query fragment to check.
   * @returns True if the query fragment is a setting fragment, else false.
   */
  isSettingFragment<T extends Schema>(fragment: QueryFragment<T>): fragment is SettingQueryFragment {
    return fragment.type === QueryFragmentType.ProxyExpand || fragment.type == QueryFragmentType.ProxyRead;
  },

  /**
   * Helper function to check whether the result of a query pass check is a breaking state.
   *
   * @remarks
   * For positive fragments (With/WithProperties) we need to find any passing $record up the proxy chain
   * so as soon as passes is true, we can early return. For negative fragments (Without/WithoutProperties) every $record
   * up the proxy chain must pass, so we can early return if we find one that doesn't pass.
   *
   * @param passes Boolean result of previous query pass check.
   * @param fragment Fragment that was used in the query pass check.
   * @returns True if the result is breaking pass state, else false.
   */
  isBreakingPassState(passes: boolean, fragment: $RecordQueryFragment<Schema>) {
    return (passes && this.isPositiveFragment(fragment)) || (!passes && this.isNegativeFragment(fragment));
  },

  /**
   * Helper function to check whether a $record passes a query fragment when taking into account a {@link ProxyReadQueryFragment}.
   *
   * @param $record {@link $Record} of the $record to check.
   * @param fragment Query fragment to check.
   * @param proxyRead {@link ProxyReadQueryFragment} to take into account.
   * @returns True if the $record passes the query fragment, else false.
   */
  passesQueryFragmentProxy<T extends Schema>(
    $record: $Record,
    fragment: $RecordQueryFragment<T>,
    proxyRead: ProxyReadQueryFragment,
  ): boolean | null {
    let proxyEntity = $record;
    let passes = false;
    for (let i = 0; i < proxyRead.depth; i++) {
      const properties = tableOperations.get$RecordProperties(proxyRead.table, proxyEntity);
      // If the current $record does not have the proxy table, abort
      if (!properties) return null;

      const $record = properties.properties;
      if (!$record) return null;

      // Move up the proxy chain
      proxyEntity = $record;
      passes = this.passesQueryFragment(proxyEntity, fragment);

      if (this.isBreakingPassState(passes, fragment)) {
        return passes;
      }
    }
    return passes;
  },

  /**
   * Recursively compute all direct and indirect child $records up to the specified depth
   * down the relationship chain defined by the given table.
   *
   * @param $record $Record to get all child $records for up to the specified depth
   * @param table BaseTable to use for the relationship chain.
   * @param depth Depth up to which the recursion should be applied.
   * @returns Set of $records that are child $records of the given $record via the given table.
   */
  getChild$Records($record: $Record, table: BaseTable<{ properties: Type.$Record }>, depth: number): Set<$Record> {
    if (depth === 0) return new Set();

    const directChildEntities = tableOperations.get$RecordsWithProperties(table, { properties: $record });
    if (depth === 1) return directChildEntities;

    const indirectChildEntities = [...directChildEntities]
      .map((child$Record) => [...this.getChild$Records(child$Record, table, depth - 1)])
      .flat();

    return new Set([...directChildEntities, ...indirectChildEntities]);
  },

  /**
   * Execute a list of query fragments to receive a Set of matching $records.
   *
   * @remarks
   * The query fragments are executed from left to right and are concatenated with a logical `AND`.
   * For performance reasons, the most restrictive query fragment should be first in the list of query fragments,
   * in order to reduce the number of $records the next query fragment needs to be checked for.
   * If no proxy fragments are used, every $record in the resulting set passes every query fragment.
   * If setting fragments are used, the order of the query fragments influences the result, since settings only apply to
   * fragments after the setting fragment.
   *
   * @param fragments Query fragments to execute.
   * @param initialSet Optional: provide a Set of $records to execute the query on. If none is given, all existing $records are used for the query.
   * @returns Set of $records matching the query fragments.
   */
  runQuery(fragments: QueryFragment[], initialSet?: Set<$Record>): Set<$Record> {
    let $records: Set<$Record> | undefined = initialSet ? new Set([...initialSet]) : undefined; // Copy to a fresh set because it will be modified in place
    let proxyRead: ProxyReadQueryFragment | undefined = undefined;
    let proxyExpand: ProxyExpandQueryFragment | undefined = undefined;

    // Process fragments
    for (let i = 0; i < fragments.length; i++) {
      const fragment = fragments[i];
      if (this.isSettingFragment(fragment)) {
        // Store setting fragments for subsequent query fragments
        if (fragment.type === QueryFragmentType.ProxyRead) proxyRead = fragment;
        if (fragment.type === QueryFragmentType.ProxyExpand) proxyExpand = fragment;
      } else if (!$records) {
        // Handle $record query fragments
        // First regular fragment must be With or WithProperties
        if (this.isNegativeFragment(fragment)) {
          throw new Error("First $RecordQueryFragment must be With or WithProperties");
        }

        // Create the first interim result
        $records =
          fragment.type === QueryFragmentType.With
            ? new Set([...tableOperations.getTable$Records(fragment.table)])
            : tableOperations.get$RecordsWithProperties(fragment.table, fragment.properties);

        // Add $record's children up to the specified depth if proxy expand is active
        if (proxyExpand && proxyExpand.depth > 0) {
          for (const $record of [...$records]) {
            for (const child$Record of this.getChild$Records($record, proxyExpand.table, proxyExpand.depth)) {
              $records.add(child$Record);
            }
          }
        }
      } else {
        // There already is an interim result, apply the current fragment
        for (const $record of [...$records]) {
          // Branch 1: Simple / check if the current $record passes the query fragment
          let passes = this.passesQueryFragment($record, fragment);

          // Branch 2: Proxy upwards / check if proxy $record passes the query
          if (proxyRead && proxyRead.depth > 0 && !this.isBreakingPassState(passes, fragment)) {
            passes = this.passesQueryFragmentProxy($record, fragment, proxyRead) ?? passes;
          }

          // If the $record didn't pass the query fragment, remove it from the interim set
          if (!passes) $records.delete($record);

          // Branch 3: Proxy downwards / run the query fragments on child $records if proxy expand is active
          if (proxyExpand && proxyExpand.depth > 0) {
            const child$Records = this.getChild$Records($record, proxyExpand.table, proxyExpand.depth);
            for (const child$Record of child$Records) {
              // Add the child $record if it passes the direct check
              // or if a proxy read is active and it passes the proxy read check
              if (
                this.passesQueryFragment(child$Record, fragment) ||
                (proxyRead && proxyRead.depth > 0 && this.passesQueryFragmentProxy(child$Record, fragment, proxyRead))
              )
                $records.add(child$Record);
            }
          }
        }
      }
    }

    return $records ?? new Set<$Record>();
  },

  /**
   * Create a query object including an update$ stream and a Set of $records currently matching the query.
   *
   * @remarks
   * `update$` stream needs to be subscribed to in order for the logic inside the stream to be executed and therefore
   * in order for the `matching` set to be updated.
   *
   * `defineQuery` should be strongly preferred over `runQuery` if the query is used for systems or other
   * use cases that repeatedly require the query result or updates to the query result. `defineQuery` does not
   * reevaluate the entire query if an accessed table changes, but only performs the minimal set of checks
   * on the updated $record to evaluate wether the $record still matches the query, resulting in significant performance
   * advantages over `runQuery`.
   *
   * The query fragments are executed from left to right and are concatenated with a logical `AND`.
   * For performance reasons, the most restrictive query fragment should be first in the list of query fragments,
   * in order to reduce the number of $records the next query fragment needs to be checked for.
   * If no proxy fragments are used, every $record in the resulting set passes every query fragment.
   * If setting fragments are used, the order of the query fragments influences the result, since settings only apply to
   * fragments after the setting fragment.
   *
   * @param fragments Query fragments to execute.
   * @param options Optional: {
   *   runOnInit: if true, the query is executed once with `runQuery` to build an iniital Set of matching $records. If false only updates after the query was created are considered.
   *   initialSet: if given, this set is passed to `runOnInit` when building the initial Set of matching $records.
   * }
   * @returns Query object: {
   *  update$: RxJS stream of updates to the query result. The update contains the table update that caused the query update, as well as the {@link UpdateType update type}.
   *  matching: Mobx observable set of $records currently matching the query.
   * }.
   */
  defineQuery(
    fragments: QueryFragment[],
    options?: { runOnInit?: boolean; initialSet?: Set<$Record> },
  ): {
    update$: Observable<TableUpdate>;
    matching: ObservableSet<$Record>;
  } {
    const initialSet =
      options?.runOnInit || options?.initialSet ? this.runQuery(fragments, options.initialSet) : new Set<$Record>();

    const matching = observable(initialSet);
    const initial$ = from(matching).pipe(tableOperations.toUpdateStream(fragments[0].table));

    const containsProxy =
      fragments.findIndex((v) => [QueryFragmentType.ProxyExpand, QueryFragmentType.ProxyRead].includes(v.type)) !== -1;

    const internal$ = merge(...fragments.map((f) => f.table.update$)) // Combine all table update streams accessed accessed in this query
      .pipe(
        containsProxy // Query contains proxies
          ? concatMap((update) => {
              // If the query contains proxy read or expand fragments, $records up or down the proxy chain might match due to this update.
              // We have to run the entire query again and compare the result.
              // TODO(MUD): We might be able to make this more efficient by first computing the set of $records that are potentially touched by this update
              // and then only rerun the query on this set.
              const newMatchingSet = this.runQuery(fragments, options?.initialSet);
              const updates: TableUpdate[] = [];

              for (const previouslyMatching$Record of matching) {
                // $Record matched before but doesn't match now
                if (!newMatchingSet.has(previouslyMatching$Record)) {
                  matching.delete(previouslyMatching$Record);
                  updates.push({
                    $record: previouslyMatching$Record,
                    type: "exit",
                    table: update.table,
                    properties: { current: undefined, prev: undefined },
                  });
                }
              }

              for (const matchingEntity of newMatchingSet) {
                if (matching.has(matchingEntity)) {
                  // $Record matched before and still matches
                  updates.push({
                    $record: matchingEntity,
                    type: "change",
                    table: update.table,
                    properties: {
                      current: tableOperations.get$RecordProperties(update.table, matchingEntity),
                      prev: undefined,
                    },
                  });
                } else {
                  // $Record didn't match before but matches now
                  matching.add(matchingEntity);
                  updates.push({
                    $record: matchingEntity,
                    type: "enter",
                    table: update.table,
                    properties: {
                      current: tableOperations.get$RecordProperties(update.table, matchingEntity),
                      prev: undefined,
                    },
                  });
                }
              }

              return of(...updates);
            })
          : // Query does not contain proxies
            map((update) => {
              if (matching.has(update.$record)) {
                // If this $record matched the query before, check if it still matches it
                // Find fragments accessign this table (linear search is fine since the number fragments is likely small)
                const relevantFragments = fragments.filter((f) => f.table.id === update.table.id);
                const pass = relevantFragments.every((f) =>
                  this.passesQueryFragment(update.$record, f as $RecordQueryFragment),
                ); // We early return if the query contains proxies

                if (pass) {
                  // $Record passed before and still passes, forward update
                  return { ...update, type: "change" as const };
                } else {
                  // $Record passed before but not anymore, forward update and exit
                  matching.delete(update.$record);
                  return { ...update, type: "exit" as const };
                }
              }

              // This $record didn't match before, check all fragments
              const pass = fragments.every((f) => this.passesQueryFragment(update.$record, f as $RecordQueryFragment)); // We early return if the query contains proxies
              if (pass) {
                // $Record didn't pass before but passes now, forward update end enter
                matching.add(update.$record);
                return { ...update, type: "enter" as const };
              }
            }),
        filterNullish(),
      );

    return {
      matching,
      update$: concat(initial$, internal$).pipe(share()),
    };
  },

  /**
   * Define a query object that only passes update events of type {@link UpdateType `change`} to the `update$` stream.
   * See {@link queries.defineQuery} for details.
   *
   * @param fragments Query fragments
   * @returns Stream of table updates of $records that had already matched the query
   */
  defineUpdateQuery(fragments: QueryFragment[], options?: { runOnInit?: boolean }): Observable<TableUpdate> {
    return this.defineQuery(fragments, options).update$.pipe(filter((e) => e.type === "change"));
  },

  /**
   * Define a query object that only passes update events of type {@link UpdateType `enter`} to the `update$` stream.
   * See {@link queries.defineQuery} for details.
   *
   * @param fragments Query fragments
   * @returns Stream of table updates of $records matching the query for the first time
   */
  defineEnterQuery(fragments: QueryFragment[], options?: { runOnInit?: boolean }): Observable<TableUpdate> {
    return this.defineQuery(fragments, options).update$.pipe(filter((e) => e.type === "enter"));
  },

  /**
   * Define a query object that only passes update events of type {@link UpdateType `exit`} to the `update$` stream.
   * See {@link queries.defineQuery} for details.
   *
   * @param fragments Query fragments
   * @returns Stream of table updates of $records not matching the query anymore for the first time
   */
  defineExitQuery(fragments: QueryFragment[], options?: { runOnInit?: boolean }): Observable<TableUpdate> {
    return this.defineQuery(fragments, options).update$.pipe(filter((e) => e.type === "exit"));
  },

  /**
   * Returns all matching $records for a given $record query,
   * and triggers a re-render as new query results come in.
   *
   * @param fragments Query fragments to match against, executed from left to right.
   * @param options.updateOnValueChange False - re-renders only on $record array changes. True (default) - also on table properties changes.
   * @returns Set of $records matching the query fragments.
   */
  use$RecordQuery(fragments: QueryFragment[], options?: { updateOnValueChange?: boolean }) {
    const updateOnValueChange = options?.updateOnValueChange ?? true;

    const stableFragments = useDeepMemo(fragments);
    const query = useMemo(() => this.defineQuery(stableFragments, { runOnInit: true }), [stableFragments]);
    const [entities, setEntities] = useState([...query.matching]);

    useEffect(() => {
      setEntities([...query.matching]);
      let observable = query.update$.pipe(map(() => [...query.matching]));
      if (!updateOnValueChange) {
        // re-render only on entity array changes
        observable = observable.pipe(distinctUntilChanged((a, b) => isEqual(a, b)));
      }
      const subscription = observable.subscribe((entities) => setEntities(entities));
      return () => subscription.unsubscribe();
    }, [query, updateOnValueChange]);

    return entities;
  },
};
