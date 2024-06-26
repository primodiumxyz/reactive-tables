import React from "react";
import { useParams } from "react-router-dom";

import { serialize } from "@/lib/dev/utils";
import { useVisualizer } from "@/lib/dev/config/context";

export const TableData = () => {
  const { tables } = useVisualizer();

  const { id: idParam } = useParams();
  const table = Object.values(tables).find((table) => table.id === idParam);
  const entities = useEntityQuery([Has(table)]);

  if (!table) {
    console.warn(`Table with id ${idParam} not found`);
    return null;
  }

  // key here is useful to force a re-render on table changes,
  // otherwise state hangs around from previous render during navigation (entities)
  // return isStoreComponent(table) ? (
  //   <StoreComponentDataTable key={table.id} table={table} />
  // ) : (
  //   <ComponentDataTable key={table.id} table={table} />
  // );

  return (
    <table className="w-full -mx-1">
      <thead className="sticky top-0 z-10 bg-slate-800 text-left">
        <tr className="text-amber-200/80 font-mono">
          <th className="px-1 pt-1.5 font-normal">entity</th>
          {Object.keys(table.schema).map((name) => (
            <th key={name} className="px-1 pt-1.5 font-normal">
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="font-mono text-xs">
        {entities.map((entity) => {
          const value = getComponentValueStrict(table, entity);
          return (
            <tr key={entity}>
              <td className="px-1 whitespace-nowrap overflow-hidden text-ellipsis">{entity}</td>
              {Object.keys(table.schema).map((name) => {
                const fieldValue = value[name];
                return (
                  <td key={name} className="px-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    {table.schema[name] === Type.T
                      ? serialize(fieldValue)
                      : Array.isArray(fieldValue)
                        ? fieldValue.map(String).join(", ")
                        : String(fieldValue)}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
