import { transportObserver } from "@latticexyz/common";
import mudConfig from "contracts/mud.config";
import { Hex, createPublicClient, fallback, http } from "viem";
import { getNetworkConfig } from "../config/getNetworkConfig";
import { world } from "../world";
import { setupRecs } from "./setupRecs";

export async function createNetwork() {
  const networkConfig = getNetworkConfig();
  const clientOptions = {
    chain: networkConfig.chain,
    transport: transportObserver(fallback([http()])),
    pollingInterval: 1000,
  };

  const publicClient = createPublicClient(clientOptions);

  const { components, latestBlock$, latestBlockNumber$, tables, storedBlockLogs$, waitForTransaction } = setupRecs({
    mudConfig,
    world,
    publicClient,
    address: networkConfig.worldAddress as Hex,
  });

  const network = {
    world,
    tables,
    publicClient,
    mudConfig,
    components,
    latestBlock$,
    latestBlockNumber$,
    storedBlockLogs$,
    waitForTransaction,
  };

  return network;
}
