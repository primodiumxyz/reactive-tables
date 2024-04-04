import { minEth } from "@game/constants";

import { createBurnerAccount as createMudBurnerAccount, transportObserver } from "@latticexyz/common";
import { createClient as createFaucetClient } from "@latticexyz/faucet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getNetworkConfig } from "src/network/config/getNetworkConfig";
import { createBurnerAccount } from "src/network/setup/createBurnerAccount";
import { setup } from "src/network/setup/setup";
// import { hydratePlayerData } from "src/network/sync/indexer";
import { BurnerAccount, SetupResult } from "src/network/types";
import { Hex, createWalletClient, fallback, formatEther, http } from "viem";

const externalPKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as Hex;

const useSetupResult = () => {
  const [network, setNetwork] = useState<SetupResult>(); // Created once when the site loads
  const [playerAccount, setPlayerAccount] = useState<BurnerAccount>(); // Created when the player logs in

  const { externalWalletClient, faucet } = useMemo(() => {
    const networkConfig = getNetworkConfig();
    const faucet = networkConfig.faucetServiceUrl
      ? createFaucetClient({ url: networkConfig.faucetServiceUrl })
      : undefined;

    const externalWalletClient = externalPKey
      ? createWalletClient({
          chain: networkConfig.chain,
          transport: transportObserver(fallback([http()])),
          pollingInterval: 1000,
          account: createMudBurnerAccount(externalPKey),
        })
      : undefined;
    return { faucet, externalWalletClient };
  }, []);

  const requestDrip = useCallback(
    async (address: Hex) => {
      const publicClient = network?.network.publicClient;
      if (!publicClient) return;
      if (faucet) {
        let balance = await publicClient.getBalance({ address });
        const lowBalance = balance < minEth;
        if (lowBalance) {
          console.log("[Faucet] balance:", formatEther(balance));
          console.info(`[Faucet] Balance is less than ${formatEther(minEth)}, dripping funds`);
          await faucet.drip.mutate({ address: address });
          balance = await publicClient.getBalance({ address });
          console.info(`[Faucet] New balance: ${formatEther(balance)} ETH`);
        }
      } else if (externalWalletClient) {
        const balance = await publicClient.getBalance({ address });
        const lowBalance = balance < minEth;
        if (!lowBalance) return;
        console.log("[Dev Drip] balance:", formatEther(balance));
        const amountToDrip = 69n * 10n ** 18n;
        await externalWalletClient.sendTransaction({ to: address, value: amountToDrip });
        console.info(`[Dev Drip] Dripped ${formatEther(amountToDrip)} to ${address}`);
      }
    },
    [externalWalletClient, faucet, network?.network.publicClient]
  );

  const getPlayerAccount = useCallback(async () => {
    const account = await createBurnerAccount(externalPKey, false);
    requestDrip(account.address);
    setPlayerAccount(account);
  }, [requestDrip]);

  useEffect(() => {
    getPlayerAccount().then(() => setup().then((network) => setNetwork(network)));
  }, [getPlayerAccount]);

  return {
    network: network?.network,
    components: network?.components,
    playerAccount,
  };
};

export default useSetupResult;
