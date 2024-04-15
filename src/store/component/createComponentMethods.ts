import { Entity, Metadata, OptionalTypes, Schema } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { Table } from "@latticexyz/store/internal";
import { Subject } from "rxjs";

import { createComponentMethodsUtils } from "./utils";
import { TinyBaseAdapter } from "@/adapter";
import { CreateComponentMethodsOptions, CreateComponentMethodsResult } from "@/types";
import { Component, ComponentValue, ComponentValueSansMetadata } from "@/store/component/types";
import { InternalComponent, InternalTable } from "@/store/internal/types";
import { TinyBaseFormattedType } from "@/adapter/formatValueForTinyBase";

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

type ComponentMutationOptions = {
  skipUpdateStream?: boolean;
  bypassPausedCheck?: boolean;
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

  // TODO: register an entity?

  // TODO: entities iterator
  // const entities = () =>
  //   transformIterator((Object.values(values)[0] as Map<EntitySymbol, unknown>).keys(), getEntityString);

  /* --------------------------------- STREAMS -------------------------------- */
  // Original RECS component update stream
  // In primodium it seems to be overriden when returning extended component context
  // const _update$ = new Subject(); // TODO: do we need to keep this one?
  // Update event stream that takes into account overridden entity values
  const update$ = new Subject<ComponentUpdate<S, T>>();

  // Add a new override to some entity
  const pauseUpdates = (entity: Entity, value?: ComponentValueSansMetadata<S, T>, skipUpdateStream = false) => {
    paused.set(entity, true);
    if (value) set(value, entity, { skipUpdateStream, bypassPausedCheck: true });
  };

  // Remove an override from an entity
  const resumeUpdates = (entity: Entity, skipUpdateStream = false) => {
    if (!paused.get(entity)) return;
    paused.set(entity, false);

    const update = pendingUpdate.getRaw(entity);
    if (!update) return;

    if (update.prev) setRaw(update.prev, entity, { skipUpdateStream: true });
    if (update.current) setRaw(update.current, entity, { skipUpdateStream });
    else remove(entity);

    pendingUpdate.delete(entity);
  };

  // Channel through update events from the original component if there are no overrides
  // We shouldn't need this as we'll use our own update$, since we need to reimplement defineQuery, queries and hooks ourselves
  // update$
  //   .pipe(
  //     filter((e) => !paused.get(e.entity)),
  //     map((update) => ({ ...update, component }))
  //   )
  //   .subscribe(update$);

  // component.update$
  //   .pipe(
  //     filter((e) => !!paused.get(e.entity)),
  //     map((update) => {
  //       pendingUpdate.set(update.entity, update);
  //     })
  //   )
  //   .subscribe();

  /* ----------------------------------- SET ---------------------------------- */
  // bypassPaused for internal use, when originally calling setComponent (second part of if/else)
  const set = (value: ComponentValueSansMetadata<S, T>, entity?: Entity, options?: ComponentMutationOptions) => {
    const { skipUpdateStream, bypassPausedCheck } = options ?? { skipUpdateStream: false, bypassPausedCheck: false };

    entity = entity ?? singletonEntity;
    if (entity === undefined) throw new Error(`[set ${entity} for ${tableId}] no entity registered`);

    // Encode the value because we'll need it in both cases
    const valueFormatted = TinyBaseAdapter.format(Object.keys(value), Object.values(value));

    if (!bypassPausedCheck && paused.get(entity)) {
      const prevValue = pendingUpdate.getRaw(entity)?.current ?? getRaw(entity);
      pendingUpdate.setRaw(entity, valueFormatted, prevValue);
    } else {
      // No need to get the prev value if we're skipping the update stream
      const prevValue = skipUpdateStream ? undefined : get(entity);

      store.setRow(tableId, entity, valueFormatted);

      if (!skipUpdateStream) {
        // TODO: if bug we might be using the wrong update stream (has original been memoized in original RECS setComponent?
        // is it ok to ignore the original one? I'd guess so because we're also replacing hooks such as Has or useEntityQuery)
        update$.next({ entity, value: { current: value, prev: prevValue }, tableId });
      }
    }
  };

  // Utility function to save on computation when we want to set the formatted data directly
  const setRaw = (value: TinyBaseFormattedType, entity: Entity, options?: ComponentMutationOptions) => {
    const { skipUpdateStream } = options ?? { skipUpdateStream: false };
    entity = entity ?? singletonEntity;
    if (entity === undefined) throw new Error(`[set ${entity} for ${tableId}] no entity registered`);

    const prevValue = skipUpdateStream ? undefined : get(entity);
    store.setRow(tableId, entity, value);

    if (!skipUpdateStream) {
      const decoded = TinyBaseAdapter.parse(value) as ComponentValue<S, T> | ComponentValueSansMetadata<S, T>;
      update$.next({ entity, value: { current: decoded, prev: prevValue }, tableId });
    }
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

  return {
    update$,
    get,
    set,
    // getAll,
    // getAllWith,
    // getAllWithout,
    // useAll,
    // useAllWith,
    // useAllWithout,
    remove,
    // clear,
    update,
    // has,
    // use: useValue,
    pauseUpdates,
    resumeUpdates,
  };
};
