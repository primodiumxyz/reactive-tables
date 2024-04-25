import { queryAllMatching, QueryAllMatchingOptions } from "@/queries/templates/queryAllMatching";
import { getPropsAndTypeFromRowChange, TableQueryCallbacks, TableQueryUpdate, UpdateType } from "@/queries/createQuery";
import { ContractTableDef, $Record, Schema, TinyBaseStore } from "@/lib";

// Listen to all records matching multiple conditions across tables
// Alternative to `query` (fetch once) and `useQuery` (hook)
export const createGlobalQuery = <tableDefs extends ContractTableDef[], S extends Schema, T = unknown>(
  store: TinyBaseStore,
  queryOptions: QueryAllMatchingOptions<tableDefs, T>,
  { onChange, onEnter, onExit, onUpdate }: TableQueryCallbacks<S, T>,
  options: { runOnInit?: boolean } = { runOnInit: true },
) => {
  if (!onChange && !onEnter && !onExit && !onUpdate) {
    throw new Error("At least one callback has to be provided");
  }

  // Remember previous records (to provide the update type in the callback)
  let prev$Records: $Record[] = [];

  // Gather ids and schemas of all table we need to listen to
  // tableId => schema keys
  const tables: Record<string, string[]> = {};
  const { inside, notInside, with: withProps, without: withoutProps } = queryOptions;

  (inside ?? []).concat(notInside ?? []).forEach((table) => {
    tables[table.id] = Object.keys(table.schema);
  });
  (withProps ?? []).concat(withoutProps ?? []).forEach(({ table }) => {
    tables[table.id] = Object.keys(table.schema);
  });

  // Listen to all tables (at each row)
  const listenerId = store.addRowListener(null, null, (_, tableId, rowId, getCellChange) => {
    if (!getCellChange) return;
    const $record = rowId as $Record;

    // Refetch matching records if one of the tables included in the query changes
    if (Object.keys(tables).includes(tableId)) {
      const matching$Records = queryAllMatching(store, queryOptions);

      // Figure out if it's an enter or an exit
      let type = "change" as UpdateType;
      const inPrev = prev$Records.includes($record);
      const inCurrent = matching$Records.includes($record);

      if (!inPrev && !inCurrent) return; // not in the query, we're not interested

      // Gather the previous and current properties
      const args = getPropsAndTypeFromRowChange(getCellChange, tables[tableId], tableId, $record) as TableQueryUpdate<
        S,
        T
      >;

      // Run the callbacks
      if (!inPrev && inCurrent) {
        type = "enter";
        onEnter?.({ ...args, type });

        prev$Records.push($record);
      } else if (inPrev && !inCurrent) {
        type = "exit";
        onExit?.({ ...args, type });

        prev$Records = prev$Records.filter((e) => e !== $record);
      } else {
        onUpdate?.({ ...args, type });
      }

      onChange?.({ ...args, type });
    }
  });

  if (options.runOnInit) {
    const matching$Records = queryAllMatching(store, queryOptions);

    // Run callbacks for all records in the query
    matching$Records.forEach(($record) => {
      const args = {
        tableId: undefined,
        $record,
        properties: { current: undefined, prev: undefined },
        type: "enter" as UpdateType,
      };
      onEnter?.(args);
      onChange?.(args);

      prev$Records.push($record);
    });
  }

  return {
    unsubscribe: () => store.delListener(listenerId),
  };
};
