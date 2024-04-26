import { waitForTransactionReceipt } from "viem/actions";
import { Hex, TransactionReceipt } from "viem";

import { $Record } from "@/lib";

import { getNetworkConfig } from "@/__tests__/utils/getNetworkConfig";

const networkConfig = getNetworkConfig();

export type TableNames = (typeof mockFunctionToTable)[keyof typeof mockFunctionToTable];
const mockFunctionToTable = {
  move: "Position",
  increment: "Counter",
  storeItems: "Inventory",
} as const;

// We don't want to run everything with Promise.all because it will quickly cause an issue with Viem (transaction underpriced)
// This way it should at least reduce a bit the waiting time
export const fuzz = async (iterations: number) => {
  const allFunctionNames = Object.keys(mockFunctionToTable) as Array<keyof typeof mockFunctionToTable>;
  const tasks: Array<{ name: TableNames; task: () => Promise<TransactionReceipt> }> = [];
  // Remember function called - tx block number
  const txInfo = Object.entries(mockFunctionToTable).reduce(
    (acc, [, comp]) => {
      acc[comp] = BigInt(0);
      return acc;
    },
    {} as Record<TableNames, bigint>,
  );

  for (let i = 0; i < iterations; i++) {
    const rand = Math.floor(Math.random() * allFunctionNames.length);
    const functionName = allFunctionNames[rand];
    const randomFunction = mockFunctions[functionName];
    tasks.push({
      name: mockFunctionToTable[functionName],
      task: randomFunction,
    });

    if (tasks.length === 20 || i === iterations - 1) {
      const txReceipts = await Promise.all(tasks.map((task) => task.task()));
      const blockNumbers = txReceipts.map((tx) => tx.blockNumber);
      txReceipts.forEach((tx, index) => {
        if (blockNumbers[index] > txInfo[tasks[index].name as keyof typeof txInfo]) {
          txInfo[tasks[index].name as keyof typeof txInfo] = blockNumbers[index];
        }
      });

      tasks.length = 0;
    }
  }

  return txInfo;
};

// Test functions
export const mockFunctions = {
  // Update a record's position
  move: async () => {
    const hash = await networkConfig.worldContract.write.move([random(-100, 100), random(-100, 100)], {
      chain: networkConfig.chain,
      account: networkConfig.burnerAccount.address,
    });
    return await waitForTransactionReceipt(networkConfig.publicClient, { hash });
  },

  // Increment counter
  increment: async () => {
    const hash = await networkConfig.worldContract.write.increment({
      chain: networkConfig.chain,
      account: networkConfig.burnerAccount.address,
    });
    return await waitForTransactionReceipt(networkConfig.publicClient, { hash });
  },

  // Add elements to the inventory array
  storeItems: async () => {
    const hash = await networkConfig.worldContract.write.storeItems(
      [Array.from({ length: 5 }, () => random(1, 100)), Array.from({ length: 5 }, () => random(1, 100))],
      {
        chain: networkConfig.chain,
        account: networkConfig.burnerAccount.address,
      },
    );
    return await waitForTransactionReceipt(networkConfig.publicClient, { hash });
  },
};

// Set elements in the inventory array
export const setItems = async (args: { items: number[]; weights: number[]; totalWeight: bigint }) => {
  const { items, weights, totalWeight } = args;
  const hash = await networkConfig.worldContract.write.setItems([items, weights, totalWeight], {
    chain: networkConfig.chain,
    account: networkConfig.burnerAccount.address,
  });
  return await waitForTransactionReceipt(networkConfig.publicClient, { hash });
};

// Set the position of a record
export const setPositionFor$Record = async (args: { $record: $Record; x: number; y: number }) => {
  const { $record, x, y } = args;
  const hash = await networkConfig.worldContract.write.moveWithArbitraryKey([$record as Hex, x, y], {
    chain: networkConfig.chain,
    account: networkConfig.burnerAccount.address,
  });
  return await waitForTransactionReceipt(networkConfig.publicClient, { hash });
};

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const getRandomNumbers = (length?: number, min?: number, max?: number) =>
  Array.from({ length: length ?? 1 }, () => random(min ?? 1, max ?? 10000));
export const getRandomBigInts = (length?: number, min?: number, max?: number) =>
  getRandomNumbers(length, min, max).map((n) => BigInt(n));
