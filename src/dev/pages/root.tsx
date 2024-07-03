import React, { useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { toHex } from "viem";

import type { Entity } from "@/lib/external/mud/entity";
import { NavButton } from "@/dev/components/nav-button";
import { useDevTools } from "@/dev/lib/context";
import { ConfigTable, StorageAdapterUpdateTable } from "@/dev/lib/store";

export const RootPage = () => {
  const { adapterUpdate$ } = useDevTools();
  const navigate = useNavigate();
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

  useEffect(() => {
    navigate(ConfigTable.get()?.route ?? "/");
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full min-h-[100vh] font-sans bg-base-black text-base-50">
      <div className="flex">
        <NavButton to="/">Home</NavButton>
        <NavButton to="/tables">Tables</NavButton>
        <NavButton to="/storage-adapter">Storage adapter</NavButton>
        <NavButton to="/entities">Entities</NavButton>
        <NavButton to="/query">Query</NavButton>
        <span className="flex-1" />
        <NavButton to="/config">Config</NavButton>
      </div>
      <div className="px-2">
        <Outlet />
      </div>
    </div>
  );
};
