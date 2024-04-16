import { Entity, Schema } from "@latticexyz/recs";
import { Queries } from "tinybase/queries";

import { TinyBaseAdapter } from "@/adapter";
import { ComponentValue } from "./types";

// Query all entities for a given table that have a specific value (or partial value)
export const queryAllWithValue = <S extends Schema>(
  queries: Queries,
  tableId: string,
  value: Partial<ComponentValue<S>>,
): Entity[] => {
  console.log(queries);
  // Format the value for TinyBase storage to compare it with the stored values
  const formattedValue = TinyBaseAdapter.format(Object.keys(value), Object.values(value));

  queries.setQueryDefinition("queryAllWithValue", tableId, ({ select, where }) => {
    // For each given value
    Object.keys(value).forEach((key) => {
      // select the cell with this value as a key
      select(key);
      // where it should be equal to the given value (formatted)
      where(key, formattedValue[key]);
    });
  });

  let entities: Entity[] = [];
  // Retrieve all ids of the rows matching the query (entities)
  queries.forEachResultRow("queryAllWithValue", (rowId) => entities.push(rowId));
  queries.delQueryDefinition("queryAllWithValue");

  return entities;
};

// Query all entities for a given table that DON'T have a specific value (or partial value)
export const queryAllWithoutValue = <S extends Schema>(
  queries: Queries,
  tableId: string,
  value: Partial<ComponentValue<S>>,
): Entity[] => {
  // Format the value for TinyBase storage to compare it with the stored values
  const formattedValue = TinyBaseAdapter.format(Object.keys(value), Object.values(value));

  queries.setQueryDefinition("queryAllWithoutValue", tableId, ({ select, where }) => {
    // We need to make one select for the row to be included
    // It should in any case contain any of the keys if the entity is in the table
    // So we select the first key (all entities)
    select(Object.keys(value)[0]);

    // Where at least one of the values is different
    where((getCell) => Object.entries(value).some(([key, value]) => getCell(key) !== value));
  });

  let entities: Entity[] = [];
  // Retrieve all ids of the rows matching the query (entities)
  queries.forEachResultRow("queryAllWithoutValue", (rowId) => entities.push(rowId));
  queries.delQueryDefinition("queryAllWithoutValue");

  return entities;
};
