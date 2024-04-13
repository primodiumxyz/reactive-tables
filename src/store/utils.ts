import { Store as StoreConfig } from "@latticexyz/store";
import { Store } from "tinybase/store";

import { ComponentTable } from "@/store/component/types";
import { Table } from "@latticexyz/store/internal";

// Format component's table so it can fit TinyBase tabular data structure
// We want this to be able to access a component efficiently using TinyBase, instead of mapping through all components
export const setComponentTable = <table extends Table, config extends StoreConfig>(
  store: Store,
  componentTable: ComponentTable<table, config>,
) => {
  store.setTable(`table__${componentTable.id}`, {
    schema: componentTable.schema,
    metadata: {
      id: componentTable.id,
      componentName: componentTable.metadata.componentName,
      tableName: componentTable.metadata.tableName,
    },
    keySchema: componentTable.metadata.keySchema,
    valueSchema: componentTable.metadata.valueSchema,
  });
};

// Retrieve a component's table from TinyBase in the RECS compatible Component format
// This won't include values, as those are stored in their own table (at `componentTable.id`)
export const getComponentTable = <table extends Table, config extends StoreConfig>(
  store: Store,
  tableId: string,
): ComponentTable<table, config> => {
  const table = store.getTable(`table__${tableId}`);
  if (!table) throw new Error(`Table with id ${tableId} not found`);

  return {
    id: table.metadata.id as ComponentTable<table, config>["id"],
    schema: table.schema as ComponentTable<table, config>["schema"],
    metadata: {
      componentName: table.metadata.componentName as ComponentTable<table, config>["metadata"]["componentName"],
      tableName: table.metadata.tableName as ComponentTable<table, config>["metadata"]["tableName"],
      keySchema: table.keySchema as ComponentTable<table, config>["metadata"]["keySchema"],
      valueSchema: table.valueSchema as ComponentTable<table, config>["metadata"]["valueSchema"],
    },
  };
};
