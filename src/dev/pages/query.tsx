import React, { Fragment, useCallback, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { toHex } from "viem";

import { query } from "@/queries/query";
import type { QueryOptions } from "@/queries/types";
import type { Table } from "@/tables/types";
import type { Entity } from "@/lib/external/mud/entity";
import { useDeepMemo } from "@/lib/external/mud/queries";
import type { Properties } from "@/lib/external/mud/schema";
import { uuid } from "@/lib/external/uuid";
import { Title } from "@/dev/components";
import { useDevTools } from "@/dev/lib/context";
import { QueryOptionsTable } from "@/dev/lib/store";
import { parseProperties, serialize } from "@/dev/lib/utils";

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
      <div className="grid gap-x-8 gap-y-1" style={{ gridTemplateColumns: "min-content min-content" }}>
        <Title className="col-span-2">With</Title>
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
          <div
            className="mt-2 grid gap-x-4 gap-y-1 col-span-2 min-w-[600px]"
            style={{ gridTemplateColumns: "min-content min-content 1fr auto" }}
          >
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
        <Title className="col-span-2">Without</Title>
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
          <div
            className="mt-2 grid gap-x-4 gap-y-1 col-span-2 min-w-[600px]"
            style={{ gridTemplateColumns: "min-content min-content 1fr auto" }}
          >
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
          <Title>Results </Title>
          <span className="text-base-300 text-xs">
            ({queryResult.length} {queryResult.length > 1 ? "entities" : "entity"})
          </span>
          <span className="flex-1" />
          <button
            className="h-6 px-3 py-0 border-none bg-base-200 text-base-950 hover:bg-base-100 font-semibold text-sm cursor-pointer"
            onClick={runQuery}
          >
            query
          </button>
        </div>
        <div
          className="grid gap-x-4 gap-y-1 max-h-96 overflow-auto"
          style={{ gridTemplateColumns: "min-content min-content auto 1fr" }}
        >
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
        className="border-none h-6 mb-1 px-3 py-0 bg-base-800 text-base-50 hover:bg-base-700 text-sm cursor-pointer"
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
          "h-6 mb-1 px-3 py-0 border-none text-sm cursor-pointer",
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
            className={twMerge(
              "min-w-[350px] border-none font-mono text-xs bg-base-800 text-base-50",
              !advanced && "bg-base-900",
            )}
            disabled={!advanced}
            value={properties[key] ?? ""}
            onChange={(e) => setProperties({ ...properties, [key]: e.target.value })}
          />
        </Fragment>
      ))}
      <button
        className="col-span-2 h-6 mt-2 px-3 py-0 border-none bg-base-800 text-base-50 hover:bg-base-700 text-sm cursor-pointer"
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
  fragment: { with: _with, withProperties, without, withoutProperties },
  onRemove,
}: {
  index: number;
  fragment: Fragment;
  onRemove?: () => void;
}) => {
  const type = _with.length > 0 || withProperties.length > 0 ? "positive" : "negative";
  const statement = type === "positive" ? _with[0] ?? withProperties[0] : without[0] ?? withoutProperties[0];
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
