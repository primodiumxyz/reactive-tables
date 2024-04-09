import { StorageAdapter } from "@latticexyz/store-sync";
import { Store } from "tinybase/store";

export const createStorageAdapter = ({ store }: { store: Store }): StorageAdapter => {
  return async () => {};
};
