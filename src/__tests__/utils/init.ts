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
import worldsJson from "@/__tests__/mocks/contracts/worlds.json";
import IWorldAbi from "@/__tests__/mocks/contracts/out/IWorld.sol/IWorld.abi.json";

const worlds = worldsJson as Partial<Record<string, { address: Address; blockNumber?: number }>>;

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
const publicClient: PublicClient = createPublicClient(clientOptions);

// Account
const burnerAccount = createBurnerAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

// Contract
const worldContract: GetContractReturnType<typeof IWorldAbi, typeof publicClient> = getContract({
  address: worldAddress,
  abi: IWorldAbi,
  client: { public: publicClient, wallet: createWalletClient({ ...clientOptions, account: burnerAccount }) },
});

export type MockNetworkConfig = ReturnType<typeof getMockNetworkConfig>;

export const getMockNetworkConfig = (): NetworkConfig & {
  publicClient: PublicClient;
  burnerAccount: Account;
  worldContract: GetContractReturnType<typeof IWorldAbi, typeof publicClient>;
} => ({
  chainId: chain.id,
  chain,
  worldAddress,
  initialBlockNumber: BigInt(initialBlockNumber),
  indexerUrl: chain.indexerUrl,
  publicClient,
  burnerAccount,
  worldContract,
});
