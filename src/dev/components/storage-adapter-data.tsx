import React, { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

import type { Entity } from "@/lib/external/mud/entity";
import { FilterInput } from "@/dev/components/filter-input";
import { stringifyProperties, useCopyCell } from "@/dev/lib/utils";
import { StorageAdapterUpdateTable } from "@/dev/lib/store";
import type { StorageAdapterUpdateFormatted } from "@/dev/lib/types";
import { Properties, Schema } from "@/lib";

export const StorageAdapterData = (props: { limit?: number; filters?: boolean }) => {
  const { limit = 100, filters = true } = props;
  const { getCellAttributes } = useCopyCell();

  const [queryOptions, setQueryOptions] = useState<
    Partial<{
      blockNumber: bigint;
      tableName: string;
      entity: Entity;
      properties: string;
    }>
  >({});
  const filteredEntities = filters
    ? StorageAdapterUpdateTable.useAllMatching(
        ({ blockNumber, tableName, tablePropertiesSchema, entity, properties }) => {
          const {
            blockNumber: queryBlockNumber,
            tableName: queryTableName,
            entity: queryEntity,
            properties: queryProperties,
          } = queryOptions;
          return (
            (queryBlockNumber ? blockNumber === queryBlockNumber : true) &&
            (queryTableName ? tableName.includes(queryTableName) : true) &&
            (queryEntity ? entity.includes(queryEntity) : true) &&
            (queryProperties
              ? JSON.stringify(
                  stringifyProperties(properties as Properties<Schema>, tablePropertiesSchema as Schema),
                ).includes(queryProperties)
              : true)
          );
        },
        [queryOptions],
      )
    : [];
  const allEntities = StorageAdapterUpdateTable.useAll();

  const updates = useMemo(() => {
    const entities = filters && Object.values(queryOptions).some((option) => option) ? filteredEntities : allEntities;

    return entities
      .slice(entities.length - limit)
      .map((entity) => StorageAdapterUpdateTable.get(entity) as StorageAdapterUpdateFormatted);
  }, [filteredEntities, allEntities, limit]);

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
        {filters && (
          <thead className="sticky top-[22px] z-10 bg-base-950 text-left">
            <tr className="font-mono font-thin">
              <th className="min-w-32">
                <FilterInput
                  value={queryOptions.blockNumber?.toString() ?? ""}
                  onChange={(value) => {
                    setQueryOptions((prev) => ({
                      ...prev,
                      blockNumber: value !== "" && !isNaN(Number(value)) ? BigInt(value) : undefined,
                    }));
                  }}
                  placeholder="filter by block"
                />
              </th>
              <th className="min-w-32">
                <FilterInput
                  value={queryOptions.tableName ?? ""}
                  onChange={(value) => setQueryOptions((prev) => ({ ...prev, tableName: value }))}
                  placeholder="filter by table"
                />
              </th>
              <th className="min-w-32">
                <FilterInput
                  value={queryOptions.entity ?? ""}
                  onChange={(value) => setQueryOptions((prev) => ({ ...prev, entity: value as Entity }))}
                  placeholder="filter by entity"
                />
              </th>
              <th className="min-w-32">
                <FilterInput
                  value={queryOptions.properties ?? ""}
                  onChange={(value) =>
                    setQueryOptions((prev) => ({
                      ...prev,
                      properties: value === "" ? undefined : value,
                    }))
                  }
                  placeholder="filter by properties"
                />
              </th>
            </tr>
          </thead>
        )}
        <tbody className="font-mono text-xs">
          {updates.length > 0 ? (
            updates.map((update, index) => {
              const properties = stringifyProperties(update.properties, update.tablePropertiesSchema);

              return (
                <tr key={index} className={twMerge("h-2", index % 2 === 0 ? "bg-base-900" : "bg-base-800")}>
                  <td {...getCellAttributes(update.blockNumber?.toString() ?? "unknown", `${index}-blockNumber`)}>
                    {update.blockNumber?.toString() ?? "unknown"}
                  </td>
                  <td {...getCellAttributes(update.tableName, `${index}-table`)}>{update.tableName}</td>
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
