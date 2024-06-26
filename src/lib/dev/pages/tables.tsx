import React, { useEffect, useRef } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";

import { NavButton } from "@/lib/dev/components";
import { useVisualizer } from "@/lib/dev/config/context";

export const TablesPage = () => {
  const { tables: _tables } = useVisualizer();
  const tables = Object.values(_tables).sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));

  const { id: idParam } = useParams();
  const selectedTable = tables.find((table) => table.id === idParam) ?? tables[0];

  const detailsRef = useRef<HTMLDetailsElement>(null);
  const navigate = useNavigate();

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
    <div className="p-6 space-y-4">
      {!tables.length ? (
        <>Waiting for tables</>
      ) : (
        <div className="space-y-2">
          <h1 className="font-bold text-white/40 uppercase text-xs">Component</h1>

          <details ref={detailsRef} className="pointer-events-none select-none">
            <summary className="group pointer-events-auto cursor-pointer inline-flex">
              <span
                className={
                  "inline-flex gap-2 px-3 py-2 items-center border-2 border-white/10 rounded group-hover:border-blue-700 group-hover:bg-blue-700 group-hover:text-white"
                }
              >
                {selectedTable ? (
                  <span className="font-mono">{selectedTable.metadata.name}</span>
                ) : (
                  <span>Pick a table…</span>
                )}
                <span className="text-white/40 text-xs">▼</span>
              </span>
            </summary>
            <div className="relative">
              <div className="pointer-events-auto absolute top-1 left-0 z-20 bg-slate-700 rounded shadow-lg flex flex-col py-1.5 font-mono text-xs leading-none">
                {tables.map((table) => (
                  <NavButton
                    className={twMerge(
                      "px-2 py-1.5 text-left hover:bg-blue-700 hover:text-white",
                      table === selectedTable ? "bg-slate-600" : null,
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
        </div>
      )}
      <Outlet />
    </div>
  );
};
