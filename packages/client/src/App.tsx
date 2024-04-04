import { StrictMode, useEffect, useRef, useState } from "react";
import { createStore } from "tinybase";
import { Provider as StoreProvider, useCreateStore } from "tinybase/debug/ui-react";
import { StoreInspector, ValuesInHtmlTable } from "tinybase/debug/ui-react-dom";
import { Button } from "./Button";
import { MudProvider } from "./network/config/MudProvider";
import useSetupResult from "./hooks/useSetupResult";
import { world } from "./network/world";

export const App = () => {
  /* ----------------------------------- MUD ---------------------------------- */
  const setupResult = useSetupResult();
  const { network, components, playerAccount } = setupResult;
  const mounted = useRef<boolean>(false);

  useEffect(() => {
    if (!network || !playerAccount || mounted.current) return;
    // https://vitejs.dev/guide/env-and-mode.html
    if (import.meta.env.DEV) {
      import("@latticexyz/dev-tools").then(({ mount: mountDevTools }) =>
        mountDevTools({
          config: network.mudConfig,
          publicClient: playerAccount.publicClient,
          walletClient: playerAccount.walletClient,
          latestBlock$: network.latestBlock$,
          storedBlockLogs$: network.storedBlockLogs$,
          worldAddress: playerAccount.worldContract.address,
          worldAbi: playerAccount.worldContract.abi,
          write$: playerAccount.write$,
          recsWorld: world,
        })
      );
      mounted.current = true;
    }
  }, [network, playerAccount, mounted]);

  /* ---------------------------------- STORE --------------------------------- */
  const store = useCreateStore(() => {
    // Create the TinyBase Store and initialize the Store's data
    return createStore().setValue("counter", 0);
  });

  if (!network || !components || !playerAccount) return <div>Loading...</div>;

  return (
    <StrictMode>
      <MudProvider {...setupResult} components={components} network={network} playerAccount={playerAccount}>
        <StoreProvider store={store}>
          <Button />
          <div>
            <h2>Values</h2>
            <ValuesInHtmlTable />
          </div>
          <StoreInspector />
        </StoreProvider>
      </MudProvider>
    </StrictMode>
  );
};
