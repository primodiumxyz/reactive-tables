import { decodeValueArgs } from "@latticexyz/protocol-parser";
import { hexToResource, spliceHex } from "@latticexyz/common";
import { getComponentValue, removeComponent, setComponent } from "@latticexyz/recs";
import { Hex, size } from "viem";

import { createWriter } from "./createWriter";
import { debug } from "../../utils/debug";
import { flattenSchema, hexKeyTupleToEntity } from "../../utils/recs";
import { StorageAdapterLog, WriterRecsParams } from "../../types";

export const recsWriter = ({ world, tables }: WriterRecsParams) => {
  function processLog(log: StorageAdapterLog) {
    const { namespace, name } = hexToResource(log.args.tableId);

    const component = world.components.find((c) => c.id === log.args.tableId);
    const tableKey = Object.keys(tables).find((c) => tables[c].tableId === log.args.tableId);
    const table = tableKey ? tables[tableKey] : undefined;

    if (!component) {
      debug(`unknown component: ${log.args.tableId} (${namespace}:${name})`);
      return;
    }

    if (!table) {
      debug(`skipping update for unknown table: ${namespace}:${name} at ${log.address}`);
      return;
    }

    const entity = hexKeyTupleToEntity(log.args.keyTuple);

    return { entity, component, table };
  }

  return createWriter({
    set(log) {
      const values = processLog(log);

      if (!values) return;
      const { entity, component, table } = values;

      const value = decodeValueArgs(flattenSchema(table.valueSchema), log.args);

      debug("setting component", {
        namespace: table.namespace,
        name: table.name,
        entity,
        value,
      });

      setComponent(component, entity, {
        ...value,
        __staticData: log.args.staticData,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: log.args.dynamicData,
      });
    },
    updateStatic(log) {
      const values = processLog(log);
      if (!values) return;
      const { entity, component, table } = values;

      const previousValue = getComponentValue(component, entity);
      const previousStaticData = (previousValue?.__staticData as Hex) ?? "0x";
      const newStaticData = spliceHex(previousStaticData, log.args.start, size(log.args.data), log.args.data);
      const newValue = decodeValueArgs(flattenSchema(table.valueSchema), {
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
      setComponent(component, entity, {
        ...newValue,
        __staticData: newStaticData,
      });
    },
    updateDynamic(log) {
      const values = processLog(log);
      if (!values) return;
      const { entity, component, table } = values;

      const previousValue = getComponentValue(component, entity);
      const previousDynamicData = (previousValue?.__dynamicData as Hex) ?? "0x";
      const newDynamicData = spliceHex(previousDynamicData, log.args.start, log.args.deleteCount, log.args.data);
      const newValue = decodeValueArgs(flattenSchema(table.valueSchema), {
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
      setComponent(component, entity, {
        ...newValue,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: newDynamicData,
      });
    },
    delete(log) {
      const values = processLog(log);
      if (!values) return;
      const { entity, component, table } = values;

      debug("deleting component", {
        namespace: table.namespace,
        name: table.name,
        entity,
      });

      removeComponent(component, entity);
    },
  });
};
