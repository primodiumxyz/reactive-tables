import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { MockNetworkConfig } from "./init";
import { WriteContractParameters } from "viem";

import IWorldAbi from "@/__tests__/mocks/contracts/out/IWorld.sol/IWorld.abi.json";

export const fuzz = async (networkConfig: MockNetworkConfig, iterations: number) => {
  await Promise.all(
    Array.from({ length: iterations }, async () => {
      const randomFunction = Object.values(mockFunctions)[random(0, Object.values(mockFunctions).length - 1)];
      await randomFunction(networkConfig);
    }),
  );
};

// Call a test function
export const callContractWithArgs = async <
  abi extends typeof IWorldAbi,
  contractParams extends WriteContractParameters<abi>,
>(
  networkConfig: MockNetworkConfig,
  functionName: contractParams["functionName"],
  args: contractParams["args"],
): Promise<void> => {
  const txHash = await writeContract(networkConfig.publicClient, {
    ...networkConfig.worldContract,
    chain: networkConfig.chain,
    account: networkConfig.burnerAccount.address,
    // TODO: fix types
    functionName,
    args,
  });
  await waitForTransactionReceipt(networkConfig.publicClient, { hash: txHash });
};

// Test functions
const mockFunctions = {
  // Update an entity's position
  move: async (networkConfig: MockNetworkConfig) => {
    await callContractWithArgs(networkConfig, "move", [random(-100, 100), random(-100, 100)]);
  },

  // Increment the counter
  increment: async (networkConfig: MockNetworkConfig) => {
    await callContractWithArgs(networkConfig, "increment", []);
  },

  // Add elements to the inventory array
  storeItems: async (networkConfig: MockNetworkConfig) => {
    await callContractWithArgs(networkConfig, "storeItems", [
      Array.from({ length: 5 }, () => random(1, 100)),
      Array.from({ length: 5 }, () => random(1, 100)),
    ]);
  },
};

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
