import { hexToResource, spliceHex } from "@latticexyz/common";
import { type Hex, size } from "viem";
import { Write } from "@primodiumxyz/sync-stack";

import { StorageAdapterLog, TinyBaseAdapter } from "@/adapter";
import { debug, hexKeyTupleTo$Record, getPropertiesSchema, TinyBaseStore } from "@/lib";

export const createCustomWriter = ({ store }: { store: TinyBaseStore }) => {
  const processLog = (log: StorageAdapterLog) => {
    const { namespace, name } = hexToResource(log.args.tableId);
    const $record = hexKeyTupleTo$Record(log.args.keyTuple);

    // Check if there are any properties registered for this table
    const exists = store.hasTable(`table__${log.args.tableId}`);
    if (!exists) {
      debug(`unknown table: ${log.args.tableId} (${namespace}:${name})`);
      return;
    }

    // Get the required entries for decoding
    const table = {
      id: log.args.tableId,
      namespace,
      name,
      // We stored the properties schema for each contract table on creation for convenient access
      propertiesSchema: getPropertiesSchema(store, log.args.tableId),
    };

    return { $record, table };
  };

  return Write.toCustom({
    /* ----------------------------------- SET ---------------------------------- */
    set: (log) => {
      const processed = processLog(log);

      if (!processed) return;
      const { $record, table } = processed;

      const properties = TinyBaseAdapter.decodeArgs(table.propertiesSchema, log.args);

      debug("setting properties", {
        namespace: table.namespace,
        name: table.name,
        $record,
        properties,
      });

      store.setRow(table.id, $record, {
        ...properties,
        __staticData: log.args.staticData,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: log.args.dynamicData,
        __lastSyncedAtBlock: log.blockNumber?.toString() ?? "unknown",
      });
    },
    /* --------------------------------- STATIC --------------------------------- */
    updateStatic: (log) => {
      const processed = processLog(log);
      if (!processed) return;
      const { $record, table } = processed;

      const previousProperties = store.getRow(table.id, $record);
      const previousStaticData = (previousProperties?.__staticData as Hex) ?? "0x";
      const newStaticData = spliceHex(previousStaticData, log.args.start, size(log.args.data), log.args.data);
      const newProperties = TinyBaseAdapter.decodeArgs(table.propertiesSchema, {
        staticData: newStaticData,
        encodedLengths: (previousProperties?.__encodedLengths as Hex) ?? "0x",
        dynamicData: (previousProperties?.__dynamicData as Hex) ?? "0x",
      });

      debug("setting properties via splice static", {
        namespace: table.namespace,
        name: table.name,
        $record,
        previousStaticData,
        newStaticData,
        previousProperties,
        newProperties,
      });

      store.setRow(table.id, $record, {
        // We need to pass previous properties to keep the encodedLengths and dynamicData (if any)
        // and be consistent with RECS
        ...previousProperties,
        ...newProperties,
        __staticData: newStaticData,
        __lastSyncedAtBlock: log.blockNumber?.toString() ?? "unknown",
      });
    },
    /* --------------------------------- DYNAMIC -------------------------------- */
    updateDynamic: (log) => {
      const processed = processLog(log);
      if (!processed) return;
      const { $record, table } = processed;

      const previousProperties = store.getRow(table.id, $record);
      const previousDynamicData = (previousProperties?.__dynamicData as Hex) ?? "0x";
      const newDynamicData = spliceHex(previousDynamicData, log.args.start, log.args.deleteCount, log.args.data);
      const newProperties = TinyBaseAdapter.decodeArgs(table.propertiesSchema, {
        staticData: (previousProperties?.__staticData as Hex) ?? "0x",
        encodedLengths: log.args.encodedLengths,
        dynamicData: newDynamicData,
      });

      debug("setting properties via splice dynamic", {
        namespace: table.namespace,
        name: table.name,
        $record,
        previousDynamicData,
        newDynamicData,
        previousProperties,
        newProperties,
      });

      store.setRow(table.id, $record, {
        ...newProperties,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: newDynamicData,
        __lastSyncedAtBlock: log.blockNumber?.toString() ?? "unknown",
      });
    },
    /* --------------------------------- DELETE --------------------------------- */
    delete: (log) => {
      const processed = processLog(log);
      if (!processed) return;
      const { $record, table } = processed;

      debug("deleting properties", {
        namespace: table.namespace,
        name: table.name,
        $record,
      });

      store.delRow(table.id, $record);
    },
  });
};
