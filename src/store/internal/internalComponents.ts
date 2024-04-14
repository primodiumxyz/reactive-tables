import { Type } from "@latticexyz/recs";

import { createInternalComponent, createInternalNumberComponent } from "@/store/internal/createInternalComponent";

export type InternalComponentsTables = typeof internalComponentsTables;
export const internalComponentsTables = {
  SyncSource: createInternalNumberComponent({
    id: "SyncSource",
  }),
  SyncStatus: createInternalComponent(
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
};
