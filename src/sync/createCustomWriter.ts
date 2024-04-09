import { Store as StoreConfig } from "@latticexyz/store";
import { hexToResource, spliceHex } from "@latticexyz/common";
import { Schema, getEntitySymbol } from "@latticexyz/recs";
import { StorageAdapterLog } from "@latticexyz/store-sync";
import { hexKeyTupleToEntity } from "@latticexyz/store-sync/recs";
import { decodeValueArgs } from "@latticexyz/protocol-parser/internal";
import { Write } from "@primodiumxyz/sync-stack";
import { ValueSchema } from "@latticexyz/store/internal";
import { Hex, size } from "viem";
import { Store } from "tinybase/store";

import { flattenSchema } from "@/store/formatters/flattenSchema";
import { debug } from "@/utils";
import { BaseComponent } from "@/store/component/types";

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
      // TODO: we need to cast ValueSchema from @latticexyz/protocol-parser to @latticexyz/store...
      table: { ...table, namespace, valueSchema: table.valueSchema as unknown as ValueSchema },
    };
  };

  return Write.toCustom({
    set: (log) => {
      const values = processLog(log);

      if (!values) return;
      const { entity, table } = values;

      const value = decodeValueArgs(flattenSchema(table.valueSchema), log.args);

      debug("setting component", {
        namespace: table.namespace,
        name: table.metadata.tableName,
        entity,
        value,
      });

      // TODO: handle non-primitive types
      store.setRow(table.metadata.id, getEntitySymbol(entity), {
        ...value,
        __staticData: log.args.staticData,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: log.args.dynamicData,
      });
    },
    updateStatic: (log) => {
      const values = processLog(log);
      if (!values) return;
      const { entity, component, table } = values;

      const previousValue = component[getEntitySymbol(entity)];
      const previousStaticData = (previousValue?.__staticData as Hex) ?? "0x";
      const newStaticData = spliceHex(previousStaticData, log.args.start, size(log.args.data), log.args.data);
      const newValue = decodeValueArgs(flattenSchema(table.valueSchema), {
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

      // TODO: handle non-primitive types
      store.setRow(table.metadata.id, getEntitySymbol(entity), {
        ...newValue,
        __staticData: newStaticData,
        __encodedLengths: previousValue?.__encodedLengths,
        __dynamicData: previousValue?.__dynamicData,
      });
    },
    updateDynamic: (log) => {
      // TODO: here it's missing dynamicFieldIndex; should be ok to cast
      const values = processLog(log as StorageAdapterLog);
      if (!values) return;
      const { entity, component, table } = values;

      const previousValue = component[getEntitySymbol(entity)];
      const previousDynamicData = (previousValue?.__dynamicData as Hex) ?? "0x";
      const newDynamicData = spliceHex(previousDynamicData, log.args.start, log.args.deleteCount, log.args.data);
      const newValue = decodeValueArgs(flattenSchema(table.valueSchema), {
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

      // TODO: handle non-primitive types
      store.setRow(table.metadata.id, getEntitySymbol(entity), {
        ...newValue,
        __staticData: previousValue?.__staticData,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: newDynamicData,
      });
    },
    delete: (log) => {
      const values = processLog(log);
      if (!values) return;
      const { entity, component, table } = values;

      debug("deleting component", {
        namespace: table.namespace,
        name: table.metadata.tableName,
        entity,
      });

      store.delRow(table.metadata.id, getEntitySymbol(entity));
    },
  });
};
