import { createBurnerAccount, transportObserver } from "@latticexyz/common";
import { mudFoundry } from "@latticexyz/common/chains";
import {
  Account,
  Address,
  ClientConfig,
  GetContractReturnType,
  PublicClient,
  createPublicClient,
  createWalletClient,
  fallback,
  getContract,
  http,
  webSocket,
} from "viem";

import { NetworkConfig } from "@/types";
import worldsJson from "./contracts/worlds.json";
import IWorldAbi from "./contracts/out/IWorld.sol/IWorld.abi.json";

const worlds = worldsJson as Partial<Record<string, { address: Address; blockNumber?: number }>>;

export const getMockNetworkConfig = (): NetworkConfig & {
  publicClient: PublicClient;
  burnerAccount: Account;
  worldContract: GetContractReturnType<typeof IWorldAbi>;
} => {
  // Chain
  const chain = {
    ...mudFoundry,
    indexerUrl: "http://localhost:3001",
  };

  // World
  const worldAddress = worlds[chain.id]?.address;
  const initialBlockNumber = worlds[chain.id]?.blockNumber ?? 0;
  if (!worldAddress) {
    throw new Error(`No world address found for chain ${chain.name} (${chain.id})`);
  }

  // Public client
  const clientOptions = {
    chain,
    transport: transportObserver(fallback([webSocket(), http()])),
    pollingInterval: 1000,
  } as const satisfies ClientConfig;
  const publicClient = createPublicClient(clientOptions);

  // Account
  const burnerAccount = createBurnerAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

  // Contract
  const worldContract = getContract({
    address: worldAddress,
    abi: IWorldAbi,
    client: { public: publicClient, wallet: createWalletClient({ ...clientOptions, account: burnerAccount }) },
  });

  return {
    chainId: chain.id,
    chain,
    worldAddress,
    initialBlockNumber: BigInt(initialBlockNumber),
    indexerUrl: chain.indexerUrl,
    publicClient,
    burnerAccount,
    worldContract,
  };
};
