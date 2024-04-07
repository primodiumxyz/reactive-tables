import { Write } from "@primodiumxyz/sync-stack";

export const createCustomWriter = () => {
  return Write.toCustom({
    set: (log) => {},
    updateStatic: (log) => {},
    updateDynamic: (log) => {},
    delete: (log) => {},
  });
};
