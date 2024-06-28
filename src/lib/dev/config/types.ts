import type { ContractTable, Table, Tables } from "@/tables/types";
import type { Hex, PublicClient } from "viem";

export type VisualizerOptions<tables extends Tables> = {
  tables: {
    [key in keyof tables]: tables[key] extends ContractTable<infer tableDef>
      ? ContractTable<tableDef>
      : tables[key] extends Table<infer PS, infer M, infer T>
        ? Table<PS, M, T>
        : never;
  };
  publicClient?: PublicClient;
  worldAddress?: Hex;
};
