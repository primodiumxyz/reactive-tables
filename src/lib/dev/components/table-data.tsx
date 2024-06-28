import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";

import { Type } from "@/lib/external/mud/schema";
import { serialize } from "@/lib/dev/utils";
import { useVisualizer } from "@/lib/dev/config/context";
import { SettingsTable } from "@/lib/dev/config/settings";

export const TableData = () => {
  const { tables } = useVisualizer();
  const { id: idParam } = useParams();
  const settings = SettingsTable.use();

  const table = Object.values(tables).find((table) => table.id === idParam);
  const entities = table?.useAll() ?? [];

  const [copiedCell, setCopiedCell] = React.useState<string | null>(null);
  const copyToClipboard = (content: string, cellId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedCell(cellId);
  };

  useEffect(() => {
    if (copiedCell) {
      const timer = setTimeout(() => {
        setCopiedCell(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [copiedCell]);

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
            const properties = table.get(entity);
            if (!properties) {
              console.warn(`Entity ${entity} not found in table ${table.id}`);
              return null;
            }

            if (
              settings?.filter &&
              [...Object.values(properties).concat(entity)].every(
                (value) => !String(value).includes(settings.filter as string),
              )
            ) {
              return null;
            }

            return (
              <tr key={entity} className={twMerge("h-2", index % 2 === 0 ? "bg-base-900" : "bg-base-800")}>
                <td
                  className={twMerge(
                    "px-1 whitespace-nowrap overflow-auto hover:bg-base-700 cursor-pointer",
                    copiedCell === entity && "bg-green-light hover:bg-green-light",
                  )}
                  onClick={() => copyToClipboard(entity, entity)}
                >
                  {settings?.shrinkEntities ? entity.slice(0, 8) + "..." + entity.slice(-6) : entity}
                </td>
                {Object.keys(table.propertiesSchema).map((name) => {
                  const fieldValue = properties[name];

                  return (
                    <td
                      key={name}
                      className={twMerge(
                        "px-1 whitespace-nowrap max-w-96 overflow-auto hover:bg-base-600 cursor-pointer",
                        copiedCell === `${index}-${name}` && "bg-green-light hover:bg-green-light",
                      )}
                      onClick={() => copyToClipboard(serialize(fieldValue), `${index}-${name}`)}
                    >
                      {!fieldValue ? (
                        <span className="text-base-500">✖️</span>
                      ) : table.propertiesSchema[name] === Type.T ? (
                        serialize(fieldValue)
                      ) : Array.isArray(fieldValue) ? (
                        fieldValue.map(String).join(", ")
                      ) : (
                        String(fieldValue)
                      )}
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
