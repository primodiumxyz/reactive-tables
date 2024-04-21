import { describe, it, expect, assert, beforeAll } from "vitest";
import { renderHook } from "@testing-library/react-hooks";

// libs
import { Entity, Type, createWorld, getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity, syncToRecs } from "@latticexyz/store-sync/recs";
import { wait } from "@latticexyz/common/utils";
import { padHex, toHex } from "viem";

// src
import { tinyBaseWrapper } from "@/index";
import { createInternalComponent, createInternalCoordComponent } from "@/store/internal";
import { createInternalComponents } from "@/store/internal/templates";
import { TableQueryUpdate, query } from "@/store/queries";
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
import { createSync } from "@/__tests__/utils/sync";

const FUZZ_ITERATIONS = 20;

type TestOptions = {
  useIndexer?: boolean;
  startSync?: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                    INIT                                    */
/* -------------------------------------------------------------------------- */

const init = async (options: TestOptions = { useIndexer: false }) => {
  const { useIndexer } = options;
  const world = createWorld();
  const networkConfig = getMockNetworkConfig();

  // Initialize wrapper
  const {
    components: contractComponents,
    tables,
    store,
    queries,
    storageAdapter,
    publicClient,
  } = tinyBaseWrapper({
    world,
    mudConfig: mockConfig,
    networkConfig: {
      ...networkConfig,
      indexerUrl: useIndexer ? networkConfig.indexerUrl : undefined,
    },
  });
  const components = { ...contractComponents, ...createInternalComponents(store) };

  // Sync components with the chain
  const sync = createSync({
    components,
    store,
    networkConfig: {
      ...networkConfig,
      indexerUrl: useIndexer ? networkConfig.indexerUrl : undefined,
    },
    publicClient,
    onSync: {
      progress: (_, __, progress) => console.log(`Syncing: ${(progress * 100).toFixed()}%`),
      complete: (blockNumber) => `Synced to block ${blockNumber?.toString()}`,
      error: (err) => console.error(err),
    },
  });
  sync.start();
  world.registerDisposer(sync.unsubscribe);

  // Sync RECS components for comparison
  const { components: recsComponents } = await syncToRecs({
    world,
    config: mockConfig,
    address: networkConfig.worldAddress,
    publicClient: networkConfig.publicClient,
    startBlock: networkConfig.initialBlockNumber,
    indexerUrl: useIndexer ? networkConfig.indexerUrl : undefined,
  });

  // Grab a few entities to use across tests (because each test will keep the state of the chain
  // from previous runs)
  const entities = [
    encodeEntity({ address: "address" }, { address: networkConfig.burnerAccount.address }),
    ...["A", "B", "C"].map((id) => padHex(toHex(`entity${id}`))),
  ] as Entity[];

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
      const lastSyncedBlock = components?.[componentKey].get(key)?.__lastSyncedAtBlock;
      synced = lastSyncedBlock >= txBlock;
    }
  };

  return {
    components,
    tables,
    store,
    queries,
    storageAdapter,
    sync,
    publicClient,
    recsComponents,
    entities,
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
    const { components, tables, store, queries, storageAdapter, publicClient } = await init({ startSync: false });

    // Verify the existence of the result
    expect(components).toBeDefined();
    expect(tables).toBeDefined();
    expect(store).toBeDefined();
    expect(queries).toBeDefined();
    expect(storageAdapter).toBeDefined();
    expect(publicClient).toBeDefined();
  });

  it("should be able to create components from internal tables passed during initialization", async () => {
    const world = createWorld();
    const networkConfig = getMockNetworkConfig();

    // Initialize wrapper
    const { store } = tinyBaseWrapper({
      world,
      mudConfig: mockConfig,
      networkConfig,
    });

    const components = {
      A: createInternalCoordComponent(store, { id: "A" }),
      B: createInternalComponent(store, { bool: Type.Boolean, array: Type.EntityArray }),
    };

    components.A.set({ x: 1, y: 1 });
    components.B.set({ bool: true, array: [singletonEntity] });

    expect(components.A.get()).toHaveProperty("x", 1);
    expect(components.A.get()).toHaveProperty("y", 1);
    expect(components.B.get()).toHaveProperty("bool", true);
    expect(components.B.get()).toHaveProperty("array", [singletonEntity]);
  });

  /* -------------------------------------------------------------------------- */
  /*                                    SYNC                                    */
  /* -------------------------------------------------------------------------- */

  describe("sync: should properly sync similar values to RECS components", () => {
    const runTest = async (options: TestOptions, txs: Record<string, bigint>) => {
      const { components, recsComponents, entities, waitForSyncLive, waitForBlockSynced } = await init(options);
      const player = entities[0];
      assert(components);

      // Wait for sync to be live at the block of the latest transaction for each component
      await Promise.all(
        Object.entries(txs).map(([comp, block]) =>
          waitForBlockSynced(
            block,
            comp as keyof typeof components,
            // @ts-ignore
            components[comp].metadata.keySchema.id ? player : undefined,
          ),
        ),
      );

      // Ignore components not registered in RECS (e.g. SyncSource)
      const componentKeys = Object.keys(components).filter((key) =>
        Object.keys(recsComponents).includes(key),
      ) as (keyof typeof components)[];

      // Verify the equality
      for (const comp of componentKeys) {
        const hasKey = Object.entries(components[comp].metadata.keySchema ?? {}).length > 0;
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
        const valueSchema = components[comp].metadata.valueSchema ?? {};
        for (const key of Object.keys(valueSchema)) {
          if (!(key in tinyBaseComp)) {
            expect(recsComp[key]).toBeUndefined();
          } else {
            expect(tinyBaseComp[key as keyof typeof tinyBaseComp]).toEqual(recsComp[key]);
          }
        }

        // We don't test the metadata because if the values are right it's because it was decoded correctly
        // and there are rare inconsistencies with RECS sync returning either "0x" or undefined for empty values
      }
    };

    it("using indexer", async () => {
      const txs = await fuzz(FUZZ_ITERATIONS);
      await runTest({ useIndexer: true }, txs);
    });

    it("using RPC", async () => {
      const txs = await fuzz(FUZZ_ITERATIONS);
      await runTest({ useIndexer: false }, txs);
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
        const { components, entities, waitForBlockSynced } = await init();
        const player = entities[0];
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
      it("get(), getWithKeys()", async () => {
        const { components, player, getRandomArgs, waitForBlockSynced } = await preTest();

        // Set the items and wait for sync
        const args = getRandomArgs();
        const { blockNumber } = await setItems(args);
        await waitForBlockSynced(blockNumber, "Inventory", player);

        const value = components.Inventory.get(player);
        const valueWithKeys = components.Inventory.getWithKeys({ id: player });
        postTest({ ...args, block: blockNumber }, { ...value, block: value?.__lastSyncedAtBlock });
        expect(value).toEqual(valueWithKeys);
      });

      // Set component value client-side
      it("set(), setWithKeys", async () => {
        const { components, player, getRandomArgs } = await preTest();

        // Set the component manually
        const args = getRandomArgs();
        components.Inventory.set(args, player);

        const value = components.Inventory.get(player);
        const valueWithKeys = components.Inventory.getWithKeys({ id: player });
        assert(value);
        postTest(args, value);
        expect(value).toEqual(valueWithKeys);
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
        const { components, entities, waitForSyncLive } = await init();
        assert(components);

        await Promise.all(entities.map(async (entity) => await setPositionForEntity({ entity, x: 1, y: 1 })));
        await waitForSyncLive();

        const iterator = components.Position.entities();

        // It _should_ already include the burner account from previous tests
        // Since we're not sure about the order, we can just test the global output
        const iterations = entities.map(() => iterator.next());
        expect(iterations.map((i) => i.value).sort()).toEqual(entities.sort());
        expect(iterator.next()).toEqual({ done: true, value: undefined });
      });
    });

    /* --------------------------------- QUERIES -------------------------------- */
    describe("query methods", () => {
      const getRandomArgs = (entity: Entity) => {
        const nums = getRandomNumbers(2);
        return { entity, x: nums[0], y: nums[1] };
      };

      const preTest = async () => {
        const { components, networkConfig, entities, waitForSyncLive } = await init();
        assert(components);

        // 4 entities: A has a value, B has a different value, C & D have the same value
        const argsA = getRandomArgs(entities[0]);
        const argsB = getRandomArgs(entities[1]);
        const argsC = getRandomArgs(entities[2]);
        const argsD = { ...argsC, entity: entities[3] };

        const args = [argsA, argsB, argsC, argsD];
        await Promise.all(args.map(async (a) => await setPositionForEntity(a)));
        await waitForSyncLive();

        return { components, networkConfig, entities, args };
      };

      it("getAll()", async () => {
        const { components, entities } = await preTest();

        const allEntities = components.Position.getAll();
        expect(allEntities.sort()).toEqual(entities.sort());
      });

      it("getAllWith()", async () => {
        const { components, entities, args } = await preTest();

        expect(components.Position.getAllWith({ x: args[0].x, y: args[0].y })).toEqual([entities[0]]);
        expect(components.Position.getAllWith({ x: args[1].x, y: args[1].y })).toEqual([entities[1]]);
        expect(components.Position.getAllWith({ x: args[2].x, y: args[2].y }).sort()).toEqual(
          [entities[2], entities[3]].sort(),
        );

        // Test with args not included for any entity
        let randomArgs = getRandomArgs(entities[0]);
        while (args.some((a) => a.x === randomArgs.x && a.y === randomArgs.y)) {
          randomArgs = getRandomArgs(entities[0]);
        }
        expect(components.Position.getAllWith({ x: randomArgs.x, y: randomArgs.y })).toEqual([]);

        // Matching only a part of the args should not be enough for the entity to be included
        let argsWithPartialEquality = getRandomArgs(entities[0]);
        while (args.some((a) => a.x === argsWithPartialEquality.x)) {
          argsWithPartialEquality = getRandomArgs(entities[0]);
        }
        expect(components.Position.getAllWith({ x: argsWithPartialEquality.x, y: args[0].y })).toEqual([]);
      });

      it("getAllWithout()", async () => {
        const { components, entities, args } = await preTest();

        expect(components.Position.getAllWithout({ x: args[0].x, y: args[0].y }).sort()).toEqual(
          [entities[1], entities[2], entities[3]].sort(),
        );
        expect(components.Position.getAllWithout({ x: args[1].x, y: args[1].y }).sort()).toEqual(
          [entities[0], entities[2], entities[3]].sort(),
        );
        expect(components.Position.getAllWithout({ x: args[2].x, y: args[2].y }).sort()).toEqual(
          [entities[0], entities[1]].sort(),
        );

        // Test with args not included for any entity
        let randomArgs = getRandomArgs(entities[0]);
        while (args.some((a) => a.x === randomArgs.x && a.y === randomArgs.y)) {
          randomArgs = getRandomArgs(entities[0]);
        }
        expect(components.Position.getAllWithout({ x: randomArgs.x, y: randomArgs.y }).sort()).toEqual(entities.sort());
      });

      it("clear()", async () => {
        const { components, entities } = await preTest();
        expect(components.Position.getAll().sort()).toEqual(entities.sort());

        components.Position.clear();
        expect(components.Position.getAll()).toEqual([]);
      });

      it("has(), hasWithKeys()", async () => {
        const { components, entities } = await preTest();

        entities.forEach((entity) => {
          expect(components.Position.has(entity)).toBe(true);
          expect(components.Position.hasWithKeys({ id: entity })).toBe(true);
        });

        const unknownEntity = padHex(toHex("unknownEntity"));
        expect(components.Position.has(unknownEntity)).toBe(false);
        expect(components.Position.hasWithKeys({ id: unknownEntity })).toBe(false);
      });
    });

    /* ---------------------------------- HOOKS --------------------------------- */
    describe("reactive methods", () => {
      const getRandomArgs = (entity: Entity) => {
        const nums = getRandomNumbers(2);
        return { entity, x: nums[0], y: nums[1] };
      };

      const updatePosition = async (entity: Entity, waitForBlockSynced: Function) => {
        const args = getRandomArgs(entity);
        const { blockNumber } = await setPositionForEntity(args);
        await waitForBlockSynced(blockNumber, "Position", entity);

        return { args };
      };

      it("use(), useWithKeys()", async () => {
        const { components, waitForBlockSynced, entities } = await init();
        assert(components);
        const player = entities[0];

        const { result } = renderHook(() => components.Position.use(player));
        const { result: resultWithKeys } = renderHook(() => components.Position.useWithKeys({ id: player }));

        // Update the position
        const { args } = await updatePosition(player, waitForBlockSynced);
        expect(result.current).toHaveProperty("x", args.x);
        expect(result.current).toHaveProperty("y", args.y);
        expect(result.current).toEqual(resultWithKeys.current);

        // Update the position again with different values
        const { args: argsB } = await updatePosition(player, waitForBlockSynced);
        expect(result.current).toHaveProperty("x", argsB.x);
        expect(result.current).toHaveProperty("y", argsB.y);
        expect(result.current).toEqual(resultWithKeys.current);

        // Remove an entity
        components.Position.remove(player);
        expect(result.current).toBeUndefined();
        expect(resultWithKeys.current).toBeUndefined();
      });

      it("pauseUpdates()", async () => {
        const { components, waitForBlockSynced, entities } = await init();
        assert(components);
        const player = entities[0];

        const { result } = renderHook(() => components.Position.use(entities[0]));

        // Update the position
        const { args } = await updatePosition(player, waitForBlockSynced);
        expect(result.current).toHaveProperty("x", args.x);
        expect(result.current).toHaveProperty("y", args.y);

        // Pause updates
        components.Position.pauseUpdates(player, args);

        // Update the position again with different values
        await updatePosition(player, waitForBlockSynced);

        // It should still have the same values
        expect(result.current).toHaveProperty("x", args.x);
        expect(result.current).toHaveProperty("y", args.y);
      });

      it("resumeUpdates()", async () => {
        const { components, waitForBlockSynced, entities } = await init();
        assert(components);
        const player = entities[0];

        const { result } = renderHook(() => components.Position.use(entities[0]));

        // Update the position
        const { args } = await updatePosition(player, waitForBlockSynced);
        expect(result.current).toHaveProperty("x", args.x);
        expect(result.current).toHaveProperty("y", args.y);

        // Pause updates
        components.Position.pauseUpdates(player, args);

        // Update the position again with different values
        const { args: argsB } = await updatePosition(player, waitForBlockSynced);
        // It should keep the old values
        expect(result.current).toHaveProperty("x", args.x);
        expect(result.current).toHaveProperty("y", args.y);

        // Resume updates
        components.Position.resumeUpdates(player);
        // It should update to the new values
        expect(result.current).toHaveProperty("x", argsB.x);
        expect(result.current).toHaveProperty("y", argsB.y);
      });

      it("useAll()", async () => {
        const { components, waitForBlockSynced, entities } = await init();
        assert(components);

        const { result } = renderHook(() => components.Position.useAll());

        // Update the position for all entities
        await Promise.all(entities.map(async (entity) => await updatePosition(entity, waitForBlockSynced)));
        expect(result.current.sort()).toEqual(entities.sort());

        // Clear the positions
        components.Position.clear();
        expect(result.current).toEqual([]);

        // Update the position for a few entities
        await Promise.all(entities.slice(0, 2).map(async (entity) => await updatePosition(entity, waitForBlockSynced)));
        expect(result.current.sort()).toEqual(entities.slice(0, 2).sort());

        // Remove an entity
        components.Position.remove(entities[0]);
        expect(result.current).toEqual([entities[1]]);
      });

      it("useAllWith()", async () => {
        const { components, waitForBlockSynced, entities } = await init();
        assert(components);

        const targetPos = { x: 10, y: 10 };
        const { result } = renderHook(() => components.Position.useAllWith(targetPos));

        // Update the position for all entities (not to the target position)
        await Promise.all(
          entities.map(async (entity) => {
            let args = getRandomArgs(entity);
            while (args.x === targetPos.x && args.y === targetPos.y) {
              args = getRandomArgs(entity);
            }

            const { blockNumber } = await setPositionForEntity(args);
            await waitForBlockSynced(blockNumber, "Position", entity);
          }),
        );

        expect(result.current).toEqual([]);

        // Update the position for a few entities to the target position
        const { blockNumber: blockNumberB } = await setPositionForEntity({ ...targetPos, entity: entities[0] });
        await waitForBlockSynced(blockNumberB, "Position", entities[0]);
        expect(result.current).toEqual([entities[0]]);

        const { blockNumber: blockNumberC } = await setPositionForEntity({ ...targetPos, entity: entities[1] });
        await waitForBlockSynced(blockNumberC, "Position", entities[1]);
        expect(result.current.sort()).toEqual([entities[0], entities[1]].sort());

        // And with only part of the properties matching
        const { blockNumber: blockNumberD } = await setPositionForEntity({ x: targetPos.x, y: 0, entity: entities[2] });
        await waitForBlockSynced(blockNumberD, "Position", entities[2]);
        expect(result.current.sort()).toEqual([entities[0], entities[1]].sort());

        // Remove an entity
        components.Position.remove(entities[0]);
        expect(result.current).toEqual([entities[1]]);
      });

      it("useAllWithout()", async () => {
        const { components, waitForBlockSynced, entities } = await init();
        assert(components);

        const targetPos = { x: 10, y: 10 };
        const { result } = renderHook(() => components.Position.useAllWithout(targetPos));

        // Update the position for all entities (not to the target position)
        await Promise.all(
          entities.map(async (entity) => {
            let args = getRandomArgs(entity);
            while (args.x === targetPos.x && args.y === targetPos.y) {
              args = getRandomArgs(entity);
            }
            const { blockNumber } = await setPositionForEntity(args);
            await waitForBlockSynced(blockNumber, "Position", entity);
          }),
        );

        expect(result.current.sort()).toEqual(entities.sort());

        // Update the position for a few entities to the target position
        const { blockNumber: blockNumberB } = await setPositionForEntity({ ...targetPos, entity: entities[0] });
        await waitForBlockSynced(blockNumberB, "Position", entities[0]);
        expect(result.current.sort()).toEqual(entities.slice(1).sort());

        const { blockNumber: blockNumberC } = await setPositionForEntity({ ...targetPos, entity: entities[1] });
        await waitForBlockSynced(blockNumberC, "Position", entities[1]);
        expect(result.current.sort()).toEqual(entities.slice(2).sort());

        // And with only part of the properties matching
        const { blockNumber: blockNumberD } = await setPositionForEntity({ x: targetPos.x, y: 0, entity: entities[2] });
        await waitForBlockSynced(blockNumberD, "Position", entities[2]);
        expect(result.current.sort()).toEqual(entities.slice(2).sort());

        // Remove an entity
        components.Position.remove(entities[2]);
        expect(result.current).toEqual(entities.slice(3));
      });
    });

    /* ---------------------------------- KEYS ---------------------------------- */
    describe("keys (contract-specific) methods", () => {
      it("getEntityKeys()", async () => {
        const { components, entities } = await init();
        assert(components);

        const player = entities[0];
        const keys = components.Position.getEntityKeys(player);
        expect(keys).toEqual({ id: player });
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                                   QUERIES                                  */
  /* -------------------------------------------------------------------------- */

  describe("queries: should emit appropriate update events with the correct data", () => {
    const getRandomArgs = (entity: Entity) => {
      const nums = getRandomNumbers(2);
      return { entity, x: nums[0], y: nums[1] };
    };

    const updatePosition = async (entity: Entity, waitForBlockSynced: Function) => {
      const args = getRandomArgs(entity);
      const { blockNumber } = await setPositionForEntity(args);
      await waitForBlockSynced(blockNumber, "Position", entity);

      return { args };
    };

    const updatePositionTo = async (entity: Entity, x: number, y: number, waitForBlockSynced: Function) => {
      const { blockNumber } = await setPositionForEntity({ entity, x, y });
      await waitForBlockSynced(blockNumber, "Position", entity);
    };

    const preTest = async () => {
      const { components, waitForSyncLive, waitForBlockSynced, entities } = await init();
      assert(components);
      // Just wait for sync for the test to be accurate (no system trigger due to storing synced values)
      await waitForSyncLive();

      // Aggregate updates triggered by the system on component changes
      let aggregator: TableQueryUpdate<typeof components.Position.schema>[] = [];
      const onChange = (update: (typeof aggregator)[number]) => aggregator.push(update);

      return { components, waitForBlockSynced, entities, onChange, aggregator };
    };

    it("createQueryWrapper(): without query", async () => {
      const { components, waitForBlockSynced, entities, onChange, aggregator } = await preTest();
      const { unsubscribe } = components.Position.createQuery({
        onChange,
        options: { runOnInit: false },
      });
      expect(aggregator).toEqual([]);

      // Update the position for an entity (and enter the table)
      const valueA = components.Position.get(entities[0]);
      await updatePosition(entities[0], waitForBlockSynced);
      const valueB = components.Position.get(entities[0]);

      expect(aggregator).toEqual([
        { entity: entities[0], value: { current: valueB, prev: valueA }, type: valueA ? "change" : "enter" },
      ]);

      // Update entity[1]
      const valueC = components.Position.get(entities[1]);
      await updatePosition(entities[1], waitForBlockSynced);
      const valueD = components.Position.get(entities[1]);
      // Exit entity[0]
      components.Position.remove(entities[0]);
      // Enter again entity[0]
      await updatePosition(entities[0], waitForBlockSynced);
      const valueE = components.Position.get(entities[0]);

      expect(aggregator).toEqual([
        { entity: entities[0], value: { current: valueB, prev: valueA }, type: valueA ? "change" : "enter" },
        { entity: entities[1], value: { current: valueD, prev: valueC }, type: valueC ? "change" : "enter" },
        { entity: entities[0], value: { current: undefined, prev: valueB }, type: "exit" },
        { entity: entities[0], value: { current: valueE, prev: undefined }, type: "enter" },
      ]);

      unsubscribe();
    });

    it("createQueryWrapper(): run on init", async () => {
      const { components, waitForBlockSynced, entities, onChange, aggregator } = await preTest();

      // Enter entities
      await Promise.all(entities.map(async (entity) => await updatePosition(entity, waitForBlockSynced)));

      const { unsubscribe } = components.Position.createQuery({
        onChange,
        options: { runOnInit: true },
      });
      expect(aggregator).toHaveLength(entities.length);

      unsubscribe();
    });

    it("createQueryWrapper(): with query", async () => {
      const { components, waitForBlockSynced, entities, onChange, aggregator } = await preTest();
      const matchQuery = (x: number) => x > 5 && x < 15;

      const { unsubscribe } = components.Position.createQuery({
        onChange,
        options: { runOnInit: false },
        query: ({ where }) => {
          // Where x is between 5 and 15
          where((getCell) => matchQuery(Number(getCell("x"))));
        },
      });
      // Query didn't run on init so it should be empty
      expect(aggregator).toEqual([]);

      // Move an entity inside the query condition
      const valueA = components.Position.get(entities[0]);
      await updatePositionTo(entities[0], 9, 9, waitForBlockSynced);
      const valueB = components.Position.get(entities[0]);

      expect(aggregator).toEqual([
        {
          entity: entities[0],
          value: { current: valueB, prev: valueA },
          type: "enter", // because we didn't run on init so it's necessarily an enter
        },
      ]);

      // Update entity[1] inside the query condition
      const valueC = components.Position.get(entities[1]);
      await updatePositionTo(entities[1], 10, 10, waitForBlockSynced);
      const valueD = components.Position.get(entities[1]);

      expect(aggregator[1]).toEqual({
        entity: entities[1],
        value: { current: valueD, prev: valueC },
        type: "enter",
      });

      // Exit entity[0]
      components.Position.remove(entities[0]);

      expect(aggregator[2]).toEqual({
        entity: entities[0],
        value: { current: undefined, prev: valueB },
        type: "exit",
      });

      // Move out entity[1] from the query condition
      await updatePositionTo(entities[1], 20, 20, waitForBlockSynced);
      const valueE = components.Position.get(entities[1]);

      expect(aggregator).toHaveLength(4);
      expect(aggregator[3]).toEqual({
        entity: entities[1],
        value: { current: valueE, prev: valueD },
        type: "exit",
      });

      unsubscribe();
    });

    it("query() (queryAllMatching)", async () => {
      const { components, store, entities } = await init();
      const [player, A, B, C] = entities;

      // Prepare entities
      components.Position.set({ x: 10, y: 10 }, player);
      components.Position.set({ x: 5, y: 5 }, A);
      components.Position.set({ x: 10, y: 10 }, B);
      components.Position.set({ x: 15, y: 10 }, C);
      components.Inventory.set({ items: [1, 2, 3], weights: [1, 2, 3], totalWeight: BigInt(6) }, player);
      components.Inventory.set({ items: [2, 3, 4], weights: [2, 3, 4], totalWeight: BigInt(6) }, A);
      components.Inventory.set({ items: [1, 2, 3], weights: [1, 2, 3], totalWeight: BigInt(3) }, B);

      // Entities inside the Position component
      expect(
        query(store, {
          inside: [components.Position],
        }).sort(),
      ).toEqual([player, A, B, C].sort());

      // Entities inside the Position component but not inside the Inventory component
      expect(
        query(store, {
          inside: [components.Position],
          notInside: [components.Inventory],
        }),
      ).toEqual([C]);

      // Entities with a specific value inside the Inventory component, and without a specific value inside the Position component
      expect(
        query(store, {
          with: [
            {
              component: components.Inventory,
              value: { totalWeight: BigInt(6) },
            },
          ],
          without: [
            {
              component: components.Position,
              value: { x: 5, y: 5 },
            },
          ],
        }),
      ).toEqual([player]);

      // Entities with a specific value inside the Inventory component, not another one
      expect(
        query(store, {
          with: [
            {
              component: components.Inventory,
              value: { totalWeight: BigInt(6) },
            },
          ],
          without: [
            {
              component: components.Inventory,
              value: { weights: [1, 2, 3] },
            },
          ],
        }),
      ).toEqual([A]);
    });
  });
});
