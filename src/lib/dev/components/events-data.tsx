import React, { useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { storeEventsAbi } from "@latticexyz/store";

import type { StorageAdapterLog } from "@/adapter";
import { decodePropertiesArgs } from "@/adapter/decodeProperties";
import type { ContractTable } from "@/tables";
import { hexKeyTupleToEntity, hexToResource } from "@/utils";
import { useVisualizer } from "@/lib/dev/config/context";
import { serialize } from "@/lib/dev/utils";

const getProperties = (log: StorageAdapterLog, table?: ContractTable) => {
  if (table) {
    const propertiesSchema = table.metadata.abiPropertiesSchema;

    if (log.eventName === "Store_SetRecord") {
      const properties = decodePropertiesArgs(propertiesSchema, log.args);
      return serialize({
        ...properties,
        __staticData: log.args.staticData,
        __encodedLengths: log.args.encodedLengths,
        __dynamicData: log.args.dynamicData,
        __lastSyncedAtBlock: log.blockNumber,
      });
    }

    if (log.eventName === "Store_SpliceStaticData") {
      return JSON.stringify({ start: log.args.start, data: log.args.data });
    }

    if (log.eventName === "Store_SpliceDynamicData") {
      return JSON.stringify({
        start: log.args.start,
        deleteCount: log.args.deleteCount,
        encodedLengths: log.args.encodedLengths,
        data: log.args.data,
      });
    }
  } else {
    if (log.eventName === "Store_SetRecord")
      return JSON.stringify({
        staticData: log.args.staticData,
        encodedLengths: log.args.encodedLengths,
        dynamicData: log.args.dynamicData,
      });

    if (log.eventName === "Store_SpliceStaticData")
      return JSON.stringify({ start: log.args.start, data: log.args.data });

    if (log.eventName === "Store_SpliceDynamicData")
      return JSON.stringify({
        start: log.args.start,
        deleteCount: log.args.deleteCount,
        encodedLengths: log.args.encodedLengths,
        data: log.args.data,
      });
  }
};

export const EventsData = () => {
  const { tables, publicClient, worldAddress } = useVisualizer();
  const [logs, setLogs] = React.useState<StorageAdapterLog[]>([]);

  useEffect(() => {
    let unwatch: () => void | undefined;
    const initWatcher = async () => {
      if (!publicClient || !worldAddress) return;

      unwatch = publicClient.watchContractEvent({
        address: worldAddress,
        abi: storeEventsAbi,
        onLogs: (logs) => {
          setLogs((prevLogs) => [...logs, ...prevLogs].slice(0, 1000) as StorageAdapterLog[]);
        },
      });
    };

    initWatcher();
    return () => unwatch?.();
  }, [publicClient, worldAddress]);

  return (
    <div className="overflow-auto max-h-[calc(100vh-28px-16px-68px-16px-24px-48px)]">
      <table className="w-full">
        <thead className="sticky top-0 z-10 bg-base-950 text-left">
          <tr className="font-mono font-thin">
            <th className="px-4 font-normal text-sm">block</th>
            <th className="px-4 font-normal text-sm">table</th>
            <th className="px-4 font-normal text-sm">entity</th>
            <th className="px-4 font-normal text-sm">properties</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs">
          {logs.length > 0 ? (
            logs.map((log, index) => {
              const table = Object.values(tables).find((table) => table.id === log.args.tableId) as unknown as
                | ContractTable
                | undefined;

              return (
                <tr key={index} className={twMerge("h-2", index % 2 === 0 ? "bg-base-900" : "bg-base-800")}>
                  <td className="px-1 whitespace-nowrap overflow-auto">{log.blockNumber?.toString() ?? "unknown"}</td>
                  <td className="px-1 whitespace-nowrap overflow-auto">{hexToResource(log.args.tableId).name}</td>
                  <td className="px-1 whitespace-nowrap overflow-auto">{hexKeyTupleToEntity(log.args.keyTuple)}</td>
                  <td className="px-1 whitespace-nowrap overflow-auto">{getProperties(log, table)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-4 text-sm text-base-500">
                No events yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
