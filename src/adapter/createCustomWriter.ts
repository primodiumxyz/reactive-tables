import { hexToResource, spliceHex } from "@latticexyz/common";
import { StorageAdapterLog } from "@latticexyz/store-sync";
import { hexKeyTupleToEntity } from "@latticexyz/store-sync/recs";
import { Write } from "@primodiumxyz/sync-stack";
import { Hex, size } from "viem";
import { Store } from "tinybase/store";

import { TinyBaseAdapter } from "@/adapter";
import { getComponentTable } from "@/store/utils";
import { debug } from "@/utils";

export type CustomWriter = ReturnType<typeof createCustomWriter>;

// in order to store it in the table, at component creation
export const createCustomWriter = ({ store }: { store: Store }) => {
  const processLog = (log: StorageAdapterLog) => {
    const { namespace, name } = hexToResource(log.args.tableId);
    const entity = hexKeyTupleToEntity(log.args.keyTuple);

    // TODO: We could grab the row for this entity directly, but we then we wouldn't be able to check
    // its exisence; is the tradeoff worth it?
    const component = store.getTable(log.args.tableId);
    const table = getComponentTable(store, log.args.tableId);

    if (!component) {
      debug(`unknown component: ${log.args.tableId} (${namespace}:${name})`);
      return;
    }

    if (!table) {
      debug(`skipping update for unknown table: ${namespace}:${name} at ${log.address}`);
      return;
    }

    return {
      entity,
      component,
      table: { ...table, namespace },
    };
  };

  return Write.toCustom({
    /* ----------------------------------- SET ---------------------------------- */
    set: (log) => {
      const values = processLog(log);

      if (!values) return;
      const { entity, table } = values;

      const value = TinyBaseAdapter.decodeArgs(table.metadata.valueSchema, log.args);

      debug("setting component", {
        namespace: table.namespace,
        name: table.metadata.tableName,
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
      const { entity, component, table } = values;

      const previousValue = component[entity];
      const previousStaticData = (previousValue?.__staticData as Hex) ?? "0x";
      const newStaticData = spliceHex(previousStaticData, log.args.start, size(log.args.data), log.args.data);
      const newValue = TinyBaseAdapter.decodeArgs(table.metadata.valueSchema, {
        staticData: newStaticData,
        encodedLengths: (previousValue?.__encodedLengths as Hex) ?? "0x",
        dynamicData: (previousValue?.__dynamicData as Hex) ?? "0x",
      });

      debug("setting component via splice static", {
        namespace: table.namespace,
        name: table.metadata.tableName,
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
      const { entity, component, table } = values;

      const previousValue = component[entity];
      const previousDynamicData = (previousValue?.__dynamicData as Hex) ?? "0x";
      const newDynamicData = spliceHex(previousDynamicData, log.args.start, log.args.deleteCount, log.args.data);
      const newValue = TinyBaseAdapter.decodeArgs(table.metadata.valueSchema, {
        staticData: (previousValue?.__staticData as Hex) ?? "0x",
        encodedLengths: log.args.encodedLengths,
        dynamicData: newDynamicData,
      });

      debug("setting component via splice dynamic", {
        namespace: table.namespace,
        name: table.metadata.tableName,
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
        name: table.metadata.tableName,
        entity,
      });

      store.delRow(table.id, entity);
    },
  });
};
