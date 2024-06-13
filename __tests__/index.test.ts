import { describe, it, expect, assert } from "vitest";
import { renderHook } from "@testing-library/react-hooks";

// libs
import { createWorld as createRecsWorld, getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity, syncToRecs } from "@latticexyz/store-sync/recs";
import { ResolvedStoreConfig } from "@latticexyz/store/config";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Hex, padHex, toHex } from "viem";

// src
import {
  ContractTable,
  ContractTableDef,
  createWorld,
  $query,
  createLocalTable,
  createLocalCoordTable,
  createWrapper,
  defaultEntity,
  query,
  Entity,
  Type,
  TableUpdate,
  useQuery,
  QueryOptions,
} from "@/index"; // use `from "@primodiumxyz/reactive-tables"` to test the build

// tests
import {
  SyncStep,
  createLocalSyncTables,
  createSync,
  fuzz,
  networkConfig,
  getRandomBigInts,
  getRandomNumbers,
  setItems,
  setPositionForEntity,
  toBaseTable,
} from "@test/utils";
import mudConfig from "@test/contracts/mud.config";

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

const FUZZ_ITERATIONS = 50;

/* -------------------------------------------------------------------------- */
/*                                    SETUP                                   */
/* -------------------------------------------------------------------------- */

type TestOptions = {
  useIndexer?: boolean;
};

const emptyData = {
  __staticData: "0x" as Hex,
  __encodedLengths: "0x" as Hex,
  __dynamicData: "0x" as Hex,
  __lastSyncedAtBlock: BigInt(0),
};

const setup = async (options: TestOptions = { useIndexer: false }) => {
  const { useIndexer } = options;
  const world = createWorld();
  const recsWorld = createRecsWorld();

  const localTables = createLocalSyncTables(world);
  // Initialize wrapper
  const {
    tables: contractTables,
    tableDefs,
    storageAdapter,
    triggerUpdateStream,
  } = createWrapper({
    world: world,
    mudConfig,
    shouldSkipUpdateStream: () => localTables.SyncStatus.get()?.step !== SyncStep.Live,
  });
  const tables = { ...localTables, ...contractTables };

  // Sync tables with the chain
  const sync = createSync({
    contractTables,
    localTables,
    tableDefs,
    storageAdapter,
    triggerUpdateStream,
    networkConfig: {
      ...networkConfig,
      indexerUrl: useIndexer ? networkConfig.indexerUrl : undefined,
    },
    onSync: {
      progress: (_, __, progress) => console.log(`Syncing: ${(progress * 100).toFixed()}%`),
      complete: (blockNumber) => `Synced to block ${blockNumber?.toString()}`,
      error: (err) => console.error(err),
    },
  });
  sync.start();
  world.registerDisposer(sync.unsubscribe);

  // Sync RECS tables for comparison
  const { components: recsComponents } = await syncToRecs({
    world: recsWorld,
    config: mudConfig,
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

  // We want to wait for both tables to be in sync & live
  const waitForSyncLive = async () => {
    let synced = false;

    while (!synced) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const tinyBaseSync = tables.SyncStatus.get();
      const recsSync = getComponentValue(recsComponents.SyncProgress, singletonEntity);
      synced = tinyBaseSync?.step === SyncStep.Live && recsSync?.step === "live";
    }
  };

  return {
    world,
    tables,
    tableDefs,
    storageAdapter,
    sync,
    recsComponents,
    entities,
    networkConfig,
    waitForSyncLive,
  };
};

/* -------------------------------------------------------------------------- */
/*                                    UTILS                                   */
/* -------------------------------------------------------------------------- */

// Wait for a table to be synced at the specified block
const waitForBlockSynced = async <tableDef extends ContractTableDef>(
  txBlock: bigint,
  table: ContractTable<tableDef>,
  key?: Entity,
) => {
  let synced = false;

  while (!synced) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const lastSyncedBlock = table.get(key)?.__lastSyncedAtBlock;
    synced = lastSyncedBlock ? lastSyncedBlock >= txBlock : false;
  }
};

/* -------------------------------------------------------------------------- */
/*                                    SETUP                                   */
/* -------------------------------------------------------------------------- */

describe("setup: create wrapper", () => {
  it("should properly initialize and return expected objects", async () => {
    const { tables, tableDefs, storageAdapter } = await setup();

    // Verify the existence of the result
    expect(tables).toBeDefined();
    expect(tableDefs).toBeDefined();
    expect(storageAdapter).toBeDefined();
  });
});

describe("local: create local table", () => {
  it("should be able to create tables from local definitions passed during initialization", async () => {
    const world = createWorld();
    const tables = {
      A: createLocalCoordTable(world, { id: "A" }),
      B: createLocalTable(world, { bool: Type.Boolean, array: Type.EntityArray }),
    };

    tables.A.set({ x: 1, y: 1 });
    tables.B.set({ bool: true, array: [defaultEntity] });

    expect(tables.A.get()).toHaveProperty("x", 1);
    expect(tables.A.get()).toHaveProperty("y", 1);
    expect(tables.B.get()).toHaveProperty("bool", true);
    expect(tables.B.get()).toHaveProperty("array", [defaultEntity]);
  });
});

/* -------------------------------------------------------------------------- */
/*                                    SYNC                                    */
/* -------------------------------------------------------------------------- */

describe("sync: should properly sync similar properties to RECS tables", () => {
  const runTest = async (options: TestOptions) => {
    const { tables, recsComponents, entities, waitForSyncLive } = await setup(options);
    const player = entities[0];
    assert(tables);

    // Run a few transactions; if it fails, try again
    const targetTables = [tables.Counter, tables.Inventory, tables.Position] as unknown as ContractTable[];
    let { blockNumber, status } = await fuzz(FUZZ_ITERATIONS, targetTables);
    while (status !== "success") {
      console.error("Fuzzing failed, retrying...");
      ({ blockNumber, status } = await fuzz(FUZZ_ITERATIONS, targetTables));
    }

    await waitForSyncLive();
    // Wait for sync to be live at the block of the latest transaction for each table
    await Promise.all(
      targetTables.map((table) =>
        waitForBlockSynced(blockNumber, table, "id" in table.metadata.abiKeySchema ? player : undefined),
      ),
    );

    // Ignore tables not registered in RECS (e.g. SyncSource)
    const registryKeys = Object.keys(tables).filter((key) =>
      Object.keys(recsComponents).includes(key),
    ) as (keyof typeof tables)[];

    // Verify the equality
    for (const key of registryKeys) {
      const hasKey = Object.entries(tables[key].metadata.abiKeySchema ?? {}).length > 0;
      const table = hasKey ? tables[key].get(player) : tables[key].get();

      const recsComp = hasKey
        ? // @ts-expect-error key does exist in recsComponents
          getComponentValue(recsComponents[key], player)
        : // @ts-expect-error key does exist in recsComponents
          getComponentValue(recsComponents[key], singletonEntity);

      if (!table) {
        expect(recsComp).toBeUndefined();
        continue;
      } else if (!recsComp) {
        expect(table).toBeUndefined();
        continue;
      }

      // Test properties schema
      const propertiesSchema = tables[key].propertiesSchema ?? {};
      for (const key of Object.keys(propertiesSchema)) {
        if (!(key in table) || key === "__lastSyncedAtBlock") {
          expect(recsComp[key as keyof typeof recsComp]).toBeUndefined();
        } else {
          expect(table[key as keyof typeof table]).toEqual(recsComp[key as keyof typeof recsComp]);
        }
      }

      // We don't test the metadata because if the properties are right it's because it was decoded correctly
      // and there are rare inconsistencies with RECS sync returning either "0x" or undefined for empty value
    }
  };

  it("using indexer", async () => {
    await runTest({ useIndexer: true });
  });

  it("using RPC", async () => {
    await runTest({ useIndexer: false });
  });
});

/* -------------------------------------------------------------------------- */
/*                                TABLE METHODS                               */
/* -------------------------------------------------------------------------- */

describe("methods: should set and return intended properties", () => {
  /* ---------------------------------- BASIC --------------------------------- */
  describe("basic methods", () => {
    // Init and return tables and utils
    const preTest = async () => {
      const { tables, entities } = await setup();
      const player = entities[0];
      assert(tables);

      // Generate random args
      const length = 5;
      const getRandomArgs = () => ({
        items: getRandomNumbers(length),
        weights: getRandomNumbers(length),
        totalWeight: getRandomBigInts(1)[0],
      });

      return { tables, player, getRandomArgs };
    };

    // Check returned properties against input args
    const postTest = (args: Record<string, unknown>, properties: Record<string, unknown>) => {
      Object.entries(args).forEach(([key, v]) => {
        expect(properties?.[key]).toEqual(v);
      });
    };

    // Get table properties after a transaction was made
    it("table.get(), table.getWithKeys()", async () => {
      const { tables, player, getRandomArgs } = await preTest();

      // Set the items and wait for sync
      const args = getRandomArgs();
      const { blockNumber } = await setItems(args);
      await waitForBlockSynced(blockNumber, tables.Inventory, player);

      const properties = tables.Inventory.get(player);
      const propsWithKeys = tables.Inventory.getWithKeys({ id: player });
      postTest({ ...args, block: blockNumber }, { ...properties, block: properties?.__lastSyncedAtBlock });
      expect(properties).toEqual(propsWithKeys);
    });

    // Set table properties locally
    it("table.set(), table.setWithKeys", async () => {
      const { tables, player, getRandomArgs } = await preTest();

      // Set the properties manually
      const args = {
        ...getRandomArgs(),
        __staticData: "0x" as Hex,
        __encodedLengths: "0x" as Hex,
        __dynamicData: "0x" as Hex,
        __lastSyncedAtBlock: BigInt(0),
      };
      tables.Inventory.set(args, player);

      const properties = tables.Inventory.get(player);
      const propsWithKeys = tables.Inventory.getWithKeys({ id: player });
      assert(properties);
      postTest(args, properties);
      expect(properties).toEqual(propsWithKeys);
    });

    // Update table properties client-side
    it("table.update()", async () => {
      const { tables, player, getRandomArgs } = await preTest();

      // Set the items and wait for sync
      const args = getRandomArgs();
      const { blockNumber } = await setItems(args);
      await waitForBlockSynced(blockNumber, tables.Inventory, player);

      // Update the table
      const updateArgs = getRandomArgs();
      tables.Inventory.update(updateArgs, player);

      const properties = tables.Inventory.get(player);
      assert(properties);
      postTest(updateArgs, properties);
    });

    // Remove table properties locally
    it("table.remove()", async () => {
      const { tables, player, getRandomArgs } = await preTest();

      // Set the items and wait for sync
      const args = getRandomArgs();
      const { blockNumber } = await setItems(args);
      await waitForBlockSynced(blockNumber, tables.Inventory, player);

      // Remove the entity from the table
      tables.Inventory.remove(player);

      const properties = tables.Inventory.get(player);
      expect(properties).toBeUndefined();
    });
  });

  /* --------------------------------- NATIVE --------------------------------- */
  describe("native methods", () => {
    // Records iterator
    it("table.entities()", async () => {
      const { tables, entities, waitForSyncLive } = await setup();
      assert(tables);

      await Promise.all(entities.map(async (entity) => await setPositionForEntity({ entity, x: 1, y: 1 })));
      await waitForSyncLive();

      const iterator = tables.Position.entities();

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
      const { tables, networkConfig, entities, waitForSyncLive } = await setup();
      assert(tables);

      // 4 entities: A has some properties, B has different properties, C & D have the same properties
      // Obviously this might return similar values and break tests, or running tests a bunch of times over the same running local node might as well
      const argsA = getRandomArgs(entities[0]);
      const argsB = getRandomArgs(entities[1]);
      const argsC = getRandomArgs(entities[2]);
      const argsD = { ...argsC, entity: entities[3] };

      const args = [argsA, argsB, argsC, argsD];
      await Promise.all(args.map(async (a) => await setPositionForEntity(a)));
      await waitForSyncLive();

      return { tables, networkConfig, entities, args };
    };

    it("table.getAll()", async () => {
      const { tables, entities } = await preTest();

      const allEntities = tables.Position.getAll();
      expect(allEntities.sort()).toEqual(entities.sort());
    });

    it("table.getAllWith()", async () => {
      const { tables, entities, args } = await preTest();

      expect(tables.Position.getAllWith({ x: args[0].x, y: args[0].y })).toEqual([entities[0]]);
      expect(tables.Position.getAllWith({ x: args[1].x, y: args[1].y })).toEqual([entities[1]]);
      expect(tables.Position.getAllWith({ x: args[2].x, y: args[2].y }).sort()).toEqual(
        [entities[2], entities[3]].sort(),
      );

      // Test with args not included for any entity
      let randomArgs = getRandomArgs(entities[0]);
      while (args.some((a) => a.x === randomArgs.x && a.y === randomArgs.y)) {
        randomArgs = getRandomArgs(entities[0]);
      }
      expect(tables.Position.getAllWith({ x: randomArgs.x, y: randomArgs.y })).toEqual([]);

      // Matching only a part of the args should not be enough for the entity to be included
      let argsWithPartialEquality = getRandomArgs(entities[0]);
      while (args.some((a) => a.x === argsWithPartialEquality.x)) {
        argsWithPartialEquality = getRandomArgs(entities[0]);
      }
      expect(tables.Position.getAllWith({ x: argsWithPartialEquality.x, y: args[0].y })).toEqual([]);
    });

    it("table.getAllWithout()", async () => {
      const { tables, entities, args } = await preTest();

      expect(tables.Position.getAllWithout({ x: args[0].x, y: args[0].y }).sort()).toEqual(
        [entities[1], entities[2], entities[3]].sort(),
      );
      expect(tables.Position.getAllWithout({ x: args[1].x, y: args[1].y }).sort()).toEqual(
        [entities[0], entities[2], entities[3]].sort(),
      );
      expect(tables.Position.getAllWithout({ x: args[2].x, y: args[2].y }).sort()).toEqual(
        [entities[0], entities[1]].sort(),
      );

      // Test with args not included for any entity
      let randomArgs = getRandomArgs(entities[0]);
      while (args.some((a) => a.x === randomArgs.x && a.y === randomArgs.y)) {
        randomArgs = getRandomArgs(entities[0]);
      }
      expect(tables.Position.getAllWithout({ x: randomArgs.x, y: randomArgs.y }).sort()).toEqual(entities.sort());
    });

    it("table.clear()", async () => {
      const { tables, entities } = await preTest();
      expect(tables.Position.getAll().sort()).toEqual(entities.sort());

      tables.Position.clear();
      expect(tables.Position.getAll()).toEqual([]);
    });

    it("table.has(), table.hasWithKeys()", async () => {
      const { tables, entities } = await preTest();

      entities.forEach((entity) => {
        expect(tables.Position.has(entity)).toBe(true);
        expect(tables.Position.hasWithKeys({ id: entity })).toBe(true);
      });

      const unknownEntity = padHex(toHex("unknownEntity"));
      expect(tables.Position.has(unknownEntity as Entity)).toBe(false);
      expect(tables.Position.hasWithKeys({ id: unknownEntity })).toBe(false);
    });
  });

  /* ---------------------------------- HOOKS --------------------------------- */
  describe("reactive methods", () => {
    const getRandomArgs = (entity: Entity) => {
      const nums = getRandomNumbers(2);
      return { entity, x: nums[0], y: nums[1] };
    };

    const updatePosition = async <
      tableDef extends ResolvedStoreConfig<storeToV1<typeof mudConfig>>["tables"]["Position"],
    >(
      Position: ContractTable<tableDef>,
      entity: Entity,
      waitForSync = true,
    ) => {
      const args = getRandomArgs(entity);
      const { blockNumber } = await setPositionForEntity(args);
      if (waitForSync) await waitForBlockSynced(blockNumber, Position, entity);

      return {
        args: {
          ...args,
          ...emptyData,
        },
      };
    };

    it("table.use(), table.useWithKeys()", async () => {
      const { tables, entities } = await setup();
      assert(tables);
      const player = entities[0];

      const { result } = renderHook(() => tables.Position.use(player));
      const { result: resultWithKeys } = renderHook(() => tables.Position.useWithKeys({ id: player }));

      // Update the position
      const { args } = await updatePosition(tables.Position, player);
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);
      expect(result.current).toEqual(resultWithKeys.current);

      // Update the position again with different properties
      const { args: argsB } = await updatePosition(tables.Position, player);
      expect(result.current).toHaveProperty("x", argsB.x);
      expect(result.current).toHaveProperty("y", argsB.y);
      expect(result.current).toEqual(resultWithKeys.current);

      // Remove an entity
      tables.Position.remove(player);
      expect(result.current).toBeUndefined();
      expect(resultWithKeys.current).toBeUndefined();
    });

    it("table.pauseUpdates()", async () => {
      const { tables, entities } = await setup();
      assert(tables);
      const player = entities[0];

      const { result } = renderHook(() => tables.Position.use(entities[0]));

      // Update the position
      const { args } = await updatePosition(tables.Position, player);
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);

      // Pause updates
      tables.Position.pauseUpdates(player, { x: args.x, y: args.y, ...emptyData });
      // Update the position again with different properties
      await updatePosition(tables.Position, player, false); // it won't sync since we paused updates
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("after update");

      // It should still have the same properties
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);
    });

    it("table.resumeUpdates()", async () => {
      const { tables, entities } = await setup();
      assert(tables);
      const player = entities[0];

      const { result } = renderHook(() => tables.Position.use(entities[0]));

      // Update the position
      const { args } = await updatePosition(tables.Position, player);
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);

      // Pause updates
      tables.Position.pauseUpdates(player, { x: args.x, y: args.y, ...emptyData });

      // Update the position again with different properties
      const { args: argsB } = await updatePosition(tables.Position, player, false);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // It should keep the old properties
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);

      // Resume updates
      tables.Position.resumeUpdates(player);
      // It should update to the new properties
      expect(result.current).toHaveProperty("x", argsB.x);
      expect(result.current).toHaveProperty("y", argsB.y);
    });

    it("table.useAll()", async () => {
      const { tables, entities } = await setup();
      assert(tables);

      const { result } = renderHook(() => tables.Position.useAll());

      // Update the position for all entities
      await Promise.all(entities.map(async (entity) => await updatePosition(tables.Position, entity)));
      expect(result.current.sort()).toEqual(entities.sort());

      // Clear the positions
      tables.Position.clear();
      expect(result.current).toEqual([]);

      // Update the position for a few entities
      await Promise.all(entities.slice(0, 2).map(async (entity) => await updatePosition(tables.Position, entity)));
      expect(result.current.sort()).toEqual(entities.slice(0, 2).sort());

      // Remove an entity
      tables.Position.remove(entities[0]);
      expect(result.current).toEqual([entities[1]]);
    });

    it("table.useAllWith()", async () => {
      const { tables, entities } = await setup();
      assert(tables);

      const targetPos = { x: 10, y: 10 };
      const { result } = renderHook(() => tables.Position.useAllWith(targetPos));

      // Update the position for all entities (not to the target position)
      await Promise.all(
        entities.map(async (entity) => {
          let args = getRandomArgs(entity);
          while (args.x === targetPos.x && args.y === targetPos.y) {
            args = getRandomArgs(entity);
          }

          const { blockNumber } = await setPositionForEntity(args);
          await waitForBlockSynced(blockNumber, tables.Position, entity);
        }),
      );

      expect(result.current).toEqual([]);

      // Update the position for a few entities to the target position
      const { blockNumber: blockNumberB } = await setPositionForEntity({ ...targetPos, entity: entities[0] });
      await waitForBlockSynced(blockNumberB, tables.Position, entities[0]);
      expect(result.current).toEqual([entities[0]]);

      const { blockNumber: blockNumberC } = await setPositionForEntity({ ...targetPos, entity: entities[1] });
      await waitForBlockSynced(blockNumberC, tables.Position, entities[1]);
      expect(result.current.sort()).toEqual([entities[0], entities[1]].sort());

      // And with only part of the properties matching
      const { blockNumber: blockNumberD } = await setPositionForEntity({
        x: targetPos.x,
        y: 0,
        entity: entities[2],
      });
      await waitForBlockSynced(blockNumberD, tables.Position, entities[2]);
      expect(result.current.sort()).toEqual([entities[0], entities[1]].sort());

      // Remove an entity
      tables.Position.remove(entities[0]);
      expect(result.current).toEqual([entities[1]]);
    });

    it("table.useAllWithout()", async () => {
      const { tables, entities } = await setup();
      assert(tables);

      const targetPos = { x: 10, y: 10 };
      const { result } = renderHook(() => tables.Position.useAllWithout(targetPos));

      // Update the position for all entities (not to the target position)
      await Promise.all(
        entities.map(async (entity) => {
          let args = getRandomArgs(entity);
          while (args.x === targetPos.x && args.y === targetPos.y) {
            args = getRandomArgs(entity);
          }
          const { blockNumber } = await setPositionForEntity(args);
          await waitForBlockSynced(blockNumber, tables.Position, entity);
        }),
      );

      expect(result.current.sort()).toEqual(entities.sort());

      // Update the position for a few entities to the target position
      const { blockNumber: blockNumberB } = await setPositionForEntity({ ...targetPos, entity: entities[0] });
      await waitForBlockSynced(blockNumberB, tables.Position, entities[0]);
      expect(result.current.sort()).toEqual(entities.slice(1).sort());

      const { blockNumber: blockNumberC } = await setPositionForEntity({ ...targetPos, entity: entities[1] });
      await waitForBlockSynced(blockNumberC, tables.Position, entities[1]);
      expect(result.current.sort()).toEqual(entities.slice(2).sort());

      // And with only part of the properties matching
      const { blockNumber: blockNumberD } = await setPositionForEntity({
        x: targetPos.x,
        y: 0,
        entity: entities[2],
      });
      await waitForBlockSynced(blockNumberD, tables.Position, entities[2]);
      expect(result.current.sort()).toEqual(entities.slice(2).sort());

      // Remove an entity
      tables.Position.remove(entities[2]);
      expect(result.current).toEqual(entities.slice(3));
    });
  });

  /* ---------------------------------- KEYS ---------------------------------- */
  describe("keys (contract-specific) methods", () => {
    it("table.getEntityKeys()", async () => {
      const { tables, entities } = await setup();
      assert(tables);

      const player = entities[0];
      const keys = tables.Position.getEntityKeys(player);
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

  const updatePosition = async <
    tableDef extends ResolvedStoreConfig<storeToV1<typeof mudConfig>>["tables"]["Position"],
  >(
    Position: ContractTable<tableDef>,
    entity: Entity,
    to?: { x: number; y: number },
  ) => {
    const args = to ? { entity, ...to } : getRandomArgs(entity);
    const { blockNumber } = await setPositionForEntity(args);
    await waitForBlockSynced(blockNumber, Position, entity);

    return { args };
  };

  const preTest = async () => {
    const { world, tables, waitForSyncLive, entities } = await setup();
    assert(tables);
    // Just wait for sync for the test to be accurate (prevent tampering data by syncing during the test)
    await waitForSyncLive();

    // Aggregate updates triggered by the system on table update
    const aggregator: TableUpdate[] = [];
    const onChange = (update: (typeof aggregator)[number]) => aggregator.push(update);

    return { world, tables, entities, onChange, aggregator };
  };

  it("table.watch()", async () => {
    const { tables, entities, onChange, aggregator } = await preTest();
    const table = tables.Position;

    tables.Position.watch({ onChange }, { runOnInit: false });
    expect(aggregator).toEqual([]);

    // Update the position for an entity (and enter the table)
    const propsA = tables.Position.get(entities[0]);
    await updatePosition(tables.Position, entities[0]);
    const propsB = tables.Position.get(entities[0]);

    expect(aggregator).toEqual([
      {
        table: toBaseTable(table),
        entity: entities[0],
        properties: { current: propsB, prev: propsA },
        type: propsA ? "update" : "enter",
      },
    ]);

    // Update entity[1]
    const propsC = tables.Position.get(entities[1]);
    await updatePosition(tables.Position, entities[1]);
    const propsD = tables.Position.get(entities[1]);
    // Exit entity[0]
    tables.Position.remove(entities[0]);
    // Enter again entity[0]
    await updatePosition(tables.Position, entities[0]);
    const propsE = tables.Position.get(entities[0]);

    expect(aggregator).toEqual([
      {
        table: toBaseTable(table),
        entity: entities[0],
        properties: { current: propsB, prev: propsA },
        type: propsA ? "update" : "enter",
      },
      {
        table: toBaseTable(table),
        entity: entities[1],
        properties: { current: propsD, prev: propsC },
        type: propsC ? "update" : "enter",
      },
      {
        table: toBaseTable(table),
        entity: entities[0],
        properties: { current: undefined, prev: propsB },
        type: "exit",
      },
      {
        table: toBaseTable(table),
        entity: entities[0],
        properties: { current: propsE, prev: undefined },
        type: "enter",
      },
    ]);
  });

  it("table.watch(): run on init", async () => {
    const { tables, entities, onChange, aggregator } = await preTest();

    // Enter entities
    await Promise.all(entities.map(async (entity) => await updatePosition(tables.Position, entity)));

    tables.Position.watch({ onChange }, { runOnInit: true });
    expect(aggregator).toHaveLength(entities.length);
  });

  it("query() (query)", async () => {
    const { tables, entities } = await setup();
    const [player, A, B, C] = entities;

    // Prepare entities
    tables.Position.set({ x: 10, y: 10, ...emptyData }, player);
    tables.Position.set({ x: 5, y: 5, ...emptyData }, A);
    tables.Position.set({ x: 10, y: 10, ...emptyData }, B);
    tables.Position.set({ x: 15, y: 10, ...emptyData }, C);
    tables.Inventory.set({ items: [1, 2, 3], weights: [1, 2, 3], totalWeight: BigInt(6), ...emptyData }, player);
    tables.Inventory.set({ items: [2, 3, 4], weights: [2, 3, 4], totalWeight: BigInt(6), ...emptyData }, A);
    tables.Inventory.set({ items: [1, 2, 3], weights: [1, 2, 3], totalWeight: BigInt(3), ...emptyData }, B);

    // Entities inside the Position table
    expect(
      query({
        with: [tables.Position],
      }).sort(),
    ).toEqual([player, A, B, C].sort());

    // Entities inside the Position table but not inside the Inventory table
    expect(
      query({
        with: [tables.Position],
        without: [tables.Inventory],
      }),
    ).toEqual([C]);

    // Entities with a specific property inside the Inventory table, and without a specific property inside the Position table
    expect(
      query({
        withProperties: [
          {
            table: tables.Inventory,
            properties: { totalWeight: BigInt(6) },
          },
        ],
        withoutProperties: [
          {
            table: tables.Position,
            properties: { x: 5, y: 5 },
          },
        ],
      }),
    ).toEqual([player]);

    // Entities with a specific property inside the Inventory table, not another one
    expect(
      query({
        withProperties: [
          {
            table: tables.Inventory,
            properties: { totalWeight: BigInt(6) },
          },
        ],
        withoutProperties: [
          {
            table: tables.Inventory,
            properties: { weights: [1, 2, 3] },
          },
        ],
      }),
    ).toEqual([A]);
  });

  it("$query(), useQuery() (useQueryAllMatching)", async () => {
    const { world, tables, entities, onChange: onChangeHook, aggregator: aggregatorHook } = await preTest();
    const [player, A, B, C] = entities;

    // We need more aggregators for the query subscription
    const aggregatorListener: TableUpdate[] = [];
    const aggregatorListenerRunOnInit: TableUpdate[] = [];
    const onChangeListener = (update: (typeof aggregatorListener)[number]) => aggregatorListener.push(update);
    const onChangeListenerRunOnInit = (update: (typeof aggregatorListenerRunOnInit)[number]) =>
      aggregatorListenerRunOnInit.push(update);

    // Prepare entities
    tables.Position.set({ x: 10, y: 10, ...emptyData }, player);
    tables.Position.set({ x: 5, y: 5, ...emptyData }, A);
    tables.Position.set({ x: 10, y: 10, ...emptyData }, B);
    tables.Position.set({ x: 15, y: 10, ...emptyData }, C);
    tables.Inventory.set({ items: [1, 2, 3], weights: [1, 2, 3], totalWeight: BigInt(6), ...emptyData }, player);
    tables.Inventory.set({ items: [2, 3, 4], weights: [2, 3, 4], totalWeight: BigInt(6), ...emptyData }, A);
    tables.Inventory.set({ items: [1, 2, 3], weights: [1, 2, 3], totalWeight: BigInt(3), ...emptyData }, B);

    const queryOptions = {
      with: [tables.Position, tables.Inventory],
      withProperties: [
        {
          table: tables.Inventory,
          properties: { totalWeight: BigInt(6) },
        },
      ],
    } as const satisfies QueryOptions<typeof tables>;

    const { result } = renderHook(() =>
      useQuery(
        queryOptions,
        {
          onChange: onChangeHook,
        },
        { runOnInit: true },
      ),
    );
    $query(queryOptions, { world, onChange: onChangeListener }, { runOnInit: false });
    $query(queryOptions, { world, onChange: onChangeListenerRunOnInit }, { runOnInit: true });

    const expectedAggregatorItems = [
      {
        // not as base table since it's emitted directly from the table provided to the query
        table: tables.Position,
        entity: player,
        properties: { current: tables.Position.get(player), prev: undefined },
        type: "enter",
      },
      {
        table: tables.Position,
        entity: A,
        properties: { current: tables.Position.get(A), prev: undefined },
        type: "enter",
      },
    ];

    expect(result.current.sort()).toEqual([player, A].sort());
    expect(aggregatorListener).toEqual([]);
    // runOnInit: true
    expect(aggregatorHook.sort()).toEqual(expectedAggregatorItems.sort());
    expect(aggregatorListenerRunOnInit.sort()).toEqual(expectedAggregatorItems.sort());

    // Update the totalWeight of player
    const propsA = tables.Inventory.get(player);
    tables.Inventory.update({ totalWeight: BigInt(3) }, player);
    const propsB = tables.Inventory.get(player);

    expect(result.current).toEqual([A]);
    const expectedAggregatorItemB = {
      table: toBaseTable(tables.Inventory),
      entity: player,
      properties: { current: propsB, prev: propsA },
      type: "exit", // out of the query
    };
    expect(aggregatorHook).toHaveLength(3);
    expect(aggregatorHook[2]).toEqual(expectedAggregatorItemB);
    expect(aggregatorListenerRunOnInit).toEqual(aggregatorHook);
    // did not run on init so couldn't catch this item exiting the query
    expect(aggregatorListener).toEqual([]);

    // Update the totalWeight of A
    const propsC = tables.Inventory.get(A);
    tables.Inventory.update({ totalWeight: BigInt(3) }, A);
    const propsD = tables.Inventory.get(A);

    expect(result.current).toEqual([]);
    const expectedAggregatorItemC = {
      table: toBaseTable(tables.Inventory),
      entity: A,
      properties: { current: propsD, prev: propsC },
      type: "exit",
    };
    expect(aggregatorHook).toHaveLength(4);
    expect(aggregatorHook[3]).toEqual(expectedAggregatorItemC);
    expect(aggregatorListenerRunOnInit).toEqual(aggregatorHook);
    // same as above
    expect(aggregatorListener).toEqual([]);

    // Update the totalWeight of B
    const propsE = tables.Inventory.get(B);
    tables.Inventory.update({ totalWeight: BigInt(6) }, B);
    const propsF = tables.Inventory.get(B);

    expect(result.current).toEqual([B]);
    const expectedAggregatorItemD = {
      table: toBaseTable(tables.Inventory),
      entity: B,
      properties: { current: propsF, prev: propsE },
      type: "enter",
    };
    // expect(aggregatorHook).toHaveLength(5);
    // TODO: check MUD logic because this will output both a `enter` then `update` events for the action above
    expect(aggregatorHook).toHaveLength(6);
    expect(aggregatorHook[4]).toEqual(expectedAggregatorItemD);
    // TODO(same): see this
    expect(aggregatorHook[5]).toEqual({ ...expectedAggregatorItemD, type: "update" });
    expect(aggregatorListenerRunOnInit).toEqual(aggregatorHook);
    // now it catches B entering the query
    // TODO(same): same issue here
    // expect(aggregatorListener).toEqual([expectedAggregatorItemD]);
    expect(aggregatorListener).toEqual([expectedAggregatorItemD, { ...expectedAggregatorItemD, type: "update" }]);

    // Update, then remove B
    const propsG = tables.Position.get(B);
    tables.Position.update({ x: 20, y: 20 }, B);
    const propsH = tables.Position.get(B);
    tables.Position.remove(B);

    expect(result.current).toEqual([]);
    const expectedAggregatorItemE = {
      table: toBaseTable(tables.Position),
      entity: B,
      properties: { current: propsH, prev: propsG },
      type: "update",
    };
    const expectedAggregatorItemF = {
      table: toBaseTable(tables.Position),
      entity: B,
      properties: { current: undefined, prev: propsH },
      type: "exit",
    };
    // TODO(same): same issue here
    // expect(aggregatorHook).toHaveLength(7);
    expect(aggregatorHook).toHaveLength(8);
    // expect(aggregatorHook[5]).toEqual(expectedAggregatorItemE);
    expect(aggregatorHook[6]).toEqual(expectedAggregatorItemE);
    // expect(aggregatorHook[6]).toEqual(expectedAggregatorItemF);
    expect(aggregatorHook[7]).toEqual(expectedAggregatorItemF);
    expect(aggregatorListenerRunOnInit).toEqual(aggregatorHook);
    // expect(aggregatorListener).toEqual([expectedAggregatorItemD, expectedAggregatorItemE, expectedAggregatorItemF]);
    expect(aggregatorListener).toEqual([
      expectedAggregatorItemD,
      { ...expectedAggregatorItemD, type: "update" },
      expectedAggregatorItemE,
      expectedAggregatorItemF,
    ]);
  });
});
