import { getBurnerPrivateKey } from "@latticexyz/common";
import worldsJson from "contracts/worlds.json";
import { chainConfigs } from "./chainConfigs";

const params = new URLSearchParams(window.location.search);

const worlds = worldsJson as Partial<Record<string, { address: string; blockNumber?: number }>>;

export const getNetworkConfig = () => {
  const chainId = params.get("chainid") || import.meta.env.PRI_CHAIN_ID || "dev";

  const chain = chainConfigs[chainId];

  const world = worlds[chain.id];
  const worldAddress = params.get("worldAddress") || world?.address;
  if (!worldAddress) {
    throw new Error(`No world address found for chain ${chainId}. `);
  }
  const initialBlockNumber = params.has("initialBlockNumber")
    ? Number(params.get("initialBlockNumber"))
    : world?.blockNumber ?? 0;

  return {
    privateKey: getBurnerPrivateKey(),
    chainId,
    chain,
    faucetServiceUrl: params.get("faucet") ?? chain.faucetUrl,
    worldAddress,
    initialBlockNumber: BigInt(initialBlockNumber),
    indexerUrl: chain.indexerUrl,
  };
};
