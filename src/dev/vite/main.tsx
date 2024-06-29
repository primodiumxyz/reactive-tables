import React, { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { createWrapper } from "@/createWrapper";
import mudConfig from "@test/contracts/mud.config";

import { createWalletClient, http } from "viem";
import { Observable } from "rxjs";
import { mudFoundry } from "@latticexyz/common/chains";
import { createLocalSyncTables, createSync, networkConfig } from "@test/utils";

const App = () => {
  useEffect(() => {
    let unmount: () => void | undefined;
    const open = async () => {
      // unmount = await createDevVisualizer({ tables });
      const { tables, tableDefs, storageAdapter, triggerUpdateStream, world } = createWrapper({
        mudConfig,
        devTools: {
          visualizer: true,
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

      // TODO(TEMP)
      const { mount: mountDevTools } = await import("@latticexyz/dev-tools");
      mountDevTools({
        config: mudConfig,
        publicClient: networkConfig.publicClient,
        walletClient: createWalletClient({ chain: mudFoundry, transport: http() }),
        latestBlock$: new Observable(),
        storedBlockLogs$: new Observable(),
        worldAddress: networkConfig.worldAddress,
        worldAbi: [],
        write$: new Observable(),
      });
    };

    open();
    return () => unmount?.();
  }, []);

  return null;
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <div className="App">
      <App />
    </div>
  </StrictMode>,
);
