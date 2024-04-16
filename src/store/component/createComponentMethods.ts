import { Entity, Metadata, OptionalTypes, Schema, getEntityString } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { Table } from "@latticexyz/store/internal";
import { createQueries } from "tinybase";

import { useEffect, useState } from "react";

import { queryAllWithValue, queryAllWithoutValue, useAllWithValue, useAllWithoutValue } from "@/store/queries";
import { TinyBaseAdapter, TinyBaseFormattedType } from "@/adapter";
import { arrayToIterator, createComponentMethodsUtils } from "./utils";
import { CreateComponentMethodsOptions, CreateComponentMethodsResult } from "@/types";
import { Component, ComponentValue, ComponentValueSansMetadata } from "@/store/component/types";
import { InternalComponent, InternalTable } from "@/store/internal/types";

export type ComponentUpdate<S extends Schema = Schema, T = unknown> = {
  entity: Entity;
  value: {
    current: ComponentValue<S, T> | ComponentValueSansMetadata<S, T> | undefined;
    prev: ComponentValue<S, T> | ComponentValueSansMetadata<S, T> | undefined;
  };
  // component:
  // | Component<table extends Table ? table : Table, config, S, Metadata, T>
  // | InternalComponent<table extends InternalTable ? table : InternalTable, S, Metadata, T>;
  tableId: string; // TODO: ask Hank if we need the component or if it's just to identify (then tableId should be enough)
};

export const createComponentMethods = <
  table extends Table | InternalTable,
  config extends StoreConfig,
  S extends Schema,
  T = unknown,
>({
  store,
  table,
  tableId,
}: CreateComponentMethodsOptions<table>): CreateComponentMethodsResult<S, T> => {
  const { paused } = createComponentMethodsUtils(store, tableId);
  const queries = createQueries(store);

  // Native RECS entities iterator
  const entities = () => arrayToIterator(store.getRowIds(tableId));

  /* --------------------------------- STREAMS -------------------------------- */
  // Pause updates for an entity (don't react to changes in the store)
  const pauseUpdates = (entity?: Entity, value?: ComponentValueSansMetadata<S, T>) => {
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
  const set = (value: ComponentValueSansMetadata<S, T>, entity?: Entity) => {
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
  function get(): ComponentValue<S, T> | undefined;
  function get(entity: Entity | undefined): ComponentValue<S, T> | undefined;
  function get(entity?: Entity | undefined, defaultValue?: ComponentValueSansMetadata<S>): ComponentValue<S, T>;
  function get(entity?: Entity, defaultValue?: ComponentValueSansMetadata<S>) {
    entity = entity ?? singletonEntity;
    const row = store.getRow(tableId, entity);

    const decoded = Object.entries(row).length > 0 ? TinyBaseAdapter.parse(row) : undefined; // empty object should be undefined
    return (decoded ?? defaultValue) as ComponentValue<S, T>;
  }
  // Utility function to save on computation when we're only interested in the raw data (to set again directly)
  const getRaw = (entity: Entity) => {
    const row = store.getRow(tableId, entity);
    return Object.entries(row).length > 0 ? row : undefined;
  };

  /* --------------------------------- QUERIES -------------------------------- */
  const getAll = () => {
    return store.getRowIds(tableId);
  };

  const getAllWith = (value: Partial<ComponentValue<S>>) => {
    return queryAllWithValue(queries, tableId, value);
  };

  const getAllWithout = (value: Partial<ComponentValue<S>>) => {
    return queryAllWithoutValue(queries, tableId, value);
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

  const useAllWith = (value: Partial<ComponentValue<S>>) => {
    return useAllWithValue(queries, tableId, value);
  };

  const useAllWithout = (value: Partial<ComponentValue<S>>) => {
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
  const update = (value: Partial<ComponentValue<S, T>>, entity?: Entity) => {
    entity = entity ?? singletonEntity;
    const currentValue = getRaw(entity);

    const newValue = TinyBaseAdapter.format(Object.keys(value), Object.values(value));
    setRaw({ ...currentValue, ...newValue }, entity);
  };

  /* ----------------------------------- HAS ---------------------------------- */
  const has = (entity?: Entity) => {
    if (!entity) return false;
    return store.hasRow(tableId, entity);
  };

  /* -------------------------------- USE VALUE ------------------------------- */
  function useValue(entity?: Entity | undefined): ComponentValue<S> | undefined;
  function useValue(entity: Entity | undefined, defaultValue?: ComponentValueSansMetadata<S>): ComponentValue<S>;
  function useValue(entity?: Entity, defaultValue?: ComponentValueSansMetadata<S>) {
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

  return {
    entities,
    get,
    set,
    getAll,
    getAllWith,
    getAllWithout,
    useAll,
    useAllWith,
    useAllWithout,
    remove,
    clear,
    update,
    has,
    use: useValue,
    pauseUpdates,
    resumeUpdates,
  };
};
