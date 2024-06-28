import React, { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
// import "./index.css";

import { createWrapper } from "@/createWrapper";
import { createDevVisualizer } from "@/lib/dev";
import mudConfig from "@test/contracts/mud.config";
import worlds from "@test/contracts/worlds.json";

import { createPublicClient, createWalletClient, Hex, http, padHex, toHex } from "viem";
import { Observable } from "rxjs";
import { mudFoundry } from "@latticexyz/common/chains";

const App = () => {
  const { tables } = createWrapper({ mudConfig });
  tables.Counter.properties;

  // TODO(TEMP)
  const getEntity = (index: number) => padHex(toHex(index));
  for (let i = 0; i < 100; i++) {
    tables.Inventory.set({ items: [1, 3, 5, 3, 3, 3, 3, 4, 5], weights: [i, 3], totalWeight: BigInt(4) }, getEntity(i));
  }
  const publicClient = createPublicClient({ chain: mudFoundry, transport: http(), pollingInterval: 1_000 });
  const worldAddress = (worlds[mudFoundry.id]?.["address"] ?? "0x") as Hex;

  useEffect(() => {
    let unmount: () => void | undefined;
    const open = async () => {
      // unmount = await createDevVisualizer({ tables });

      // TODO(TEMP)
      unmount = await createDevVisualizer({ tables, publicClient, worldAddress });
      const { mount: mountDevTools } = await import("@latticexyz/dev-tools");
      mountDevTools({
        config: mudConfig,
        publicClient: createPublicClient({ chain: mudFoundry, transport: http() }),
        walletClient: createWalletClient({ chain: mudFoundry, transport: http() }),
        latestBlock$: new Observable(),
        storedBlockLogs$: new Observable(),
        worldAddress: "0x123",
        worldAbi: [],
        write$: new Observable(),
      });
    };

    open();
    return () => unmount?.();
  }, [tables]);

  return null;
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <div className="App">
      <App />
    </div>
  </StrictMode>,
);
