import { Entity, Schema } from "@latticexyz/recs";

import { useEffect, useState } from "react";

import {
  CreateQueryWrapperOptions,
  createQueryWrapper,
  queryAllWithValue,
  queryAllWithoutValue,
  useAllWithValue,
  useAllWithoutValue,
} from "@/queries";
import { createContractComponentMethods } from "@/components/contract/createContractComponentMethods";
import { TinyBaseAdapter, TinyBaseFormattedType } from "@/adapter";
import { arrayToIterator, createComponentMethodsUtils } from "@/components/contract/utils";
import { singletonEntity } from "@/utils";
import { CreateComponentMethodsOptions, CreateComponentMethodsResult } from "@/types";
import { ComponentValue, ComponentValueSansMetadata, Table } from "@/components/contract/types";

export const createComponentMethods = <
  table extends Table,
  VS extends Schema,
  KS extends Schema = Schema,
  T = unknown,
>({
  store,
  queries,
  table,
  tableId,
}: CreateComponentMethodsOptions<table>): CreateComponentMethodsResult<VS, KS, T> => {
  const { paused } = createComponentMethodsUtils(store, tableId);

  // Native RECS entities iterator
  const entities = () => arrayToIterator(store.getRowIds(tableId));

  /* --------------------------------- STREAMS -------------------------------- */
  // Pause updates for an entity (don't react to changes in the store)
  const pauseUpdates = (entity?: Entity, value?: ComponentValueSansMetadata<VS, T>) => {
    entity = entity ?? singletonEntity;

    paused.set(entity, true);
    if (value) set(value, entity);
  };

  // Enable updates for an entity (react to changes in the store, e.g. useValue)
  const resumeUpdates = (entity?: Entity) => {
    entity = entity ?? singletonEntity;

    if (!paused.get(entity)) return;
    paused.set(entity, false);
  };

  /* ----------------------------------- SET ---------------------------------- */
  const set = (value: ComponentValueSansMetadata<VS, T> | ComponentValue<VS, T>, entity?: Entity) => {
    entity = entity ?? singletonEntity;

    // Encode the value and set it in the store
    const valueFormatted = TinyBaseAdapter.format(Object.keys(value), Object.values(value));
    store.setRow(tableId, entity, valueFormatted);
  };

  // Utility function to save on computation when we want to set the formatted data directly
  const setRaw = (value: TinyBaseFormattedType, entity: Entity) => {
    entity = entity ?? singletonEntity;
    store.setRow(tableId, entity, value);
  };

  /* ----------------------------------- GET ---------------------------------- */
  function get(): ComponentValue<VS, T> | undefined;
  function get(entity: Entity | undefined): ComponentValue<VS, T> | undefined;
  function get(entity?: Entity | undefined, defaultValue?: ComponentValueSansMetadata<VS, T>): ComponentValue<VS, T>;
  function get(entity?: Entity, defaultValue?: ComponentValueSansMetadata<VS, T>) {
    entity = entity ?? singletonEntity;
    const row = store.getRow(tableId, entity);

    const decoded = Object.entries(row).length > 0 ? TinyBaseAdapter.parse(row) : undefined; // empty object should be undefined
    return (decoded ?? defaultValue) as ComponentValue<VS, T>;
  }
  // Utility function to save on computation when we're only interested in the raw data (to set again directly)
  const getRaw = (entity: Entity) => {
    const row = store.getRow(tableId, entity);
    return Object.entries(row).length > 0 ? row : undefined;
  };

  /* --------------------------------- QUERIES -------------------------------- */
  const getAll = () => {
    return store.getRowIds(tableId) as Entity[];
  };

  const getAllWith = (value: Partial<ComponentValue<VS, T>>) => {
    return queryAllWithValue({ queries, tableId, value }).entities;
  };

  const getAllWithout = (value: Partial<ComponentValue<VS, T>>) => {
    return queryAllWithoutValue({ queries, tableId, value }).entities;
  };

  /* ---------------------------------- HOOKS --------------------------------- */
  function useAll() {
    const [entities, setEntities] = useState<Entity[]>(getAll());

    useEffect(() => {
      // Whenever an entity is added or removed (row ids changed), update the state
      const subId = store.addRowIdsListener(tableId, () => {
        setEntities(getAll());
      });

      return () => {
        store.delListener(subId);
      };
    }, []);

    return entities;
  }

  const useAllWith = (value: Partial<ComponentValue<VS, T>>) => {
    return useAllWithValue(queries, tableId, value);
  };

  const useAllWithout = (value: Partial<ComponentValue<VS, T>>) => {
    return useAllWithoutValue(queries, tableId, value);
  };

  /* ---------------------------------- CLEAR --------------------------------- */
  const clear = () => {
    getAll().forEach((entity) => remove(entity));
  };

  /* --------------------------------- REMOVE --------------------------------- */
  const remove = (entity?: Entity) => {
    entity = entity ?? singletonEntity;
    store.delRow(tableId, entity);
  };

  /* --------------------------------- UPDATE --------------------------------- */
  const update = (value: Partial<ComponentValue<VS, T>>, entity?: Entity) => {
    entity = entity ?? singletonEntity;
    const currentValue = getRaw(entity);
    if (!currentValue) throw new Error(`Entity ${entity} does not exist in table ${tableId}`);

    const newValue = TinyBaseAdapter.format(Object.keys(value), Object.values(value));
    setRaw({ ...currentValue, ...newValue }, entity);
  };

  /* ----------------------------------- HAS ---------------------------------- */
  const has = (entity?: Entity) => {
    if (!entity) return false;
    return store.hasRow(tableId, entity);
  };

  /* -------------------------------- USE VALUE ------------------------------- */
  function useValue(entity?: Entity | undefined): ComponentValue<VS, T> | undefined;
  function useValue(
    entity: Entity | undefined,
    defaultValue?: ComponentValueSansMetadata<VS, T>,
  ): ComponentValue<VS, T>;
  function useValue(entity?: Entity, defaultValue?: ComponentValueSansMetadata<VS, T>) {
    entity = entity ?? singletonEntity;
    const [value, setValue] = useState(get(entity));

    useEffect(() => {
      // entity changed, update state to latest value
      // (just make sure this one is not paused)
      if (!paused.get(entity)) {
        setValue(get(entity));
      }

      // Update state when the value for this entity changes
      const valueSubId = store.addRowListener(tableId, entity, () => {
        // only if it's not paused
        if (!paused.get(entity)) {
          setValue(get(entity));
        }
      });

      // Update state when updates are unpaused
      const pausedSubId = store.addValueListener(`paused__${tableId}__${entity}`, (_, __, newPaused) => {
        // Meaning updates are being resumed
        if (!newPaused) {
          setValue(get(entity));
        }
      });

      return () => {
        store.delListener(valueSubId);
        store.delListener(pausedSubId);
      };
    }, [entity, paused]);

    return value ?? defaultValue;
  }

  /* --------------------------------- SYSTEM --------------------------------- */
  // Create a query tied to this component, with callbacks on change, enter & exit from the query conditions
  const createQuery = (options: Omit<CreateQueryWrapperOptions<VS, T>, "queries" | "tableId" | "schema">) => {
    // Add a `select` on top of the query to abstract selecting at least a cell from the value => selecting all entities
    // This is required with TinyQL to at least select a cell so it considers all rows
    const query: CreateQueryWrapperOptions<VS, T>["query"] = options.query
      ? (keywords) => {
          keywords.select(Object.keys(table.schema)[0]);
          options.query!(keywords);
        }
      : undefined;

    return createQueryWrapper({
      queries,
      tableId,
      schema: table.schema as VS,
      ...options,
      query,
    });
  };

  const baseMethods = {
    entities,
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
    createQuery,
  };

  // Add hooks only if not in a node environment
  const hookMethods = { useAll, useAllWith, useAllWithout, use: useValue };
  if (typeof window === "undefined") {
    Object.keys(hookMethods).forEach((key) => {
      // @ts-expect-error undefined is not expected here, but we're doing that until we separate core/react libs
      hookMethods[key as keyof typeof hookMethods] = () => {
        console.warn(`${key} is only available in the browser`);
        return undefined;
      };
    });
  }

  const methods = {
    ...baseMethods,
    ...hookMethods,
  };
  // If it's an internal component, no need for contract methods
  if (table.namespace === "internal" || !("keySchema" in table)) return methods;

  return {
    ...methods,
    ...createContractComponentMethods({ ...methods, keySchema: table.keySchema }),
  };
};