import React, { useEffect, useRef } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";

import type { Table } from "@/tables";
import { NavButton } from "@/lib/dev/components";
import { useVisualizer } from "@/lib/dev/config/context";
import { SettingsTable } from "@/lib/dev/config/settings";

export const TablesPage = () => {
  const { id: idParam } = useParams();
  const { contractTables, otherTables } = useVisualizer();
  const tables = Object.values({ ...contractTables, ...otherTables }).sort((a, b) =>
    a.metadata.name.localeCompare(b.metadata.name),
  ) as Table[];

  const selectedTable = tables.find((table) => table.id === idParam) ?? tables[0];

  const navigate = useNavigate();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const search = SettingsTable.use()?.filter ?? "";

  useEffect(() => {
    if (idParam !== selectedTable.id) {
      navigate(selectedTable.id);
    }
  }, [idParam, selectedTable.id]);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!detailsRef.current) return;
      if (event.target instanceof Node && detailsRef.current.contains(event.target)) return;
      detailsRef.current.open = false;
    };

    window.addEventListener("click", listener);
    return () => window.removeEventListener("click", listener);
  });

  return (
    <div>
      {!tables.length ? (
        <>Waiting for tables</>
      ) : (
        <div className="mb-2 flex flex-col gap-2">
          <h1 className="font-bold text-base-500 uppercase text-xs">Table</h1>
          <details ref={detailsRef} className="pointer-events-none select-none">
            <summary className="inline-flex group pointer-events-auto cursor-pointer">
              <div
                className={
                  "inline-flex gap-4 px-3 py-2 items-center border-2 text-sm border-base-200 group-hover:border-purple-light group-hover:bg-purple-light"
                }
              >
                {selectedTable ? (
                  <span className="font-mono">{selectedTable.metadata.name}</span>
                ) : (
                  <span>Pick a table…</span>
                )}
                <span className="text-base-500 text-xs">▼</span>
              </div>
            </summary>
            <div className="relative">
              <div className="pointer-events-auto absolute top-1 left-0 z-20 bg-base-800 flex flex-col font-mono text-xs leading-none">
                {tables.map((table) => (
                  <NavButton
                    className={twMerge(
                      "px-2 py-1.5 text-left hover:bg-purple-light",
                      table === selectedTable && "bg-purple",
                    )}
                    key={table.id}
                    to={table.id}
                    onClick={() => {
                      if (detailsRef.current) {
                        detailsRef.current.open = false;
                      }
                    }}
                  >
                    {table.metadata.name}
                  </NavButton>
                ))}
              </div>
            </div>
          </details>
          <div className="flex items-center gap-4 h-6">
            Search
            <input
              type="text"
              className="min-w-64 border-none bg-base-800 text-base-500 px-2 py-1"
              placeholder="Search"
              value={search}
              onChange={(e) => SettingsTable.update({ filter: e.target.value })}
            />
            <button
              className="border-none px-2 py-1 bg-base-800 text-base-150 hover:bg-base-700 cursor-pointer"
              onClick={() => SettingsTable.update({ filter: "" })}
            >
              clear
            </button>
          </div>
          <div className="text-xs text-base-500">Click on a cell to copy its content</div>
        </div>
      )}
      <Outlet />
    </div>
  );
};
