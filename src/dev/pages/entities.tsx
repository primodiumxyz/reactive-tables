import React, { useState } from "react";
import { twMerge } from "tailwind-merge";
import { isHex } from "viem";

import type { Table } from "@/tables/types";
import type { Entity } from "@/lib/external/mud/entity";
import type { Properties } from "@/lib/external/mud/schema";
import { Title } from "@/dev/components";
import { useDevTools } from "@/dev/lib/context";
import { stringifyProperties, useCopyCell } from "@/dev/lib/utils";

type EntityProperties<table extends Table = Table> = {
  table: table;
  properties: Properties<table["propertiesSchema"]>;
};

export const EntitiesPage = () => {
  const { getCellAttributes } = useCopyCell();
  const { contractTables, otherTables } = useDevTools();
  const tables = Object.values({ ...contractTables, ...otherTables }) as Table[];

  const [properties, setProperties] = useState<EntityProperties[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  const searchEntity = () => {
    if (!isHex(input)) {
      setProperties([]);
      setError("Entity should be a hex string");
      return;
    }

    const properties = tables
      .map((table) => {
        const props = table.get(input as Entity);
        return props ? { table, properties: props } : undefined;
      })
      .filter(Boolean) as EntityProperties[];

    if (!properties || !properties.length) {
      setProperties([]);
      setError("Entity not found in any table");
      return;
    }

    setProperties(properties);
    setError(undefined);
  };

  return (
    <div className="flex flex-col gap-2">
      <Title>Entity</Title>
      <div className="flex items-center gap-4 h-6">
        <input
          type="text"
          className="min-w-[460px] h-6 px-2 py-0 border-none bg-base-800 text-base-500 text-xs"
          placeholder="Search an entity across all tables"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="h-6 px-2 py-1 border-none bg-base-800 text-base-150 hover:bg-base-700 text-xs cursor-pointer"
          onClick={searchEntity}
        >
          search
        </button>
        <span className="text-red-light text-xs">{error}</span>
      </div>
      {!!properties.length && (
        <>
          <Title>Tables</Title>
          <div className="overflow-auto max-h-[calc(100vh-28px-16px-24px-16px-24px-48px)]">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-base-950 text-left">
                <tr className="font-mono font-thin">
                  <th className="px-4 font-normal text-sm">table</th>
                  <th className="px-4 font-normal text-sm">properties</th>
                </tr>
              </thead>

              <tbody className="font-mono text-xs">
                {properties.map(({ table, properties: _properties }, index) => {
                  const properties = stringifyProperties(_properties, table.propertiesSchema);

                  return (
                    <tr key={index} className={twMerge("h-2", index % 2 === 0 ? "bg-base-900" : "bg-base-800")}>
                      <td {...getCellAttributes(properties, `${index}-name`)}>{table.metadata.name}</td>
                      <td {...getCellAttributes(properties, `${index}-properties`, "max-w-[600px]")}>
                        {JSON.stringify(properties)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
