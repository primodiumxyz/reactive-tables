import { Entity, Schema } from "@latticexyz/recs";
import { Queries } from "tinybase/queries";

import { useEffect, useMemo, useState } from "react";

import { TinyBaseAdapter, TinyBaseFormattedType } from "@/adapter";
import { ComponentValue } from "@/store/component/types";

/* -------------------------------------------------------------------------- */
/*                                   QUERIES                                  */
/* -------------------------------------------------------------------------- */

type QueryOptions = {
  queries: Queries;
  tableId: string;
  value: Partial<ComponentValue<Schema>>;
  formattedValue?: TinyBaseFormattedType;
};

type QueryResult = {
  id: string;
  entities: Entity[];
};

/* ---------------------------- queryAllWithValue --------------------------- */
// Query all entities for a given table that have a specific value (or partial value)
export const queryAllWithValue = <S extends Schema>({
  queries,
  tableId,
  value,
  formattedValue,
}: QueryOptions): QueryResult => {
  const queryId = "internal__queryAllWithValue";

  // Format the value for TinyBase storage to compare it with the stored values
  formattedValue = formattedValue ?? TinyBaseAdapter.format(Object.keys(value), Object.values(value));

  queries.setQueryDefinition(queryId, tableId, ({ select, where }) => {
    // Select the first cell as all entities with a value should have this cell
    select(Object.keys(value)[0]);

    // Keep entities which for each given key in the value
    Object.keys(value).forEach((key) => {
      // has an equal value in the table (where behaves like an AND operator for each key)
      where(key, formattedValue[key]);
    });
  });

  let entities: Entity[] = [];
  // Retrieve all ids of the rows matching the query (entities)
  queries.forEachResultRow(queryId, (rowId) => entities.push(rowId));
  // queries.delQueryDefinition("queryAllWithValue");

  return { id: queryId, entities };
};

/* -------------------------- queryAllWithoutValue -------------------------- */
// Query all entities for a given table that DON'T have a specific value (or partial value)
export const queryAllWithoutValue = <S extends Schema>({
  queries,
  tableId,
  value,
  formattedValue,
}: QueryOptions): QueryResult => {
  const queryId = "internal__queryAllWithoutValue";

  // Format the value for TinyBase storage to compare it with the stored values
  formattedValue = formattedValue ?? TinyBaseAdapter.format(Object.keys(value), Object.values(value));

  queries.setQueryDefinition(queryId, tableId, ({ select, where }) => {
    // We need to make one select for the row to be included
    // It should in any case contain any of the keys if the entity is in the table
    // So we select the first key (all entities)
    select(Object.keys(value)[0]);

    // Where at least one of the values is different
    where((getCell) => Object.keys(value).some((key) => getCell(key) !== formattedValue[key]));
  });

  let entities: Entity[] = [];
  // Retrieve all ids of the rows matching the query (entities)
  queries.forEachResultRow(queryId, (rowId) => entities.push(rowId));
  // queries.delQueryDefinition("queryAllWithoutValue");

  return { id: queryId, entities };
};

/* -------------------------------------------------------------------------- */
/*                                    HOOKS                                   */
/* -------------------------------------------------------------------------- */

/* -------------------------------- useAllWithValue --------------------------- */
// Listen to all entities inside a given table that have a specific value (or partial value)
export const useAllWithValue = <S extends Schema>(
  queries: Queries,
  tableId: string,
  value: Partial<ComponentValue<S>>,
): Entity[] => {
  // Format the value for TinyBase storage to compare it with the stored values
  const formattedValue = useMemo(() => TinyBaseAdapter.format(Object.keys(value), Object.values(value)), [value]);
  const [entities, setEntities] = useState<Entity[]>([]);

  useEffect(() => {
    // Get the id and perform the initial query
    const { id, entities } = queryAllWithValue({ queries, tableId, value, formattedValue });
    setEntities(entities);

    // Setup the listener for the query
    const listenerId = queries.addResultRowIdsListener(id, () => {
      // Update with the entities that match the query
      setEntities(queries.getResultRowIds(id) as Entity[]);
    });

    return () => {
      queries.delListener(listenerId);
    };
  }, [queries, formattedValue]);

  return entities;
};

/* ------------------------------ useAllWithoutValue -------------------------- */
// Listen to all entities inside a given table that DON'T have a specific value (or partial value)
export const useAllWithoutValue = <S extends Schema>(
  queries: Queries,
  tableId: string,
  value: Partial<ComponentValue<S>>,
): Entity[] => {
  // Format the value for TinyBase storage to compare it with the stored values
  const formattedValue = useMemo(() => TinyBaseAdapter.format(Object.keys(value), Object.values(value)), [value]);
  const [entities, setEntities] = useState<Entity[]>([]);

  useEffect(() => {
    // Get the id and perform the initial query
    const { id, entities } = queryAllWithoutValue({ queries, tableId, value, formattedValue });
    setEntities(entities);

    // Setup the listener for the query
    const listenerId = queries.addResultRowIdsListener(id, () => {
      // Update with the entities that match the query
      setEntities(queries.getResultRowIds(id) as Entity[]);
    });

    return () => {
      queries.delListener(listenerId);
    };
  }, [queries, formattedValue]);

  return entities;
};
