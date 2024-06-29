import React, { useMemo } from "react";
import { twMerge } from "tailwind-merge";

import { stringifyProperties, useCopyCell } from "@/dev/lib/utils";
import { ConfigTable, StorageAdapterUpdateTable } from "@/dev/lib/store";
import { StorageAdapterUpdateFormatted } from "@/dev/lib/types";

export const StorageAdapterData = () => {
  const { getCellAttributes } = useCopyCell();

  const config = ConfigTable.use();
  const storageAdapterUpdateEntities = StorageAdapterUpdateTable.useAll();
  const storageAdapterUpdates = useMemo(
    () =>
      storageAdapterUpdateEntities
        .slice(storageAdapterUpdateEntities.length - 100)
        .map((entity) => StorageAdapterUpdateTable.get(entity) as StorageAdapterUpdateFormatted),
    [storageAdapterUpdateEntities],
  );

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
          {storageAdapterUpdates.length > 0 ? (
            storageAdapterUpdates.map((update, index) => {
              const properties = stringifyProperties(update.properties, update.tablePropertiesSchema);
              const searchValues = [
                ...Object.values(properties),
                update.entity,
                update.tableName,
                update.blockNumber?.toString(),
              ].filter((value) => value) as string[];

              if (config?.filter && searchValues.every((value) => !value.includes(config.filter as string))) {
                return null;
              }

              return (
                <tr key={index} className={twMerge("h-2", index % 2 === 0 ? "bg-base-900" : "bg-base-800")}>
                  <td {...getCellAttributes(update.blockNumber?.toString() ?? "unknown", `${index}-blockNumber`)}>
                    {update.blockNumber?.toString() ?? "unknown"}
                  </td>
                  <td {...getCellAttributes(update.tableName, `${index}-table`)}>{update.tableName}</td>
                  <td {...getCellAttributes(update.entity, `${index}-entity`, "max-w-[500px]")}>{update.entity}</td>
                  <td {...getCellAttributes(properties, `${index}-properties`, "max-w-[600px]")}>
                    {JSON.stringify(properties)}
                  </td>
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
