import React, { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { createWrapper } from "@/createWrapper";
import mudConfig from "@test/contracts/mud.config";
import { createLocalSyncTables, createSync, networkConfig } from "@test/utils";

const App = () => {
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

  return <div className="w-full h-full"></div>;
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <div className="App">
      <App />
    </div>
  </StrictMode>,
);
