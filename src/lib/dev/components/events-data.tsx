import React, { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

import { useVisualizer } from "@/lib/dev/config/context";
import { stringifyProperties, useCopyCell } from "@/lib/dev/utils";
import type { StorageAdapterUpdate } from "@/lib/dev/config/types";

export const EventsData = () => {
  const { adapterUpdate$ } = useVisualizer();
  const { getCellAttributes } = useCopyCell();
  const [updates, setUpdates] = useState<StorageAdapterUpdate[]>([]);

  useEffect(() => {
    const subscription = adapterUpdate$.subscribe((update) => {
      setUpdates((prev) => [update, ...prev]);
    });

    return () => subscription.unsubscribe();
  }, [adapterUpdate$]);

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
          {updates.length > 0 ? (
            updates.map((update, index) => {
              const properties = stringifyProperties(update.properties, update.table.propertiesSchema);

              return (
                <tr key={index} className={twMerge("h-2", index % 2 === 0 ? "bg-base-900" : "bg-base-800")}>
                  <td {...getCellAttributes(update.blockNumber?.toString() ?? "unknown", `${index}-blockNumber`)}>
                    {update.blockNumber?.toString() ?? "unknown"}
                  </td>
                  <td {...getCellAttributes(update.table.metadata.name, `${index}-table`)}>
                    {update.table.metadata.name}
                  </td>
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
