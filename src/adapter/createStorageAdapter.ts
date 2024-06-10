import { hexToResource, spliceHex } from "@latticexyz/common";
import { type Hex, size } from "viem";
import { Write } from "@primodiumxyz/sync-stack";

import { decodeArgs, type StorageAdapterLog } from "@/adapter";
import {
  type AllTableDefs,
  type ContractTableDef,
  type ContractTableDefs,
  type StoreConfig,
  debug,
  hexKeyTupleTo$Record,
  resourceToLabel,
} from "@/lib";
import type { ContractTable, ContractTables, Properties } from "@/tables";

export const createStorageAdapter = <config extends StoreConfig, extraTableDefs extends ContractTableDefs | undefined>({
  tables,
  shouldSkipUpdateStream,
}: {
  tables: ContractTables<AllTableDefs<config, extraTableDefs>>;
  shouldSkipUpdateStream?: () => boolean;
}) => {
  const processLog = (log: StorageAdapterLog) => {
    const $record = hexKeyTupleTo$Record(log.args.keyTuple);

    const table = Object.values(tables).find(
      (table) => table.id === log.args.tableId,
    ) as ContractTable<ContractTableDef>;

    if (!table) {
      const { namespace, name } = hexToResource(log.args.tableId);
      debug(`skipping update for unknown table: ${resourceToLabel({ namespace, name })} at ${log.address}`);
      return;
    }

    return { $record, table };
  };

  const storageAdapter = Write.toCustom({
    /* ----------------------------------- SET ---------------------------------- */
    set: (log) => {
      const processed = processLog(log);

      if (!processed) return;
      const { $record, table } = processed;

      const properties = decodeArgs(table.metadata.abiPropertiesSchema, log.args);

      debug("setting properties", {
        namespace: table.metadata.namespace,
        name: table.metadata.name,
        $record,
        properties,
      });

      table.set(
        {
          ...properties,
          __staticData: log.args.staticData,
          __encodedLengths: log.args.encodedLengths,
          __dynamicData: log.args.dynamicData,
          __lastSyncedAtBlock: log.blockNumber,
        },
        $record,
        { skipUpdateStream: shouldSkipUpdateStream?.() },
      );
    },
    /* --------------------------------- STATIC --------------------------------- */
    updateStatic: (log) => {
      const processed = processLog(log);
      if (!processed) return;
      const { $record, table } = processed;

      const previousProperties = table.get($record);
      const previousStaticData = previousProperties?.__staticData ?? ("0x" as Hex);
      const newStaticData = spliceHex(previousStaticData, log.args.start, size(log.args.data), log.args.data);
      const newProperties = decodeArgs(table.metadata.abiPropertiesSchema, {
        staticData: newStaticData,
        encodedLengths: previousProperties?.__encodedLengths ?? ("0x" as Hex),
        dynamicData: previousProperties?.__dynamicData ?? ("0x" as Hex),
      }) as Properties<typeof table.propertiesSchema>;

      debug("setting properties via splice static", {
        namespace: table.metadata.namespace,
        name: table.metadata.name,
        $record,
        previousStaticData,
        newStaticData,
        previousProperties,
        newProperties,
      });

      table.set(
        {
          ...newProperties,
          __staticData: newStaticData,
          __lastSyncedAtBlock: log.blockNumber,
        },
        $record,
        { skipUpdateStream: shouldSkipUpdateStream?.() },
      );
    },
    /* --------------------------------- DYNAMIC -------------------------------- */
    updateDynamic: (log) => {
      const processed = processLog(log);
      if (!processed) return;
      const { $record, table } = processed;

      const previousProperties = table.get($record);
      const previousDynamicData = previousProperties?.__dynamicData ?? ("0x" as Hex);
      const newDynamicData = spliceHex(previousDynamicData, log.args.start, log.args.deleteCount, log.args.data);
      const newProperties = decodeArgs(table.metadata.abiPropertiesSchema, {
        staticData: previousProperties?.__staticData ?? ("0x" as Hex),
        encodedLengths: log.args.encodedLengths,
        dynamicData: newDynamicData,
      }) as Properties<typeof table.propertiesSchema>;

      debug("setting properties via splice dynamic", {
        namespace: table.metadata.namespace,
        name: table.metadata.name,
        $record,
        previousDynamicData,
        newDynamicData,
        previousProperties,
        newProperties,
      });

      table.set(
        {
          ...newProperties,
          __encodedLengths: log.args.encodedLengths,
          __dynamicData: newDynamicData,
          __lastSyncedAtBlock: log.blockNumber,
        },
        $record,
        { skipUpdateStream: shouldSkipUpdateStream?.() },
      );
    },
    /* --------------------------------- DELETE --------------------------------- */
    delete: (log) => {
      const processed = processLog(log);
      if (!processed) return;
      const { $record, table } = processed;

      debug("deleting properties", {
        namespace: table.metadata.namespace,
        name: table.metadata.name,
        $record,
      });

      table.remove($record);
    },
  });

  const triggerUpdateStream = () => {
    // @ts-expect-error too complex union type
    for (const _table of Object.values(tables)) {
      const table = _table as ContractTable<ContractTableDef>;
      for (const $record of table.$records()) {
        const properties = table.get($record);
        table.update$.next({ table, $record, properties: { current: properties, prev: properties }, type: "noop" });
      }
    }
  };

  return { storageAdapter, triggerUpdateStream };
};
