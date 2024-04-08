import { mudFoundry } from "@latticexyz/common/chains";
import { Address } from "viem";

import worldsJson from "./contracts/worlds.json";
import { NetworkConfig } from "@/types";

const worlds = worldsJson as Partial<Record<string, { address: Address; blockNumber?: number }>>;

export const getMockNetworkConfig = (): NetworkConfig => {
  const chain = {
    ...mudFoundry,
    indexerUrl: "http://localhost:3001",
  };

  const worldAddress = worlds[chain.id]?.address;
  const initialBlockNumber = worlds[chain.id]?.blockNumber ?? 0;
  if (!worldAddress) {
    throw new Error(`No world address found for chain ${chain.name} (${chain.id})`);
  }

  return {
    chainId: chain.id,
    chain,
    worldAddress,
    initialBlockNumber: BigInt(initialBlockNumber),
    indexerUrl: chain.indexerUrl,
  };
};
