import React, { useEffect } from "react";

import { createWrapper } from "@/createWrapper";
import mudConfig from "@test/contracts/mud.config";
import { createLocalSyncTables, createSync, networkConfig } from "@test/utils";

export const App = () => {
  useEffect(() => {
    let unmount: () => void | undefined;
    const open = async () => {
      const { tables, tableDefs, storageAdapter, triggerUpdateStream, world } = createWrapper({
        mudConfig,
        devTools: {
          enabled: true,
          publicClient: networkConfig.publicClient,
          worldAddress: networkConfig.worldAddress,
        },
      });

      const sync = createSync({
        contractTables: tables,
        localTables: createLocalSyncTables(world),
        tableDefs,
        storageAdapter,
        triggerUpdateStream,
        networkConfig,
      });
      sync.start();
      world.registerDisposer(sync.unsubscribe);
    };

    open();
    return () => unmount?.();
  }, []);

  return <></>;
};
