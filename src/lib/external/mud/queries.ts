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
  pipe,
  share,
  type OperatorFunction,
} from "rxjs";
import { observable, ObservableSet } from "mobx";
import isEqual from "fast-deep-equal";
import { useEffect, useMemo, useState } from "react";

import type { BaseTable, TableUpdate } from "@/tables/types";
import type { Entity } from "@/lib/external/mud/entity";
import { type Properties, type Schema, Type } from "@/lib/external/mud/schema";
import { tableOperations } from "@/lib/external/mud/tables";
const {
  hasEntity,
  getEntityProperties,
  entityPropertiesEqual,
  entityPropertiesWhere,
  getTableEntities,
  getEntitiesWithProperties,
  getEntitiesWhere,
  toUpdateStream,
} = tableOperations;

// All of the following code is taken and modified from MUD to fit new types and naming conventions.

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

export enum QueryFragmentType {
  With,
  WithProperties,
  Without,
  WithoutProperties,
  MatchingProperties,
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

export type MatchingPropertiesQueryFragment<T extends Schema> = {
  type: QueryFragmentType.MatchingProperties;
  table: BaseTable<T>;
  where: (properties: Properties<T>) => boolean;
};

export type ProxyReadQueryFragment = {
  type: QueryFragmentType.ProxyRead;
  table: BaseTable<{ properties: Type.Entity }>;
  depth: number;
};

export type ProxyExpandQueryFragment = {
  type: QueryFragmentType.ProxyExpand;
  table: BaseTable<{ properties: Type.Entity }>;
  depth: number;
};

export type QueryFragment<T extends Schema = Schema> =
  | WithQueryFragment<T>
  | WithPropertiesQueryFragment<T>
  | WithoutQueryFragment<T>
  | WithoutPropertiesQueryFragment<T>
  | MatchingPropertiesQueryFragment<T>
  | ProxyReadQueryFragment
  | ProxyExpandQueryFragment;

export type EntityQueryFragment<T extends Schema = Schema> =
  | WithQueryFragment<T>
  | WithPropertiesQueryFragment<T>
  | WithoutQueryFragment<T>
  | WithoutPropertiesQueryFragment<T>
  | MatchingPropertiesQueryFragment<T>;

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

export function useDeepMemo<T>(currentProperties: T): T {
  const [stableProperties, setStableProperties] = useState(currentProperties);

  useEffect(() => {
    if (!isEqual(currentProperties, stableProperties)) {
      setStableProperties(currentProperties);
    }
  }, [currentProperties]);

  return stableProperties;
}

const _queries = () => {
  /**
   * Create a {@link WithQueryFragment}.
   *
   * @remarks
   * The {@link WithQueryFragment} filters for entities that have the given table,
   * independent from the table properties.
   *
   * @example
   * Query for all entities with a `Position`.
   * ```
   * runQuery([With(Position)]);
   * ```
   *
   * @param table BaseTable this query fragment refers to.
   * @returns query fragment to be used in {@link runQuery} or {@link defineQuery}.
   */
  const With = <T extends Schema>(table: BaseTable<T>): WithQueryFragment<T> => {
    return { type: QueryFragmentType.With, table };
  };

  /**
   * Create a {@link WithoutQueryFragment}.
   *
   * @remarks
   * The {@link WithoutQueryFragment} filters for entities that don't have the given table,
   * independent from the table properties.
   *
   * @example
   * Query for all entities with a `Position` that are not `Movable`.
   * ```
   * runQuery([With(Position), Without(Movable)]);
   * ```
   *
   * @param table BaseTable this query fragment refers to.
   * @returns query fragment to be used in {@link runQuery} or {@link defineQuery}.
   */
  const Without = <T extends Schema>(table: BaseTable<T>): WithoutQueryFragment<T> => {
    return { type: QueryFragmentType.Without, table };
  };

  /**
   * Create a {@link WithPropertiesQueryFragment}.
   *
   * @remarks
   * The {@link WithPropertiesQueryFragment} filters for entities that have the given table
   * with the given table properties.
   *
   * @example
   * Query for all entities at Position (0,0).
   * ```
   * runQuery([WithProperties(Position, { x: 0, y: 0 })]);
   * ```
   *
   * @param table BaseTable this query fragment refers to.
   * @param properties Only include entities with this (partial) table properties from the result.
   * @returns query fragment to be used in {@link runQuery} or {@link defineQuery}.
   */
  const WithProperties = <T extends Schema>(
    table: BaseTable<T>,
    properties: Partial<Properties<T>>,
  ): WithPropertiesQueryFragment<T> => {
    return { type: QueryFragmentType.WithProperties, table, properties };
  };

  /**
   * Create a {@link WithoutPropertiesQueryFragment}.
   *
   * @remarks
   * The {@link WithoutPropertiesQueryFragment} filters for entities that don't have the given table
   * with the given table properties.
   *
   * @example
   * Query for all entities that have a `Position`, except for those at `Position` (0,0).
   * ```
   * runQuery([With(Position), WithoutProperties(Position, { x: 0, y: 0 })]);
   * ```
   *
   * @param table BaseTable this query fragment refers to.
   * @param properties Exclude entities with this (partial) table properties from the result.
   * @returns query fragment to be used in {@link runQuery} or {@link defineQuery}.
   */
  const WithoutProperties = <T extends Schema>(
    table: BaseTable<T>,
    properties: Partial<Properties<T>>,
  ): WithoutPropertiesQueryFragment<T> => {
    return { type: QueryFragmentType.WithoutProperties, table, properties };
  };

  /**
   * Create a {@link MatchingPropertiesQueryFragment}
   *
   * @example
   * Query for all entities with a `Position` where `x` is greater than `y`.
   *
   * ```
   * runQuery([MatchingProperties(Position, (properties) => properties.x > properties.y)]);
   * ```
   *
   * @param table BaseTable this query fragment refers to.
   * @param where A function that passes the properties to check for more complex conditions.
   * @returns query fragment to be used in {@link runQuery} or {@link defineQuery}.
   */
  const MatchingProperties = <T extends Schema>(
    table: BaseTable<T>,
    where: (properties: Properties<T>) => boolean,
  ): MatchingPropertiesQueryFragment<T> => {
    return { type: QueryFragmentType.MatchingProperties, table, where };
  };

  /**
   * Create a {@link ProxyReadQueryFragment}.
   *
   * @remarks
   * The {@link ProxyReadQueryFragment} activates the "proxy read mode" for the rest of the query.
   * This means that for all remaining fragments in the query not only the entities themselves are checked, but also
   * their "ancestors" up to the given `depth` on the relationship chain defined by the given `table`.
   *
   * @example
   * Query for all entities that have a `Position` and are (directly or indirectly) owned by an entity with `Name` "Alice".
   * ```
   * runQuery([With(Position), ProxyRead(OwnedByEntity, Number.MAX_SAFE_INTEGER), WithProperties(Name, { name: "Alice" })]);
   * ```
   *
   * @param table BaseTable this query fragment refers to.
   * @param depth Max depth in the relationship chain to traverse.
   * @returns query fragment to be used in {@link runQuery} or {@link defineQuery}.
   */
  const ProxyRead = (table: BaseTable<{ properties: Type.Entity }>, depth: number): ProxyReadQueryFragment => {
    return { type: QueryFragmentType.ProxyRead, table, depth };
  };

  /**
   * Create a {@link ProxyExpandQueryFragment}.
   *
   * @remarks
   * The {@link ProxyExpandQueryFragment} activates the "proxy expand mode" for the rest of the query.
   * This means that for all remaining fragments in the query not only the matching entities themselves are included in the intermediate set,
   * but also all their "children" down to the given `depth` on the relationship chain defined by the given `table`.
   *
   * @example
   * Query for all entities (directly or indirectly) owned by an entity with `Name` "Alice".
   * ```
   * runQuery([ProxyExpand(OwnedByEntity, Number.MAX_SAFE_INTEGER), WithProperties(Name, { name: "Alice" })]);
   * ```
   *
   * @param table BaseTable to apply this query fragment to.
   * @param depth Max depth in the relationship chain to traverse.
   * @returns query fragment to be used in {@link runQuery} or {@link defineQuery}.
   */
  const ProxyExpand = (table: BaseTable<{ properties: Type.Entity }>, depth: number): ProxyExpandQueryFragment => {
    return { type: QueryFragmentType.ProxyExpand, table, depth };
  };

  /**
   * Helper function to check whether a given entity passes a given query fragment.
   *
   * @param entity Entity to check.
   * @param fragment Query fragment to check.
   * @returns True if the entity passes the query fragment, else false.
   */
  const passesQueryFragment = <T extends Schema>(entity: Entity, fragment: EntityQueryFragment<T>): boolean => {
    if (fragment.type === QueryFragmentType.With) {
      // Entity must have the given table
      return hasEntity(fragment.table, entity);
    }

    if (fragment.type === QueryFragmentType.WithProperties) {
      // Entity must have the given table properties
      return entityPropertiesEqual(fragment.properties, getEntityProperties(fragment.table, entity));
    }

    if (fragment.type === QueryFragmentType.Without) {
      // Entity must not have the given table
      return !hasEntity(fragment.table, entity);
    }

    if (fragment.type === QueryFragmentType.WithoutProperties) {
      // Entity must not have the given table properties
      return !entityPropertiesEqual(fragment.properties, getEntityProperties(fragment.table, entity));
    }

    if (fragment.type === QueryFragmentType.MatchingProperties) {
      // Entity must match the given properties condition
      return entityPropertiesWhere(fragment.table, entity, fragment.where);
    }

    throw new Error("Unknown query fragment");
  };

  /**
   * Helper function to check whether a query fragment is "positive" (ie `With` or `WithProperties`)
   *
   * @param fragment Query fragment to check.
   * @returns True if the query fragment is positive, else false.
   */
  const isPositiveFragment = <T extends Schema>(
    fragment: QueryFragment<T>,
  ): fragment is WithQueryFragment<T> | WithPropertiesQueryFragment<T> => {
    return (
      fragment.type === QueryFragmentType.With ||
      fragment.type == QueryFragmentType.WithProperties ||
      fragment.type == QueryFragmentType.MatchingProperties
    );
  };

  /**
   * Helper function to check whether a query fragment is "negative" (ie `Without` or `WithoutProperties`)
   *
   * @param fragment Query fragment to check.
   * @returns True if the query fragment is negative, else false.
   */
  const isNegativeFragment = <T extends Schema>(
    fragment: QueryFragment<T>,
  ): fragment is WithoutQueryFragment<T> | WithoutPropertiesQueryFragment<T> => {
    return fragment.type === QueryFragmentType.Without || fragment.type == QueryFragmentType.WithoutProperties;
  };

  /**
   * Helper function to check whether a query fragment is a setting fragment (ie `ProxyExpand` or `ProxyRead`)
   *
   * @param fragment Query fragment to check.
   * @returns True if the query fragment is a setting fragment, else false.
   */
  const isSettingFragment = <T extends Schema>(fragment: QueryFragment<T>): fragment is SettingQueryFragment => {
    return fragment.type === QueryFragmentType.ProxyExpand || fragment.type == QueryFragmentType.ProxyRead;
  };

  /**
   * Helper function to check whether the result of a query pass check is a breaking state.
   *
   * @remarks
   * For positive fragments (With/WithProperties) we need to find any passing entity up the proxy chain
   * so as soon as passes is true, we can early return. For negative fragments (Without/WithoutProperties) every entity
   * up the proxy chain must pass, so we can early return if we find one that doesn't pass.
   *
   * @param passes Boolean result of previous query pass check.
   * @param fragment Fragment that was used in the query pass check.
   * @returns True if the result is breaking pass state, else false.
   */
  const isBreakingPassState = <T extends Schema>(passes: boolean, fragment: EntityQueryFragment<T>) => {
    return (passes && isPositiveFragment(fragment)) || (!passes && isNegativeFragment(fragment));
  };

  /**
   * Helper function to check whether an entity passes a query fragment when taking into account a {@link ProxyReadQueryFragment}.
   *
   * @param entity {@link Entity} of the entity to check.
   * @param fragment Query fragment to check.
   * @param proxyRead {@link ProxyReadQueryFragment} to take into account.
   * @returns True if the entity passes the query fragment, else false.
   */
  const passesQueryFragmentProxy = <T extends Schema>(
    entity: Entity,
    fragment: EntityQueryFragment<T>,
    proxyRead: ProxyReadQueryFragment,
  ): boolean | null => {
    let proxyEntity = entity;
    let passes = false;
    for (let i = 0; i < proxyRead.depth; i++) {
      const properties = getEntityProperties(proxyRead.table, proxyEntity);
      // If the current entity does not have the proxy table, abort
      if (!properties) return null;

      const entity = properties.properties;
      if (!entity) return null;

      // Move up the proxy chain
      proxyEntity = entity;
      passes = passesQueryFragment(proxyEntity, fragment);

      if (isBreakingPassState(passes, fragment)) {
        return passes;
      }
    }
    return passes;
  };

  /**
   * Recursively compute all direct and indirect child entities up to the specified depth
   * down the relationship chain defined by the given table.
   *
   * @param entity Entity to get all child entities for up to the specified depth
   * @param table BaseTable to use for the relationship chain.
   * @param depth Depth up to which the recursion should be applied.
   * @returns Set of entities that are child entities of the given entity via the given table.
   */
  const getChildEntities = (
    entity: Entity,
    table: BaseTable<{ properties: Type.Entity }>,
    depth: number,
  ): Set<Entity> => {
    if (depth === 0) return new Set();

    const directChildEntities = getEntitiesWithProperties(table, { properties: entity });
    if (depth === 1) return directChildEntities;

    const indirectChildEntities = [...directChildEntities]
      .map((childEntity) => [...getChildEntities(childEntity, table, depth - 1)])
      .flat();

    return new Set([...directChildEntities, ...indirectChildEntities]);
  };

  /**
   * Execute a list of query fragments to receive a Set of matching entities.
   *
   * @remarks
   * The query fragments are executed from left to right and are concatenated with a logical `AND`.
   * For performance reasons, the most restrictive query fragment should be first in the list of query fragments,
   * in order to reduce the number of entities the next query fragment needs to be checked for.
   * If no proxy fragments are used, every entity in the resulting set passes every query fragment.
   * If setting fragments are used, the order of the query fragments influences the result, since settings only apply to
   * fragments after the setting fragment.
   *
   * @param fragments Query fragments to execute.
   * @param initialSet Optional: provide a Set of entities to execute the query on. If none is given, all existing entities are used for the query.
   * @returns Set of entities matching the query fragments.
   */
  const runQuery = (fragments: QueryFragment[], initialSet?: Set<Entity>): Set<Entity> => {
    let entities: Set<Entity> | undefined = initialSet ? new Set([...initialSet]) : undefined; // Copy to a fresh set because it will be modified in place
    let proxyRead: ProxyReadQueryFragment | undefined = undefined;
    let proxyExpand: ProxyExpandQueryFragment | undefined = undefined;

    // Process fragments
    for (let i = 0; i < fragments.length; i++) {
      const fragment = fragments[i];
      if (isSettingFragment(fragment)) {
        // Store setting fragments for subsequent query fragments
        if (fragment.type === QueryFragmentType.ProxyRead) proxyRead = fragment;
        if (fragment.type === QueryFragmentType.ProxyExpand) proxyExpand = fragment;
      } else if (!entities) {
        // Handle entity query fragments
        // First regular fragment must be With or WithProperties
        if (isNegativeFragment(fragment)) {
          throw new Error("First EntityQueryFragment must be With or WithProperties");
        }

        // Create the first interim result
        entities =
          fragment.type === QueryFragmentType.With
            ? new Set([...getTableEntities(fragment.table)])
            : fragment.type === QueryFragmentType.WithProperties
              ? getEntitiesWithProperties(fragment.table, fragment.properties)
              : // technically this can be the only fragment in the query, and this would consider _only_ entities
                // that are inside the table implicitly
                // so this is forbidden (without any With/WithProperties) at the API level
                getEntitiesWhere(fragment.table, fragment.where);

        // Add entity's children up to the specified depth if proxy expand is active
        if (proxyExpand && proxyExpand.depth > 0) {
          for (const entity of [...entities]) {
            for (const childEntity of getChildEntities(entity, proxyExpand.table, proxyExpand.depth)) {
              entities.add(childEntity);
            }
          }
        }
      } else {
        // There already is an interim result, apply the current fragment
        for (const entity of [...entities]) {
          // Branch 1: Simple / check if the current entity passes the query fragment
          let passes = passesQueryFragment(entity, fragment);

          // Branch 2: Proxy upwards / check if proxy entity passes the query
          if (proxyRead && proxyRead.depth > 0 && !isBreakingPassState(passes, fragment)) {
            passes = passesQueryFragmentProxy(entity, fragment, proxyRead) ?? passes;
          }

          // If the entity didn't pass the query fragment, remove it from the interim set
          if (!passes) entities.delete(entity);

          // Branch 3: Proxy downwards / run the query fragments on child entities if proxy expand is active
          if (proxyExpand && proxyExpand.depth > 0) {
            const childEntities = getChildEntities(entity, proxyExpand.table, proxyExpand.depth);
            for (const childEntity of childEntities) {
              // Add the child entity if it passes the direct check
              // or if a proxy read is active and it passes the proxy read check
              if (
                passesQueryFragment(childEntity, fragment) ||
                (proxyRead && proxyRead.depth > 0 && passesQueryFragmentProxy(childEntity, fragment, proxyRead))
              )
                entities.add(childEntity);
            }
          }
        }
      }
    }

    return entities ?? new Set<Entity>();
  };

  /**
   * Create a query object including an update$ stream and a Set of entities currently matching the query.
   *
   * @remarks
   * `update$` stream needs to be subscribed to in order for the logic inside the stream to be executed and therefore
   * in order for the `matching` set to be updated.
   *
   * `defineQuery` should be strongly preferred over `runQuery` if the query is used for systems or other
   * use cases that repeatedly require the query result or updates to the query result. `defineQuery` does not
   * reevaluate the entire query if an accessed table changes, but only performs the minimal set of checks
   * on the updated entity to evaluate wether the entity still matches the query, resulting in significant performance
   * advantages over `runQuery`.
   *
   * The query fragments are executed from left to right and are concatenated with a logical `AND`.
   * For performance reasons, the most restrictive query fragment should be first in the list of query fragments,
   * in order to reduce the number of entities the next query fragment needs to be checked for.
   * If no proxy fragments are used, every entity in the resulting set passes every query fragment.
   * If setting fragments are used, the order of the query fragments influences the result, since settings only apply to
   * fragments after the setting fragment.
   *
   * @param fragments Query fragments to execute.
   * @param options Optional: {
   *   runOnInit: if true, the query is executed once with `runQuery` to build an iniital Set of matching entities. If false only updates after the query was created are considered.
   *   initialSet: if given, this set is passed to `runOnInit` when building the initial Set of matching entities.
   * }
   * @returns Query object: {
   *  update$: RxJS stream of updates to the query result. The update contains the table update that caused the query update, as well as the {@link UpdateType update type}.
   *  matching: Mobx observable set of entities currently matching the query.
   * }.
   */
  const defineQuery = (
    fragments: QueryFragment[],
    options?: { runOnInit?: boolean; initialSet?: Set<Entity> },
  ): {
    update$: Observable<TableUpdate>;
    matching: ObservableSet<Entity>;
  } => {
    const initialSet =
      options?.runOnInit || options?.initialSet ? runQuery(fragments, options.initialSet) : new Set<Entity>();

    const matching = observable(initialSet);
    const initial$ = from(matching).pipe(toUpdateStream(fragments[0].table));

    const containsProxy =
      fragments.findIndex((v) => [QueryFragmentType.ProxyExpand, QueryFragmentType.ProxyRead].includes(v.type)) !== -1;

    const internal$ = merge(...fragments.map((f) => f.table.update$)) // Combine all table update streams accessed accessed in this query
      .pipe(
        containsProxy // Query contains proxies
          ? concatMap((update) => {
              // If the query contains proxy read or expand fragments, entities up or down the proxy chain might match due to this update.
              // We have to run the entire query again and compare the result.
              // TODO(MUD): We might be able to make this more efficient by first computing the set of entities that are potentially touched by this update
              // and then only rerun the query on this set.
              const newMatchingSet = runQuery(fragments, options?.initialSet);
              const updates: TableUpdate[] = [];

              for (const previouslyMatchingEntity of matching) {
                // Entity matched before but doesn't match now
                if (!newMatchingSet.has(previouslyMatchingEntity)) {
                  matching.delete(previouslyMatchingEntity);
                  updates.push({
                    entity: previouslyMatchingEntity,
                    type: "exit",
                    table: update.table,
                    properties: { current: undefined, prev: undefined },
                  });
                }
              }

              for (const matchingEntity of newMatchingSet) {
                if (matching.has(matchingEntity)) {
                  // Entity matched before and still matches
                  updates.push({
                    entity: matchingEntity,
                    type: "update",
                    table: update.table,
                    properties: {
                      current: getEntityProperties(update.table, matchingEntity),
                      prev: undefined,
                    },
                  });
                } else {
                  // Entity didn't match before but matches now
                  matching.add(matchingEntity);
                  updates.push({
                    entity: matchingEntity,
                    type: "enter",
                    table: update.table,
                    properties: {
                      current: getEntityProperties(update.table, matchingEntity),
                      prev: undefined,
                    },
                  });
                }
              }

              return of(...updates);
            })
          : // Query does not contain proxies
            map((update) => {
              if (matching.has(update.entity)) {
                // If this entity matched the query before, check if it still matches it
                // Find fragments accessign this table (linear search is fine since the number fragments is likely small)
                const relevantFragments = fragments.filter((f) => f.table.id === update.table.id);
                const pass = relevantFragments.every((f) =>
                  passesQueryFragment(update.entity, f as EntityQueryFragment),
                ); // We early return if the query contains proxies

                if (pass) {
                  // Entity passed before and still passes, forward update
                  return { ...update, type: "update" as const };
                } else {
                  // Entity passed before but not anymore, forward update and exit
                  matching.delete(update.entity);
                  return { ...update, type: "exit" as const };
                }
              }

              // This entity didn't match before, check all fragments
              const pass = fragments.every((f) => passesQueryFragment(update.entity, f as EntityQueryFragment)); // We early return if the query contains proxies
              if (pass) {
                // Entity didn't pass before but passes now, forward update end enter
                matching.add(update.entity);
                return { ...update, type: "enter" as const };
              }
            }),
        filterNullish(),
      );

    return {
      matching,
      update$: concat(initial$, internal$).pipe(share()),
    };
  };

  /**
   * Define a query object that only passes update events of type {@link UpdateType `change`} to the `update$` stream.
   * See {@link defineQuery} for details.
   *
   * @param fragments Query fragments
   * @returns Stream of table updates of entities that had already matched the query
   */
  const defineChangeQuery = (
    fragments: QueryFragment[],
    options?: { runOnInit?: boolean },
  ): Observable<TableUpdate> => {
    return defineQuery(fragments, options).update$.pipe(filter((e) => e.type === "update"));
  };

  /**
   * Define a query object that only passes update events of type {@link UpdateType `enter`} to the `update$` stream.
   * See {@link defineQuery} for details.
   *
   * @param fragments Query fragments
   * @returns Stream of table updates of entities matching the query for the first time
   */
  const defineEnterQuery = (fragments: QueryFragment[], options?: { runOnInit?: boolean }): Observable<TableUpdate> => {
    return defineQuery(fragments, options).update$.pipe(filter((e) => e.type === "enter"));
  };

  /**
   * Define a query object that only passes update events of type {@link UpdateType `exit`} to the `update$` stream.
   * See {@link defineQuery} for details.
   *
   * @param fragments Query fragments
   * @returns Stream of table updates of entities not matching the query anymore for the first time
   */
  const defineExitQuery = (fragments: QueryFragment[], options?: { runOnInit?: boolean }): Observable<TableUpdate> => {
    return defineQuery(fragments, options).update$.pipe(filter((e) => e.type === "exit"));
  };

  /**
   * Returns all matching entities for a given entity query,
   * and triggers a re-render as new query results come in.
   *
   * @param fragments Query fragments to match against, executed from left to right.
   * @param options.updateOnValueChange False - re-renders only on entity array changes. True (default) - also on table properties changes.
   * @returns Set of entities matching the query fragments.
   */
  const useEntityQuery = (fragments: QueryFragment[], options?: { updateOnValueChange?: boolean }) => {
    const updateOnValueChange = options?.updateOnValueChange ?? true;

    const stableFragments = useDeepMemo(fragments);
    const query = useMemo(() => defineQuery(stableFragments, { runOnInit: true }), [stableFragments]);
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
  };

  return {
    With,
    WithProperties,
    Without,
    WithoutProperties,
    MatchingProperties,
    ProxyRead,
    ProxyExpand,
    runQuery,
    defineQuery,
    defineChangeQuery,
    defineEnterQuery,
    defineExitQuery,
    useEntityQuery,
  };
};

export const queries = _queries();
