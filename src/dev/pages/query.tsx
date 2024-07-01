import React, { Fragment, useCallback, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { toHex } from "viem";

import type { QueryOptions } from "@/queries/types";
import type { Table } from "@/tables/types";
import type { Entity } from "@/lib/external/mud/entity";
import { useDeepMemo } from "@/lib/external/mud/queries";
import type { Properties } from "@/lib/external/mud/schema";
import { uuid } from "@/lib/external/uuid";
import { useDevTools } from "@/dev/lib/context";
import { QueryOptionsTable } from "@/dev/lib/store";
import { parseProperties, serialize } from "@/dev/lib/utils";
import { query } from "@/queries/query";

type Fragment = Required<Omit<QueryOptions, "matching">> & { entity: Entity };
const emptyFragment = {
  with: [],
  withProperties: [],
  without: [],
  withoutProperties: [],
} as const;

export const QueryPage = () => {
  const { contractTables, otherTables } = useDevTools();
  const tables = Object.values({ ...contractTables, ...otherTables }).sort((a, b) =>
    a.metadata.name.localeCompare(b.metadata.name),
  ) as Table[];

  const queryFragmentEntities = QueryOptionsTable.useAll();
  const queryFragmentEntitiesMemoized = useDeepMemo(queryFragmentEntities);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [positiveFragments, setPositiveFragments] = useState<Fragment[]>([]);
  const [negativeFragments, setNegativeFragments] = useState<Fragment[]>([]);
  const [queryResult, setQueryResult] = useState<Entity[]>([]);
  const [error, setError] = useState<string | undefined>();

  const runQuery = useCallback(() => {
    const queryOptions = fragments.reduce(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (acc, { entity, ...options }) => {
        acc.with = [...acc.with, ...options.with];
        acc.withProperties = [...acc.withProperties, ...options.withProperties];
        acc.without = [...acc.without, ...options.without];
        acc.withoutProperties = [...acc.withoutProperties, ...options.withoutProperties];

        return acc;
      },
      {
        ...emptyFragment,
      } as unknown as Required<QueryOptions>,
    );

    if (!queryOptions.with.length && !queryOptions.withProperties.length) {
      setError("You must provide at least one positive condition.");
      return;
    }

    try {
      console.log(queryOptions);
      setQueryResult(query(queryOptions));
      setError(undefined);
    } catch (err) {
      setError("Error running query. Check the console for more details.");
      console.error("Error running query", { queryOptions, err });
    }
  }, [fragments]);

  useEffect(() => {
    const fragments = queryFragmentEntitiesMemoized.map((entity) => ({
      entity,
      ...QueryOptionsTable.get(entity),
    })) as Fragment[];

    setFragments(fragments);
    setPositiveFragments(
      fragments.filter((fragment) => fragment.with?.length > 0 || fragment.withProperties?.length > 0),
    );
    setNegativeFragments(
      fragments.filter((fragment) => fragment.with?.length === 0 && fragment.withProperties?.length === 0),
    );
  }, [queryFragmentEntitiesMemoized]);

  return (
    <div className="grid gap-y-2 lg:grid-cols-2">
      <div className="grid grid-cols-[min-content_min-content] gap-x-8 gap-y-1">
        <h1 className="font-bold text-base-500 uppercase text-xs col-span-2">With</h1>
        <QueryFragmentForm
          tables={tables}
          onValidate={(table, properties) => {
            const entity = toHex(uuid()) as Entity;

            if (properties) {
              QueryOptionsTable.set(
                {
                  ...emptyFragment,
                  withProperties: [{ table, properties }],
                },
                entity,
              );
            } else {
              QueryOptionsTable.set({ ...emptyFragment, with: [table] }, entity);
            }
          }}
        />
        {positiveFragments.length > 0 && (
          <div className="mt-2 grid grid-cols-[min-content_min-content_1fr_auto] gap-x-4 gap-y-1 col-span-2 min-w-[600px]">
            {positiveFragments.map((fragment, index) => (
              <QueryFragmentRow
                key={index}
                index={index}
                fragment={fragment}
                onRemove={() => QueryOptionsTable.remove(fragment.entity)}
              />
            ))}
          </div>
        )}
        <h1 className="font-bold text-base-500 uppercase text-xs col-span-2">Without</h1>
        <QueryFragmentForm
          tables={tables}
          label="without properties"
          onValidate={(table, properties) => {
            const entity = toHex(uuid()) as Entity;

            if (properties) {
              QueryOptionsTable.set(
                {
                  ...emptyFragment,
                  withoutProperties: [{ table, properties }],
                },
                entity,
              );
            } else {
              QueryOptionsTable.set({ ...emptyFragment, without: [table] }, entity);
            }
          }}
        />
        {negativeFragments.length > 0 && (
          <div className="mt-2 grid grid-cols-[min-content_min-content_1fr_auto] gap-x-4 gap-y-1 col-span-2 min-w-[600px]">
            {negativeFragments.map((fragment, index) => (
              <QueryFragmentRow
                key={index}
                index={index}
                fragment={fragment}
                onRemove={() => QueryOptionsTable.remove(fragment.entity)}
              />
            ))}
          </div>
        )}
        <span className="text-red-light text-xs">{error}</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-base-500 uppercase text-xs">Results </h1>
          <span className="text-base-300 text-xs">
            ({queryResult.length} {queryResult.length > 1 ? "entities" : "entity"})
          </span>
          <span className="flex-1" />
          <button
            className="border-none px-3 py-1 bg-purple text-base-50 hover:bg-purple-light font-semibold cursor-pointer"
            onClick={runQuery}
          >
            query
          </button>
        </div>
        <div className="grid grid-cols-[min-content_min-content_auto_1fr] gap-x-4 gap-y-1 max-h-96 overflow-auto">
          {queryResult.map((entity, index) => (
            <Fragment key={index}>
              <span className="font-mono text-base-700 text-xs">{index + 1}</span>
              <span className="font-mono text-xs">{entity}</span>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

const QueryFragmentForm = ({
  tables,
  onValidate,
  label,
}: {
  tables: Table[];
  onValidate: <table extends Table>(table: table, properties?: Properties<table["propertiesSchema"]>) => void;
  label?: string;
}) => {
  const [advanced, setAdvanced] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table>(tables[0]);
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | undefined>(undefined);

  return (
    <>
      <select
        className="border-none mb-1 px-3 py-1 bg-base-800 text-base-50 hover:bg-base-700 cursor-pointer"
        onChange={(e) => setSelectedTable(tables.find((table) => table.id === e.target.value) ?? tables[0])}
      >
        {tables.map((table) => (
          <option key={table.id} value={table.id}>
            {table.metadata.name}
          </option>
        ))}
      </select>
      <button
        className={twMerge(
          "border-none mb-1 px-3 py-1 cursor-pointer",
          advanced ? "bg-blue hover:bg-blue-light text-base-50" : "bg-base-800 hover:bg-base-700 text-base-300",
        )}
        onClick={() => setAdvanced(!advanced)}
      >
        {label ?? "with properties"}
      </button>
      {Object.keys(selectedTable.propertiesSchema).map((key) => (
        <Fragment key={key}>
          <span className={twMerge("font-mono text-xs", !advanced && "text-base-600")}>{key}</span>
          <input
            type="text"
            className={twMerge("border-none font-mono text-xs bg-base-800 text-base-50", !advanced && "bg-base-900")}
            disabled={!advanced}
            value={properties[key] ?? ""}
            onChange={(e) => setProperties({ ...properties, [key]: e.target.value })}
          />
        </Fragment>
      ))}
      <button
        className="col-span-2 border-none mt-2 px-3 py-1 bg-base-800 text-base-50 hover:bg-base-700 cursor-pointer"
        onClick={() => {
          try {
            const formattedProperties = advanced
              ? parseProperties(properties, selectedTable.propertiesSchema)
              : undefined;

            if (advanced && !Object.keys(formattedProperties ?? {}).length) {
              setError("You must provide at least one property.");
              return;
            }

            onValidate(selectedTable, formattedProperties);
            setError(undefined);
          } catch (err) {
            setError("Error parsing properties. Make sure the values are correct.");
            console.error("Error parsing properties. Make sure the values are correct.", err);
          }
        }}
      >
        + add condition
      </button>
      {!!error && <span className="text-red-light text-xs">{error}</span>}
    </>
  );
};

const QueryFragmentRow = ({
  index,
  fragment: { with: inside, withProperties, without: outside, withoutProperties },
  onRemove,
}: {
  index: number;
  fragment: Fragment;
  onRemove?: () => void;
}) => {
  const type = inside.length > 0 || withProperties.length > 0 ? "positive" : "negative";
  const statement = type === "positive" ? inside[0] ?? withProperties[0] : outside[0] ?? withoutProperties[0];
  const table = "table" in statement ? (statement.table as Table) : statement;
  const properties = "table" in statement ? statement.properties : undefined;

  return (
    <>
      <span className="font-mono text-base-700 text-xs">{index + 1}</span>
      <span className="font-mono text-xs">{table.metadata.name}</span>
      {properties ? (
        <span className="mx-4 font-mono text-xs">
          <span className="mr-4 font-semibold text-base-300">
            {type === "positive" ? "with properties" : "without properties"}
          </span>
          {Object.entries(properties).map(([key, value], index) => (
            <>
              <span className="text-base-300">{key}:</span> <span>{serialize(value)}</span>
              {index < Object.keys(properties).length - 1 ? ", " : ""}
            </>
          ))}
        </span>
      ) : (
        <span />
      )}
      <button
        className="pb-0.5 my-0 w-6 border-none text-mono bg-red text-base-50 hover:bg-red-light cursor-pointer"
        onClick={onRemove}
      >
        x
      </button>
    </>
  );
};
