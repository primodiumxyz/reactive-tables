import { Type } from "@latticexyz/recs";
import { Store } from "tinybase/store";

import { createInternalComponent, createInternalNumberComponent } from "@/store/internal/";

export type InternalComponents = ReturnType<typeof createInternalComponents>;
export const createInternalComponents = (store: Store) => ({
  SyncSource: createInternalNumberComponent(store, {
    id: "SyncSource",
  }),
  SyncStatus: createInternalComponent(
    store,
    {
      step: Type.Number,
      message: Type.String,
      progress: Type.Number,
      lastBlockNumberProcessed: Type.BigInt,
    },
    {
      id: "SyncStatus",
    },
  ),
});
