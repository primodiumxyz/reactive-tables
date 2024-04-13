import { waitForTransactionReceipt } from "viem/actions";
import { getMockNetworkConfig } from "./init";

const networkConfig = getMockNetworkConfig();

// We don't want to run everything with Promise.all because it will quickly cause an issue with Viem (transaction underpriced)
// This way it should at least reduce a bit the waiting time
export const fuzz = async (iterations: number) => {
  const allFunctions = Object.values(mockFunctions);
  const tasks = [];

  for (let i = 0; i < iterations; i++) {
    const randomFunction = allFunctions[random(0, allFunctions.length - 1)];
    tasks.push(randomFunction());

    if (tasks.length === 20 || i === iterations - 1) {
      await Promise.all(tasks);
      tasks.length = 0;
    }
  }
};

// Test functions
export const mockFunctions = {
  // Update an entity's position
  move: async () => {
    const hash = await networkConfig.worldContract.write.move([random(-100, 100), random(-100, 100)], {
      chain: networkConfig.chain,
      account: networkConfig.burnerAccount.address,
    });
    await waitForTransactionReceipt(networkConfig.publicClient, { hash });
  },

  // Increment the counter
  increment: async () => {
    const hash = await networkConfig.worldContract.write.increment({
      chain: networkConfig.chain,
      account: networkConfig.burnerAccount.address,
    });
    await waitForTransactionReceipt(networkConfig.publicClient, { hash });
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
    await waitForTransactionReceipt(networkConfig.publicClient, { hash });
  },
};

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
