import { hexToResource, spliceHex } from "@latticexyz/common";
import { StoreEventsAbiItem, StoreEventsAbi } from "@latticexyz/store";
import { UnionPick } from "@latticexyz/common/type-utils";
import { Hex, Log, size } from "viem";
import { Write } from "@primodiumxyz/sync-stack";

import { TinyBaseAdapter } from "@/adapter";
import { debug, hexKeyTupleToEntity, getValueSchema, TinyBaseStore } from "@/lib";

type StoreEventsLog = Log<bigint, number, false, StoreEventsAbiItem, true, StoreEventsAbi>;
export type StorageAdapterLog = Partial<StoreEventsLog> & UnionPick<StoreEventsLog, "address" | "eventName" | "args">;

export type CustomWriter = ReturnType<typeof createCustomWriter>;

// in order to store it in the table, at component creation
export const createCustomWriter = ({ store }: { store: TinyBaseStore }) => {
  const processLog = (log: StorageAdapterLog) => {
    const { namespace, name } = hexToResource(log.args.tableId);
    const entity = hexKeyTupleToEntity(log.args.keyTuple);

    // Check if there are any values registered for this component
    const exists = store.hasTable(`table__${log.args.tableId}`);
    if (!exists) {
      debug(`unknown component: ${log.args.tableId} (${namespace}:${name})`);
      return;
    }

    // Get the required entries for decoding
    const table = {
      id: log.args.tableId,
      namespace,
      name,
      // We stored the value schema for each contract component on creation for convenient access
      valueSchema: getValueSchema(store, log.args.tableId),
    };

    return { entity, table };
  };

  return Write.toCustom({
    /* ----------------------------------- SET ---------------------------------- */
    set: (log) => {
      const values = processLog(log);

      if (!values) return;
      const { entity, table } = values;

      const value = TinyBaseAdapter.decodeArgs(table.valueSchema, log.args);

      debug("setting component", {
        namespace: table.namespace,
        name: table.name,
        entity,
        value,
      });

      store.setRow(table.id, entity, {
        ...value,
        __staticData: log.args.staticData,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: log.args.dynamicData,
        __lastSyncedAtBlock: log.blockNumber?.toString() ?? "unknown",
      });
    },
    /* --------------------------------- STATIC --------------------------------- */
    updateStatic: (log) => {
      const values = processLog(log);
      if (!values) return;
      const { entity, table } = values;

      const previousValue = store.getRow(table.id, entity);
      const previousStaticData = (previousValue?.__staticData as Hex) ?? "0x";
      const newStaticData = spliceHex(previousStaticData, log.args.start, size(log.args.data), log.args.data);
      const newValue = TinyBaseAdapter.decodeArgs(table.valueSchema, {
        staticData: newStaticData,
        encodedLengths: (previousValue?.__encodedLengths as Hex) ?? "0x",
        dynamicData: (previousValue?.__dynamicData as Hex) ?? "0x",
      });

      debug("setting component via splice static", {
        namespace: table.namespace,
        name: table.name,
        entity,
        previousStaticData,
        newStaticData,
        previousValue,
        newValue,
      });

      store.setRow(table.id, entity, {
        // We need to pass previous values to keep the encodedLengths and dynamicData (if any)
        // and be consistent with RECS
        ...previousValue,
        ...newValue,
        __staticData: newStaticData,
        __lastSyncedAtBlock: log.blockNumber?.toString() ?? "unknown",
      });
    },
    /* --------------------------------- DYNAMIC -------------------------------- */
    updateDynamic: (log) => {
      const values = processLog(log);
      if (!values) return;
      const { entity, table } = values;

      const previousValue = store.getRow(table.id, entity);
      const previousDynamicData = (previousValue?.__dynamicData as Hex) ?? "0x";
      const newDynamicData = spliceHex(previousDynamicData, log.args.start, log.args.deleteCount, log.args.data);
      const newValue = TinyBaseAdapter.decodeArgs(table.valueSchema, {
        staticData: (previousValue?.__staticData as Hex) ?? "0x",
        encodedLengths: log.args.encodedLengths,
        dynamicData: newDynamicData,
      });

      debug("setting component via splice dynamic", {
        namespace: table.namespace,
        name: table.name,
        entity,
        previousDynamicData,
        newDynamicData,
        previousValue,
        newValue,
      });

      store.setRow(table.id, entity, {
        ...newValue,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: newDynamicData,
        __lastSyncedAtBlock: log.blockNumber?.toString() ?? "unknown",
      });
    },
    /* --------------------------------- DELETE --------------------------------- */
    delete: (log) => {
      const values = processLog(log);
      if (!values) return;
      const { entity, table } = values;

      debug("deleting component", {
        namespace: table.namespace,
        name: table.name,
        entity,
      });

      store.delRow(table.id, entity);
    },
  });
};
