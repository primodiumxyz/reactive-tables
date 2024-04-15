import { describe, it, expect, assert, beforeAll } from "vitest";
import { createWorld, getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity, syncToRecs } from "@latticexyz/store-sync/recs";
import { wait } from "@latticexyz/common/utils";

// src
import { tinyBaseWrapper } from "@/index";
import { SyncStep } from "@/constants";
// mocks
import {
  fuzz,
  getMockNetworkConfig,
  getRandomBigInts,
  getRandomNumbers,
  setItems,
  setPositionForEntity,
} from "@/__tests__/utils";
import mockConfig from "@/__tests__/mocks/contracts/mud.config";
import { padHex, toHex } from "viem";

const FUZZ_ITERATIONS = 20;

type TestOptions = {
  useIndexer?: boolean;
  startSync?: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                    INIT                                    */
/* -------------------------------------------------------------------------- */

const init = async (options: TestOptions = { useIndexer: true, startSync: true }) => {
  const { useIndexer, startSync } = options;
  const world = createWorld();
  const networkConfig = getMockNetworkConfig();

  // Initialize & sync with the wrapper
  const { components, tables, store, sync, publicClient } = tinyBaseWrapper({
    world,
    mudConfig: mockConfig,
    networkConfig: {
      ...networkConfig,
      indexerUrl: useIndexer ? networkConfig.indexerUrl : undefined,
    },
    startSync,
  });

  // Sync RECS components for comparison
  const { components: recsComponents } = await syncToRecs({
    world,
    config: mockConfig,
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

  // Wait for a component to be synced at the specified block
  const waitForBlockSynced = async (txBlock: bigint, componentKey: keyof typeof components, key?: string) => {
    let synced = false;

    while (!synced) {
      await wait(1000);

      // @ts-expect-error __lastSyncedAtBlock doesn't exist on internal components
      const lastSyncedBlock = components?.[componentKey].get(key)?.__lastSyncedAtBlock;
      synced = lastSyncedBlock >= txBlock;
    }
  };

  return {
    components,
    tables,
    store,
    sync,
    publicClient,
    recsComponents,
    networkConfig,
    waitForSyncLive,
    waitForBlockSynced,
  };
};

describe("tinyBaseWrapper", () => {
  /* -------------------------------------------------------------------------- */
  /*                                    SETUP                                   */
  /* -------------------------------------------------------------------------- */

  it("should properly initialize and return expected objects", async () => {
    const { components, tables, publicClient, sync, store } = await init({ startSync: false });

    // Verify the existence of the result
    expect(components).toBeDefined();
    expect(tables).toBeDefined();
    expect(store).toBeDefined();
    expect(sync).toBeDefined();
    expect(publicClient).toBeDefined();
  });

  /* -------------------------------------------------------------------------- */
  /*                                    SYNC                                    */
  /* -------------------------------------------------------------------------- */

  describe("sync: should properly sync similar values to RECS components", () => {
    const runTest = async (options: TestOptions) => {
      const { components, recsComponents, networkConfig, waitForSyncLive } = await init(options);
      const player = encodeEntity({ address: "address" }, { address: networkConfig.burnerAccount.address });
      assert(components);

      await waitForSyncLive();

      // Ignore components not registered in RECS (e.g. SyncSource)
      const componentKeys = Object.keys(components).filter((key) =>
        Object.keys(recsComponents).includes(key),
      ) as (keyof typeof components)[];

      // Verify the equality
      for (const comp of componentKeys) {
        const hasKey = Object.entries(components[comp].metadata.keySchema as Object).length > 0;
        const tinyBaseComp = hasKey ? components[comp].get(player) : components[comp].get();

        const recsComp = hasKey
          ? // @ts-expect-error
            getComponentValue(recsComponents[comp], player)
          : // @ts-expect-error
            getComponentValue(recsComponents[comp], singletonEntity);

        if (!tinyBaseComp) {
          expect(recsComp).toBeUndefined();
          continue;
        } else if (!recsComp) {
          expect(tinyBaseComp).toBeUndefined();
          continue;
        }

        // Test value schema
        const valueSchema = components[comp].metadata.valueSchema as Object;
        for (const key of Object.keys(valueSchema)) {
          if (!(key in tinyBaseComp)) {
            expect(recsComp[key]).toBeUndefined();
          } else {
            expect(tinyBaseComp[key as keyof typeof tinyBaseComp]).toEqual(recsComp[key]);
          }
        }

        // Test metadata
        const metadata = ["__dynamicData", "__encodedLengths", "__staticData"];
        for (const key of metadata) {
          expect(tinyBaseComp[key as keyof typeof tinyBaseComp]).toEqual(recsComp[key as keyof typeof recsComp]);
        }
      }
    };

    beforeAll(async () => {
      await fuzz(FUZZ_ITERATIONS);
    });

    it("using indexer", async () => {
      await runTest({ useIndexer: true });
    });

    it("using RPC", async () => {
      await runTest({ useIndexer: false });
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                              COMPONENT METHODS                             */
  /* -------------------------------------------------------------------------- */

  describe("methods: should set and return intended values", () => {
    /* ---------------------------------- BASIC --------------------------------- */
    describe("basic methods", () => {
      // Init and return components and utils
      const preTest = async () => {
        const { components, networkConfig, waitForBlockSynced } = await init();
        const player = encodeEntity({ address: "address" }, { address: networkConfig.burnerAccount.address });
        assert(components);

        // Generate random args
        const length = 5;
        const getRandomArgs = () => ({
          items: getRandomNumbers(length),
          weights: getRandomNumbers(length),
          totalWeight: getRandomBigInts(1)[0],
        });

        return { components, player, getRandomArgs, waitForBlockSynced };
      };

      // Check returned values against input args
      const postTest = (args: Record<string, unknown>, value: Record<string, unknown>) => {
        Object.entries(args).forEach(([key, v]) => {
          expect(value?.[key]).toEqual(v);
        });
      };

      // Get component value after a transaction was made
      it("get()", async () => {
        const { components, player, getRandomArgs, waitForBlockSynced } = await preTest();

        // Set the items and wait for sync
        const args = getRandomArgs();
        const { blockNumber } = await setItems(args);
        await waitForBlockSynced(blockNumber, "Inventory", player);

        const value = components.Inventory.get(player);
        postTest({ ...args, block: blockNumber }, { ...value, block: value?.__lastSyncedAtBlock });
      });

      // Set component value client-side
      it("set()", async () => {
        const { components, player, getRandomArgs } = await preTest();

        // Set the component manually
        const args = getRandomArgs();
        components.Inventory.set(args, player);

        const value = components.Inventory.get(player);
        assert(value);
        postTest(args, value);
      });

      // Update component value client-side
      it("update()", async () => {
        const { components, player, getRandomArgs, waitForBlockSynced } = await preTest();

        // Set the items and wait for sync
        const args = getRandomArgs();
        const { blockNumber } = await setItems(args);
        await waitForBlockSynced(blockNumber, "Inventory", player);

        // Update the component
        const updateArgs = getRandomArgs();
        components.Inventory.update(updateArgs, player);

        const value = components.Inventory.get(player);
        assert(value);
        postTest(updateArgs, value);
      });

      // Remove component value client-side
      it("remove()", async () => {
        const { components, player, getRandomArgs, waitForBlockSynced } = await preTest();

        // Set the items and wait for sync
        const args = getRandomArgs();
        const { blockNumber } = await setItems(args);
        await waitForBlockSynced(blockNumber, "Inventory", player);

        // Remove the component
        components.Inventory.remove(player);

        const value = components.Inventory.get(player);
        expect(value).toBeUndefined();
      });
    });

    /* --------------------------------- NATIVE --------------------------------- */
    describe("native methods", () => {
      // Entities iterator
      it("entities()", async () => {
        const { components, waitForSyncLive } = await init();
        assert(components);

        const entityA = padHex(toHex("entityA"));
        const entityB = padHex(toHex("entityB"));

        expect(components.Position.entities().next().value).toBeUndefined();

        await setPositionForEntity({ entity: entityA, x: 1, y: 1 });
        await setPositionForEntity({ entity: entityB, x: 1, y: 1 });
        await waitForSyncLive();

        const iterator = components.Position.entities();

        expect(iterator.next()).toEqual({ done: false, value: entityA });
        expect(iterator.next()).toEqual({ done: false, value: entityB });
        expect(iterator.next()).toEqual({ done: true, value: undefined });
      });
    });

    /* -------------------------------- REACTIVE -------------------------------- */
    // describe("reactive methods", () => {});
  });
});
