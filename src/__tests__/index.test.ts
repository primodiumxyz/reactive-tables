import { describe, it, expect, assert } from "vitest";
import { createWorld, getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity, syncToRecs } from "@latticexyz/store-sync/recs";
import { wait } from "@latticexyz/common/utils";

// src
import { tinyBaseWrapper } from "@/index";
import { SyncStep, internalTables } from "@/constants";
// mocks
import { fuzz, getMockNetworkConfig, mockFunctions } from "@/__tests__/utils";
import mockConfig from "@/__tests__/mocks/contracts/mud.config";

/* -------------------------------------------------------------------------- */
/*                                    TESTS                                   */
/* -------------------------------------------------------------------------- */

const FUZZ_ITERATIONS = 20;

/* ---------------------------------- INIT ---------------------------------- */
const init = async (useIndexer = true) => {
  const world = createWorld();
  const networkConfig = getMockNetworkConfig();

  // Initialize & sync with the wrapper
  const { components, tables, store, sync, publicClient } = await tinyBaseWrapper({
    world,
    mudConfig: mockConfig,
    networkConfig: {
      ...networkConfig,
      indexerUrl: useIndexer ? networkConfig.indexerUrl : undefined,
    },
  });

  // Sync RECS components for comparison
  const { components: recsComponents } = await syncToRecs({
    world,
    config: mockConfig,
    tables: internalTables,
    address: networkConfig.worldAddress,
    publicClient: networkConfig.publicClient,
    startBlock: networkConfig.initialBlockNumber,
    indexerUrl: useIndexer ? networkConfig.indexerUrl : undefined,
  });

  // We want to wait for both components systems to be in sync & live
  const waitForSyncLive = async () => {
    let synced = false;

    while (!synced) {
      await wait(1000);

      const tinyBaseSync = components?.SyncStatus.get(singletonEntity);
      const recsSync = getComponentValue(recsComponents.SyncProgress, singletonEntity);
      synced = tinyBaseSync?.step === SyncStep.Live && recsSync?.step === "live";
    }
  };

  return { components, tables, store, sync, publicClient, recsComponents, networkConfig, waitForSyncLive };
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
  describe("sync: should properly sync similar values to RECS components", () => {
    const performTest = async (useIndexer: boolean) => {
      const { components, recsComponents, networkConfig, waitForSyncLive } = await init(useIndexer);
      const player = encodeEntity({ address: "address" }, { address: networkConfig.burnerAccount.address });
      assert(components);

      await fuzz(networkConfig, FUZZ_ITERATIONS);
      await waitForSyncLive();

      // Ignore SyncSource and SyncStatus (not registered in RECS)
      const ignoredComponents = ["SyncSource", "SyncStatus"];
      const componentKeys = Object.keys(components).filter((key) => !ignoredComponents.includes(key));

      // Verify the equality
      for (const comp of componentKeys) {
        expect(components[comp].get(player)).toEqual(getComponentValue(recsComponents[comp], player));
        expect(components[comp].get(singletonEntity)).toEqual(getComponentValue(recsComponents[comp], singletonEntity));
      }
    };

    it("using indexer", async () => {
      await performTest(true);
    });

    it("using RPC", async () => {
      await performTest(false);
    });
  });
});
