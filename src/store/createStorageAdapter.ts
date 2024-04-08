import { ComponentStore } from "@/types";
import { StorageAdapter } from "@latticexyz/store-sync";

export const createStorageAdapter = ({ store }: { store: ComponentStore }): StorageAdapter => {
  return async () => {};
};
