import { describe, it, expect, assert } from "vitest";
import { createWorld, getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity, syncToRecs } from "@latticexyz/store-sync/recs";
import { waitForTransactionReceipt, writeContract } from "viem/actions";

// src
import { tinyBaseWrapper } from "@/index";
import { internalTables } from "@/constants";
// mocks
import { MockNetworkConfig, getMockNetworkConfig } from "@/__tests__/mocks";
import mockConfig from "@/__tests__/mocks/contracts/mud.config";

/* -------------------------------------------------------------------------- */
/*                                    TESTS                                   */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- INIT ---------------------------------- */
const init = async () => {
  const world = createWorld();
  const networkConfig = getMockNetworkConfig();

  // Initialize & sync with the wrapper
  const { components, tables, publicClient, sync } = await tinyBaseWrapper({
    world,
    mudConfig: mockConfig,
    networkConfig,
  });

  // Sync RECS components for comparison
  const { components: recsComponents } = await syncToRecs({
    world,
    config: mockConfig,
    tables: internalTables,
    address: networkConfig.worldAddress,
    publicClient: networkConfig.publicClient,
    startBlock: networkConfig.initialBlockNumber,
  });

  return { components, tables, publicClient, sync, recsComponents, networkConfig };
};

describe("tinyBaseWrapper", () => {
  /* ---------------------------------- SETUP --------------------------------- */
  it("should properly initialize and return expected objects", async () => {
    const { components, tables, publicClient, sync } = await init();

    // Verify the existence of the result
    expect(components).toBeDefined();
    expect(tables).toBeDefined();
    expect(publicClient).toBeDefined();
    expect(sync).toBeDefined();
  });

  /* ---------------------------------- SYNC ---------------------------------- */
  it("should properly sync similar values to RECS components", async () => {
    const { components, recsComponents, networkConfig } = await init();
    const player = encodeEntity({ address: "address" }, { address: networkConfig.burnerAccount.address });

    await increment(networkConfig);
    await move(networkConfig);

    // Verify the equality
    assert(components);
    // Counter
    expect(components.Counter.get()).toEqual(getComponentValue(recsComponents.Counter, singletonEntity));
    // Position
    expect(components.Position.get(player)).toEqual(getComponentValue(recsComponents.Position, player));
  });
});

/* -------------------------------------------------------------------------- */
/*                                    UTILS                                   */
/* -------------------------------------------------------------------------- */

// Test function to update an entity's position
const move = async (networkConfig: MockNetworkConfig) => {
  const txHash = await writeContract(networkConfig.publicClient, {
    ...networkConfig.worldContract,
    chain: networkConfig.chain,
    account: networkConfig.burnerAccount.address,
    functionName: "move",
    args: [10, 10],
  });
  await waitForTransactionReceipt(networkConfig.publicClient, { hash: txHash });
};

// Test function to increment the counter
const increment = async (networkConfig: MockNetworkConfig) => {
  const txHash = await writeContract(networkConfig.publicClient, {
    ...networkConfig.worldContract,
    chain: networkConfig.chain,
    account: networkConfig.burnerAccount.address,
    functionName: "increment",
    args: [],
  });
  await waitForTransactionReceipt(networkConfig.publicClient, { hash: txHash });
};
