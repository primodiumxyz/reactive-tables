import { describe, it, expect, assert } from "vitest";
import { createWorld, getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity, syncToRecs } from "@latticexyz/store-sync/recs";

// src
import { tinyBaseWrapper } from "@/index";
import { internalTables } from "@/constants";
// mocks
import { fuzz, getMockNetworkConfig } from "@/__tests__/utils";
import mockConfig from "@/__tests__/mocks/contracts/mud.config";

/* -------------------------------------------------------------------------- */
/*                                    TESTS                                   */
/* -------------------------------------------------------------------------- */

// TODO: on too many iterations: RpcRequestError (replacement transaction underpriced)
const FUZZ_ITERATIONS = 20;

/* ---------------------------------- INIT ---------------------------------- */
const init = async () => {
  const world = createWorld();
  const networkConfig = getMockNetworkConfig();

  // Initialize & sync with the wrapper
  const { components, tables, store, sync, publicClient } = await tinyBaseWrapper({
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

  return { components, tables, store, sync, publicClient, recsComponents, networkConfig };
};

describe("tinyBaseWrapper", () => {
  /* ---------------------------------- SETUP --------------------------------- */
  it("should properly initialize and return expected objects", async () => {
    const { components, tables, publicClient, sync, store } = await init();

    // Verify the existence of the result
    expect(components).toBeDefined();
    expect(tables).toBeDefined();
    expect(store).toBeDefined();
    expect(sync).toBeDefined();
    expect(publicClient).toBeDefined();
  });

  /* ---------------------------------- SYNC ---------------------------------- */
  it("should properly sync similar values to RECS components", async () => {
    const { components, recsComponents, networkConfig } = await init();
    const player = encodeEntity({ address: "address" }, { address: networkConfig.burnerAccount.address });
    assert(components);

    await fuzz(networkConfig, FUZZ_ITERATIONS);

    // Ignore SyncSource and SyncStatus (not registered in RECS)
    const ignoredComponents = ["SyncSource", "SyncStatus"];
    const componentKeys = Object.keys(components).filter((key) => !ignoredComponents.includes(key));

    // Verify the equality
    for (const comp of componentKeys) {
      expect(components[comp].get(player)).toEqual(getComponentValue(recsComponents[comp], player));
      expect(components[comp].get(singletonEntity)).toEqual(getComponentValue(recsComponents[comp], singletonEntity));
    }
  });
});
