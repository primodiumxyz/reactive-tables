import { waitForTransactionReceipt } from "viem/actions";
import { ContractFunctionArgs, ContractFunctionName, Hex, encodeFunctionData } from "viem";

import { $Record, ContractTable } from "@/index";

import { networkConfig } from "@/__tests__/utils/networkConfig";
import { resourceToHex } from "@latticexyz/common";
const IWorldAbi = networkConfig.worldContract.abi;

// Call a bunch of random functions with semirandom args related to provided tables
export const fuzz = async (iterations: number, tables: ContractTable[]) => {
  // Select functions related to provided tables
  const functions = Object.entries(mockFunctions).filter(([name]) =>
    tables.map((table) => table.metadata.name).includes(name),
  );

  // Select random functions to call `iterations` times
  const encodedCalls = Array.from({ length: iterations }, () => {
    // Select random function and find the related table
    const [name, { functionName, args }] = functions[Math.floor(Math.random() * functions.length)];
    const table = tables.find((table) => table.metadata.name === name);
    const namespace = table?.metadata.globalName.split("__")[0] ?? "";

    // Encode function call
    const callData = encodeFunctionData<typeof IWorldAbi>({
      abi: IWorldAbi,
      functionName: functionName as ContractFunctionName<typeof IWorldAbi>,
      args: args as ContractFunctionArgs<typeof IWorldAbi>,
    });

    return {
      systemId: resourceToHex({ type: "system", name: "TestSystem", namespace }),
      callData,
    };
  });

  // Batch call all txs
  const hash = await networkConfig.worldContract.write.batchCall([encodedCalls], {
    account: networkConfig.burnerAccount.address,
    chain: networkConfig.chain,
  });

  return await waitForTransactionReceipt(networkConfig.publicClient, { hash });
};

const random = (min?: number, max?: number) =>
  Math.floor(Math.random() * ((max ?? 1000000000) - (min ?? 1) + 1)) + (min ?? 1);

export const getRandomNumbers = (length?: number, min?: number, max?: number) =>
  Array.from({ length: length ?? 1 }, () => random(min, max));
export const getRandomBigInts = (length?: number, min?: number, max?: number) =>
  getRandomNumbers(length, min, max).map((n) => BigInt(n));

// Test functions (name & args)
export const mockFunctions = {
  // Update a record's position
  Position: { functionName: "move", args: [random(-1000000000), random(-1000000000)] },
  // Increment counter
  Counter: { functionName: "increment", args: [] },
  // Add elements to the inventory array
  Inventory: { functionName: "storeItems", args: [getRandomNumbers(5), getRandomNumbers(5)] },
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
