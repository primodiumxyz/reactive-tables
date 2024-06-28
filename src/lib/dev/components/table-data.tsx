import React from "react";
import { useParams } from "react-router-dom";

import { Type } from "@/lib/external/mud/schema";
import { serialize } from "@/lib/dev/utils";
import { useVisualizer } from "@/lib/dev/config/context";
import { twMerge } from "tailwind-merge";

export const TableData = () => {
  const { tables } = useVisualizer();

  const { id: idParam } = useParams();
  const table = Object.values(tables).find((table) => table.id === idParam);
  const entities = table?.useAll() ?? [];

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (!table) {
    console.warn(`Table with id ${idParam} not found`);
    return null;
  }

  return (
    <table className="w-full">
      <thead className="sticky top-0 z-10 bg-base-950 text-left">
        <tr className="font-mono font-thin">
          <th className="px-4 font-normal text-sm">entity</th>
          {Object.keys(table.propertiesSchema).map((name) => (
            <th key={name} className="px-4 font-normal text-sm">
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className=" bg-base-700 font-mono text-xs">
        {entities.map((entity, index) => {
          const properties = table.get(entity);
          if (!properties) {
            console.warn(`Entity ${entity} not found in table ${table.id}`);
            return null;
          }

          return (
            <tr key={entity} className={twMerge("h-2", index % 2 === 0 ? "bg-base-900" : "bg-base-800")}>
              <td
                className="px-1 whitespace-nowrap overflow-auto hover:bg-base-700 cursor-pointer"
                onClick={() => copyToClipboard(entity)}
              >
                {entity}
              </td>
              {Object.keys(table.propertiesSchema).map((name) => {
                const fieldValue = properties[name];

                return (
                  <td
                    key={name}
                    className="px-1 whitespace-nowrap max-w-96 overflow-auto hover:bg-base-600 cursor-pointer"
                    onClick={() => copyToClipboard(serialize(fieldValue))}
                  >
                    {table.propertiesSchema[name] === Type.T
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
