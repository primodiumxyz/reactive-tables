import { type Hex, size } from "viem";
import { Subject } from "rxjs";
import { Write } from "@primodiumxyz/sync-stack";

import { decodePropertiesArgs } from "@/adapter/decodeProperties";
import type { StorageAdapterLog } from "@/adapter/types";
import type { ContractTable, ContractTables } from "@/tables/types";
import { hexToResource, resourceToLabel, spliceHex } from "@/lib/external/mud/common";
import { type Entity, hexKeyTupleToEntity } from "@/lib/external/mud/entity";
import type { Properties } from "@/lib/external/mud/schema";
import type { ContractTableDef, ContractTableDefs } from "@/lib/definitions";
import type { StorageAdapterUpdate } from "@/lib/dev/config/types";
import { debug } from "@/lib/debug";

export const createStorageAdapter = <tableDefs extends ContractTableDefs = ContractTableDefs>({
  tables,
  shouldSkipUpdateStream,
  adapterUpdate$,
}: {
  tables: ContractTables<tableDefs>;
  shouldSkipUpdateStream?: () => boolean;
  adapterUpdate$?: Subject<StorageAdapterUpdate>;
}) => {
  const processLog = (log: StorageAdapterLog) => {
    const entity = hexKeyTupleToEntity(log.args.keyTuple);

    const table = Object.values(tables).find(
      (table) => table.id === log.args.tableId,
    ) as ContractTable<ContractTableDef>;

    if (!table) {
      const { namespace, name } = hexToResource(log.args.tableId);
      debug(`skipping update for unknown table: ${resourceToLabel({ namespace, name })} at ${log.address}`);
      return;
    }

    return { entity, table };
  };

  const skipIfMoreRecentState = <tableDef extends ContractTableDef>(
    log: StorageAdapterLog,
    table: ContractTable<tableDef>,
    entity: Entity,
  ) => {
    const properties = table.get(entity);
    const isMoreRecent = properties && properties.__lastSyncedAtBlock > (log.blockNumber || BigInt(0));

    if (isMoreRecent) {
      debug("skipping update as table state is more recent for this entity", {
        namespace: table.metadata.namespace,
        name: table.metadata.name,
        entity,
        properties,
      });

      return true;
    }

    return false;
  };

  const storageAdapter = Write.toCustom({
    /* ----------------------------------- SET ---------------------------------- */
    set: (log) => {
      const processed = processLog(log);
      if (!processed) return;

      const { entity, table } = processed;
      if (skipIfMoreRecentState(log, table, entity)) return;

      const newProperties = decodePropertiesArgs(table.metadata.abiPropertiesSchema, log.args);
      debug("setting properties", {
        namespace: table.metadata.namespace,
        name: table.metadata.name,
        entity,
        properties: newProperties,
      });

      const properties = {
        ...newProperties,
        __staticData: log.args.staticData,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: log.args.dynamicData,
        __lastSyncedAtBlock: log.blockNumber,
      };

      table.set(properties, entity, { skipUpdateStream: shouldSkipUpdateStream?.() });
      adapterUpdate$?.next({ table, entity, properties, blockNumber: log.blockNumber });
    },
    /* --------------------------------- STATIC --------------------------------- */
    updateStatic: (log) => {
      const processed = processLog(log);
      if (!processed) return;

      const { entity, table } = processed;
      if (skipIfMoreRecentState(log, table, entity)) return;

      const previousProperties = table.get(entity);
      const previousStaticData = previousProperties?.__staticData ?? ("0x" as Hex);
      const newStaticData = spliceHex(previousStaticData, log.args.start, size(log.args.data), log.args.data);
      const newProperties = decodePropertiesArgs(table.metadata.abiPropertiesSchema, {
        staticData: newStaticData,
        encodedLengths: previousProperties?.__encodedLengths ?? ("0x" as Hex),
        dynamicData: previousProperties?.__dynamicData ?? ("0x" as Hex),
      }) as Properties<typeof table.propertiesSchema>;

      debug("setting properties via splice static", {
        namespace: table.metadata.namespace,
        name: table.metadata.name,
        entity,
        previousStaticData,
        newStaticData,
        previousProperties,
        newProperties,
      });

      const properties = {
        ...newProperties,
        __staticData: newStaticData,
        __lastSyncedAtBlock: log.blockNumber,
      };

      table.set(properties, entity, { skipUpdateStream: shouldSkipUpdateStream?.() });
      adapterUpdate$?.next({ table, entity, properties, blockNumber: log.blockNumber });
    },
    /* --------------------------------- DYNAMIC -------------------------------- */
    updateDynamic: (log) => {
      const processed = processLog(log);
      if (!processed) return;

      const { entity, table } = processed;
      if (skipIfMoreRecentState(log, table, entity)) return;

      const previousProperties = table.get(entity);
      const previousDynamicData = previousProperties?.__dynamicData ?? ("0x" as Hex);
      const newDynamicData = spliceHex(previousDynamicData, log.args.start, log.args.deleteCount, log.args.data);
      const newProperties = decodePropertiesArgs(table.metadata.abiPropertiesSchema, {
        staticData: previousProperties?.__staticData ?? ("0x" as Hex),
        encodedLengths: log.args.encodedLengths,
        dynamicData: newDynamicData,
      }) as Properties<typeof table.propertiesSchema>;

      debug("setting properties via splice dynamic", {
        namespace: table.metadata.namespace,
        name: table.metadata.name,
        entity,
        previousDynamicData,
        newDynamicData,
        previousProperties,
        newProperties,
      });

      const properties = {
        ...newProperties,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: newDynamicData,
        __lastSyncedAtBlock: log.blockNumber,
      };

      table.set(properties, entity, { skipUpdateStream: shouldSkipUpdateStream?.() });
      adapterUpdate$?.next({ table, entity, properties, blockNumber: log.blockNumber });
    },
    /* --------------------------------- DELETE --------------------------------- */
    delete: (log) => {
      const processed = processLog(log);
      if (!processed) return;

      const { entity, table } = processed;
      if (skipIfMoreRecentState(log, table, entity)) return;

      debug("deleting properties", {
        namespace: table.metadata.namespace,
        name: table.metadata.name,
        entity,
      });

      table.remove(entity);
    },
  });

  const triggerUpdateStream = () => {
    for (const _table of Object.values(tables)) {
      const table = _table as ContractTable<ContractTableDef>;
      for (const entity of table.entities()) {
        const properties = table.get(entity);
        table.update$.next({ table, entity, properties: { current: properties, prev: properties }, type: "noop" });
      }
    }
  };

  return { storageAdapter, triggerUpdateStream };
};
