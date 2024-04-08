import { Tables } from "@latticexyz/store/internal";
import { createStore as createTinyBaseStore } from "tinybase/store";

import { ComponentStore } from "@/types";

export const createStore = <T extends Tables>({ tables }: { tables: T }): ComponentStore => {
  return createTinyBaseStore();
};
