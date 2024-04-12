import { Store as StoreConfig } from "@latticexyz/store";
import { hexToResource, spliceHex } from "@latticexyz/common";
import { Schema } from "@latticexyz/recs";
import { StorageAdapterLog } from "@latticexyz/store-sync";
import { hexKeyTupleToEntity } from "@latticexyz/store-sync/recs";
// import { Write } from "@primodiumxyz/sync-stack";
// TODO: TEMP IMPORT
import { Write } from "@/_indexer/packages/sync-stack/src";
import { Hex, size } from "viem";
import { Store } from "tinybase/store";

import { debug } from "@/utils";
import { BaseComponent } from "@/store/component/types";

// TODO: show notice on how we're not using flattenSchema because we flattened it already
// in order to store it in the table, at component creation
export const createCustomWriter = <config extends StoreConfig>({ store }: { store: Store }) => {
  const processLog = (log: StorageAdapterLog) => {
    const { namespace, name } = hexToResource(log.args.tableId);
    const entity = hexKeyTupleToEntity(log.args.keyTuple);

    // TODO: We could grab the row for this entity directly, but we then we wouldn't be able to check
    // its exisence; is the tradeoff worth it?
    const component = store.getTable(log.args.tableId);
    // Not strictly the table but the same content formatted for TinyBase
    const table = store.getTable(`table__${log.args.tableId}`) as BaseComponent<Schema, config>;

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
    set: (log) => {
      const values = processLog(log);

      if (!values) return;
      const { entity, table } = values;

      debug("setting component", {
        namespace: table.namespace,
        name: table.metadata.tableName,
        entity,
      });

      store.setRow(table.metadata.id, entity, {
        __staticData: log.args.staticData,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: log.args.dynamicData,
      });
    },
    updateStatic: (log) => {
      const values = processLog(log);
      if (!values) return;
      const { entity, component, table } = values;

      const previousValue = component[entity];
      const previousStaticData = (previousValue?.__staticData as Hex) ?? "0x";
      const newStaticData = spliceHex(previousStaticData, log.args.start, size(log.args.data), log.args.data);

      debug("setting component via splice static", {
        namespace: table.namespace,
        name: table.metadata.tableName,
        entity,
        previousStaticData,
        newStaticData,
        previousValue,
      });

      store.setRow(table.metadata.id, entity, {
        __staticData: newStaticData,
        __encodedLengths: previousValue?.__encodedLengths,
        __dynamicData: previousValue?.__dynamicData,
      });
    },
    updateDynamic: (log) => {
      const values = processLog(log);
      if (!values) return;
      const { entity, component, table } = values;

      const previousValue = component[entity];
      const previousDynamicData = (previousValue?.__dynamicData as Hex) ?? "0x";
      const newDynamicData = spliceHex(previousDynamicData, log.args.start, log.args.deleteCount, log.args.data);

      debug("setting component via splice dynamic", {
        namespace: table.namespace,
        name: table.metadata.tableName,
        entity,
        previousDynamicData,
        newDynamicData,
        previousValue,
      });

      store.setRow(table.metadata.id, entity, {
        __staticData: previousValue?.__staticData,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: newDynamicData,
      });
    },
    delete: (log) => {
      const values = processLog(log);
      if (!values) return;
      const { entity, table } = values;

      debug("deleting component", {
        namespace: table.namespace,
        name: table.metadata.tableName,
        entity,
      });

      store.delRow(table.metadata.id, entity);
    },
  });
};