import React, { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { toHex } from "viem";

import type { Entity } from "@/lib/external/mud/entity";
import { NavButton } from "@/dev/components/nav-button";
import { useVisualizer } from "@/dev/lib/context";
import { StorageAdapterUpdateTable } from "@/dev/lib/store";

export const RootPage = () => {
  const { adapterUpdate$ } = useVisualizer();
  const adapterUpdatesIndex = useRef(0);

  useEffect(() => {
    const adapterSub = adapterUpdate$.subscribe((update) => {
      StorageAdapterUpdateTable.set(
        {
          tableName: update.table.metadata.name,
          tablePropertiesSchema: update.table.propertiesSchema,
          entity: update.entity,
          properties: update.properties,
          blockNumber: update.blockNumber,
        },
        toHex(adapterUpdatesIndex.current++) as Entity,
      );
    });

    return () => adapterSub.unsubscribe();
  }, [adapterUpdate$]);

  return (
    <div className="flex flex-col gap-4 w-full min-h-[100vh]">
      <div className="flex">
        <NavButton to="/">Home</NavButton>
        <NavButton to="/tables">Tables</NavButton>
        <NavButton to="/storage-adapter">Storage adapter</NavButton>
        <span className="flex-1" />
        <NavButton to="/config">Config</NavButton>
        {/* <NavButton
          to="/actions"
          className={({ isActive }) =>
            twMerge("py-1.5 px-3", isActive ? "bg-slate-800 text-white" : "hover:bg-blue-800 hover:text-white")
          }
        >
          Actions
        </NavButton>
        <NavButton
          to="/events"
          className={({ isActive }) =>
            twMerge("py-1.5 px-3", isActive ? "bg-slate-800 text-white" : "hover:bg-blue-800 hover:text-white")
          }
        >
          Store log
        </NavButton>
        {useStore ? (
          <NavButton
            to="/tables"
            className={({ isActive }) =>
              twMerge("py-1.5 px-3", isActive ? "bg-slate-800 text-white" : "hover:bg-blue-800 hover:text-white")
            }
          >
            Tables
          </NavButton>
        ) : null} */}
      </div>
      <div className="px-2">
        <Outlet />
      </div>
    </div>
  );
};
