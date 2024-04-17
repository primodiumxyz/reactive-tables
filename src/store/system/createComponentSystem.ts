import { Store as StoreConfig } from "@latticexyz/store";
import { Metadata, Schema } from "@latticexyz/recs";

import { CreateComponentSystemOptions, CreateComponentSystemResult } from "./types";
import { ComponentValue, Table } from "@/store/component/types";
import { TinyBaseAdapter, TinyBaseFormattedType } from "@/adapter";

export const createComponentSystem = <
  table extends Table = Table,
  config extends StoreConfig = StoreConfig,
  S extends Schema = Schema,
  M extends Metadata = Metadata,
  T = unknown,
>({
  component,
  system,
  store,
  options = { runOnInit: true },
}: CreateComponentSystemOptions<table, config, S, M, T>): CreateComponentSystemResult => {
  const tableId = component.id;
  // TODO: is the first solution better?
  // Here we have two possible ways to implement the listener:
  // 1. Use a cell listener, so we can get the old + new values, and provide every information about the update
  // -> but when a value (row) is changed, it will actually be trigerred for every cell that has changed,
  //    which might be unintended because we want one ComponentUpdate "event" for the whole row
  // 2. Use a row listener, but then we need to find the cell change for every cells in the row
  // -> this is the chosed implementation; it will cost slightly more to get all cells, but won't react individually to each cell change
  const subId = store.addRowListener(tableId, null, (_, __, entity, getCellChange) => {
    let newValueRaw = store.getRow(tableId, entity) as TinyBaseFormattedType;
    let oldValueRaw = newValueRaw;

    // If we can get the change, populate the old and new value objects
    if (getCellChange) {
      for (const key of Object.keys(oldValueRaw)) {
        const [changed, oldCellValue] = getCellChange(tableId, entity, key);
        // If it's undefined, no need to go further as the value is tampered
        if (oldCellValue === undefined) {
          oldValueRaw = {};
          break;
        }
        if (changed) oldValueRaw[key] = oldCellValue;
      }
      // Otherwise, we just set the old value to undefined
    } else {
      oldValueRaw = {};
    }

    const oldValue =
      Object.keys(oldValueRaw).length > 0 ? (TinyBaseAdapter.parse(oldValueRaw) as ComponentValue<S, T>) : undefined;
    const newValue =
      Object.keys(newValueRaw).length > 0 ? (TinyBaseAdapter.parse(newValueRaw) as ComponentValue<S, T>) : undefined;

    // Trigger system
    system({
      tableId, // TODO: or do we want to pass the whole component? do we need it?
      entity,
      value: [newValue, oldValue],
    });
  });

  if (options?.runOnInit) {
    // Get all rows (meaning entity -> value entries)
    const rows = store.getTable(tableId);

    // Trigger system() for each entity with the current value
    Object.entries(rows).forEach(([entity, value]) => {
      system({
        tableId,
        entity,
        value: [TinyBaseAdapter.parse(value) as ComponentValue<S, T>, undefined],
      });
    });
  }

  return {
    unsubscribe: () => store.delListener(subId),
  };
};
