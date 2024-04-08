import { StorageAdapter } from "@latticexyz/store-sync";
import { Write } from "@primodiumxyz/sync-stack";

export const createCustomWriter = ({ storageAdapter }: { storageAdapter: StorageAdapter }) => {
  // TODO: use storage adapter to write to storage
  return Write.toCustom({
    set: (log) => {},
    updateStatic: (log) => {},
    updateDynamic: (log) => {},
    delete: (log) => {},
  });
};
