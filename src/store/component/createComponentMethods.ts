import { Entity, Metadata, OptionalTypes, Schema, getEntityString } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { Table } from "@latticexyz/store/internal";
import { createQueries } from "tinybase";

import { useEffect, useState } from "react";

import { arrayToIterator, createComponentMethodsUtils } from "./utils";
import { TinyBaseAdapter } from "@/adapter";
import { CreateComponentMethodsOptions, CreateComponentMethodsResult } from "@/types";
import { Component, ComponentValue, ComponentValueSansMetadata } from "@/store/component/types";
import { InternalComponent, InternalTable } from "@/store/internal/types";
import { TinyBaseFormattedType } from "@/adapter/formatValueForTinyBase";
import { queryAllWithValue, queryAllWithoutValue } from "./queries";

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
  const { paused, pendingUpdate } = createComponentMethodsUtils(store, tableId);
  const queries = createQueries(store);

  // TODO: register an entity?

  // Native RECS entities iterator
  const entities = () => arrayToIterator(store.getRowIds(tableId));

  /* --------------------------------- STREAMS -------------------------------- */
  // Add a new override to some entity
  const pauseUpdates = (entity?: Entity, value?: ComponentValueSansMetadata<S, T>) => {
    entity = entity ?? singletonEntity;
    if (entity === undefined) throw new Error(`[pauseUpdates ${entity} for ${tableId}] no entity registered`);

    paused.set(entity, true);
    if (value) set(value, entity);
  };

  // Remove an override from an entity
  const resumeUpdates = (entity?: Entity) => {
    entity = entity ?? singletonEntity;
    if (entity === undefined) throw new Error(`[resumeUpdates ${entity} for ${tableId}] no entity registered`);

    if (!paused.get(entity)) return;
    paused.set(entity, false);
  };

  /* ----------------------------------- SET ---------------------------------- */
  const set = (value: ComponentValueSansMetadata<S, T>, entity?: Entity) => {
    entity = entity ?? singletonEntity;
    if (entity === undefined) throw new Error(`[set ${entity} for ${tableId}] no entity registered`);

    // Encode the value and set it in the store
    const valueFormatted = TinyBaseAdapter.format(Object.keys(value), Object.values(value));
    store.setRow(tableId, entity, valueFormatted);
  };

  // Utility function to save on computation when we want to set the formatted data directly
  const setRaw = (value: TinyBaseFormattedType, entity: Entity) => {
    entity = entity ?? singletonEntity;
    if (entity === undefined) throw new Error(`[set ${entity} for ${tableId}] no entity registered`);

    store.setRow(tableId, entity, value);
  };

  /* ----------------------------------- GET ---------------------------------- */
  function get(): ComponentValue<S, T> | undefined;
  function get(entity: Entity | undefined): ComponentValue<S, T> | undefined;
  function get(entity?: Entity | undefined, defaultValue?: ComponentValueSansMetadata<S>): ComponentValue<S, T>;
  function get(entity?: Entity, defaultValue?: ComponentValueSansMetadata<S>) {
    entity = entity ?? singletonEntity;
    if (entity === undefined) return defaultValue;

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

  // function useAll() {
  //   const entitites = useEntityQuery([Has(component)]);
  //   return [...entitites];
  // }

  const getAllWith = (value: Partial<ComponentValue<S>>) => {
    return queryAllWithValue(queries, tableId, value);
  };

  // const useAllWith = (value: Partial<ComponentValue<S>>) => {
  //   const entities = useEntityQuery([HasValue(component, value)]);
  //   return [...entities];
  // }

  const getAllWithout = (value: Partial<ComponentValue<S>>) => {
    return queryAllWithoutValue(queries, tableId, value);
  };

  // const useAllWithout = (value: Partial<ComponentValue<S>>) => {
  //   const entities = useEntityQuery([NotValue(component, value)]);
  //   return [...entities];
  // }

  /* ---------------------------------- CLEAR --------------------------------- */
  // const clear = () => {
  //   const entities = runQuery([Has(component)]);
  //   entities.forEach((entity) => removeComponent(component, entity));
  // }

  /* --------------------------------- REMOVE --------------------------------- */
  const remove = (entity?: Entity) => {
    entity = entity ?? singletonEntity;
    if (entity === undefined) return;

    store.delRow(tableId, entity);
  };

  /* --------------------------------- UPDATE --------------------------------- */
  const update = (value: Partial<ComponentValue<S, T>>, entity?: Entity) => {
    entity = entity ?? singletonEntity;
    if (entity === undefined) throw new Error(`[update ${entity} for ${tableId}] no entity registered`);

    const currentValue = getRaw(entity);
    const newValue = TinyBaseAdapter.format(Object.keys(value), Object.values(value));
    setRaw({ ...currentValue, ...newValue }, entity);
  };

  /* ----------------------------------- HAS ---------------------------------- */
  // const has = (entity?: Entity) => {
  //   if (entity == undefined) return false;
  //   return hasComponent(component, entity);
  // }

  /* -------------------------------- USE VALUE ------------------------------- */
  function useValue(entity?: Entity | undefined): ComponentValue<S> | undefined;
  function useValue(entity: Entity | undefined, defaultValue?: ComponentValueSansMetadata<S>): ComponentValue<S>;
  function useValue(entity?: Entity, defaultValue?: ComponentValueSansMetadata<S>) {
    entity = entity ?? singletonEntity;
    const [value, setValue] = useState(!!entity ? get(entity) : undefined);

    useEffect(() => {
      // entity changed, update state to latest value
      setValue(!!entity ? get(entity) : undefined);
      if (!entity) return;

      // Update state when the value for this entity changes
      const valueSubId = store.addRowListener(tableId, entity, () => {
        // only if it's not paused
        if (!paused.get(entity)) {
          setValue(get(entity));
        }
      });

      // Update state when updates are unpaused
      const pausedSubId = store.addValueListener(`paused__${tableId}__${entity}`, (_, __, paused) => {
        // Meaning updates are being resumed
        if (!paused) {
          setValue(get(entity));
        }
      });

      return () => {
        store.delListener(valueSubId);
        store.delListener(pausedSubId);
      };
    }, [entity]);

    return value ?? defaultValue;
  }

  return {
    entities,
    get,
    set,
    getAll,
    getAllWith,
    getAllWithout,
    // useAll,
    // useAllWith,
    // useAllWithout,
    remove,
    // clear,
    update,
    // has,
    use: useValue,
    pauseUpdates,
    resumeUpdates,
  };
};
