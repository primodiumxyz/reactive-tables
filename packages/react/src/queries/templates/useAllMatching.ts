import { useEffect, useMemo, useRef, useState } from "react";

import { queryAllMatching, QueryAllMatchingOptions } from "@/queries/templates/queryAllMatching";
import { getPropsAndTypeFromRowChange, TableQueryCallbacks, TableQueryUpdate, UpdateType } from "@/queries/createQuery";
import { ContractTableDef, $Record, Schema, TinyBaseStore } from "@/lib";

// Listen to all $records matching multiple conditions across tables
// TODO: this will clearly need to be optimized; there are probably a few options:
// - setup a table listener by default on each table, then when setting up a query listener let that table know so it adds this callback to its array
// - keep a single useAllMatching listening to all tables, then on change see across all actual useQuery hooks which ones need to be triggered
// This won't be trigerred on creation for all initial matching $records, but only on change after the hook is mounted
// TODO: maybe this hook doesn't need any callback, as we already have createGlobalQuery for that?
export const useAllMatching = <tableDefs extends ContractTableDef[], S extends Schema, T = unknown>(
  store: TinyBaseStore,
  options: QueryAllMatchingOptions<tableDefs, T>,
  { onChange, onEnter, onExit, onUpdate }: TableQueryCallbacks<S, T>,
): $Record[] => {
  const [$records, set$Records] = useState<$Record[]>([]);
  // Create a ref for previous records (to provide the update type in the callback)
  const prev$Records = useRef<$Record[]>([]);

  // Gather ids and schemas of all table we need to listen to
  // tableId => schema keys
  const tables = useMemo(() => {
    const { inside, notInside, with: withProps, without: withoutProps } = options;
    const tables: Record<string, string[]> = {};

    (inside ?? []).concat(notInside ?? []).forEach((table) => {
      tables[table.id] = Object.keys(table.schema);
    });
    (withProps ?? []).concat(withoutProps ?? []).forEach(({ table }) => {
      tables[table.id] = Object.keys(table.schema);
    });

    return tables;
  }, [options]);

  useEffect(() => {
    // Initial query
    const curr$Records = queryAllMatching(store, options);
    set$Records(curr$Records);
    prev$Records.current = curr$Records;

    // Listen to all tables (at each row)
    const listenerId = store.addRowListener(null, null, (_, tableId, $recordKey, getCellChange) => {
      if (!getCellChange) return;
      const $record = $recordKey as $Record;

      // Refetch matching $records if one of the tables included in the query changes
      if (Object.keys(tables).includes(tableId)) {
        const new$Records = queryAllMatching(store, options);

        // Figure out if it's an enter or an exit
        let type = "change" as UpdateType;
        const inPrev = prev$Records.current.includes($record);
        const inCurrent = new$Records.includes($record);

        // Gather the previous and current properties
        const args = getPropsAndTypeFromRowChange(getCellChange, tables[tableId], tableId, $record) as TableQueryUpdate<
          S,
          T
        >;

        // Run the callbacks
        if (!inPrev && inCurrent) {
          type = "enter";
          onEnter?.({ ...args, type });
        } else if (inPrev && !inCurrent) {
          type = "exit";
          onExit?.({ ...args, type });
        } else {
          onUpdate?.({ ...args, type });
        }

        onChange?.({ ...args, type });

        // Update ref and state
        set$Records(new$Records);
        prev$Records.current = new$Records;
      }
    });

    return () => {
      store.delListener(listenerId);
    };
  }, [store /* tableIds */]); // TODO: tests get stuck with this, not sure why; but we shouldn't give some mutable options anyway afaik?

  return $records;
};
