import React from "react";
import { useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";

import type { Table } from "@/tables";
import { stringifyProperties, useCopyCell } from "@/dev/lib/utils";
import { useDevTools } from "@/dev/lib/context";
import { ConfigTable } from "@/dev/lib/store";

export const TableData = () => {
  const { contractTables, otherTables } = useDevTools();
  const { id: idParam } = useParams();
  const { getCellAttributes } = useCopyCell();
  const config = ConfigTable.use();

  const table = Object.values({ ...contractTables, ...otherTables }).find((table) => table.id === idParam) as Table;
  const entities = table?.useAll() ?? [];

  if (!table) {
    console.warn(`Table with id ${idParam} not found`);
    return null;
  }

  return (
    <div className="overflow-auto max-h-[calc(100vh-28px-16px-124px-12px)]">
      <table>
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
        <tbody className="font-mono text-xs">
          {entities.map((entity, index) => {
            const _properties = table.get(entity);
            if (!_properties) {
              console.warn(`Entity ${entity} not found in table ${table.id}`);
              return null;
            }

            const properties = stringifyProperties(_properties, table.propertiesSchema);

            if (
              config?.filter &&
              [...Object.values(properties).concat(entity)].every((value) => !value.includes(config.filter as string))
            ) {
              return null;
            }

            return (
              <tr key={entity} className={twMerge("h-2", index % 2 === 0 ? "bg-base-900" : "bg-base-800")}>
                <td {...getCellAttributes(entity, entity, "max-w-[500px]")}>
                  {config?.shrinkEntities ? entity.slice(0, 8) + "..." + entity.slice(-6) : entity}
                </td>
                {Object.entries(properties).map(([key, value]) => {
                  return (
                    <td key={key} {...getCellAttributes(value, `${index}-${key}`, "max-w-[600px] whitespace-nowrap")}>
                      {value ?? <span className="text-base-500">✖️</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
