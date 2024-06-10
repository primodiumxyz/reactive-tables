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
  default$Record,
  query,
  $Record,
  Type,
  TableUpdate,
  useQuery,
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
  setPositionFor$Record,
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

  // Initialize wrapper
  const {
    tables: contractTables,
    tableDefs,
    storageAdapter,
  } = createWrapper({
    world: world,
    mudConfig,
  });
  const localTables = createLocalSyncTables(world);
  const tables = { ...localTables, ...contractTables };

  // Sync tables with the chain
  const sync = createSync({
    contractTables,
    localTables,
    tableDefs,
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

  // Sync RECS registry for comparison
  const { components: recsComponents } = await syncToRecs({
    world: recsWorld,
    config: mudConfig,
    address: networkConfig.worldAddress,
    publicClient: networkConfig.publicClient,
    startBlock: networkConfig.initialBlockNumber,
    indexerUrl: useIndexer ? networkConfig.indexerUrl : undefined,
  });

  // Grab a few records to use across tests (because each test will keep the state of the chain
  // from previous runs)
  const $records = [
    encodeEntity({ address: "address" }, { address: networkConfig.burnerAccount.address }),
    ...["A", "B", "C"].map((id) => padHex(toHex(`record${id}`))),
  ] as $Record[];

  // We want to wait for both registry/tables to be in sync & live
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
    registry: tables,
    tableDefs,
    storageAdapter,
    sync,
    recsComponents,
    $records,
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
  key?: $Record,
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
    const { registry, tableDefs, storageAdapter } = await setup();

    // Verify the existence of the result
    expect(registry).toBeDefined();
    expect(tableDefs).toBeDefined();
    expect(storageAdapter).toBeDefined();
  });
});

describe("local: create local table", () => {
  it("should be able to create tables from local definitions passed during initialization", async () => {
    const world = createWorld();
    const registry = {
      A: createLocalCoordTable(world, { id: "A" }),
      B: createLocalTable(world, { bool: Type.Boolean, array: Type.$RecordArray }),
    };

    registry.A.set({ x: 1, y: 1 });
    registry.B.set({ bool: true, array: [default$Record] });

    expect(registry.A.get()).toHaveProperty("x", 1);
    expect(registry.A.get()).toHaveProperty("y", 1);
    expect(registry.B.get()).toHaveProperty("bool", true);
    expect(registry.B.get()).toHaveProperty("array", [default$Record]);
  });
});

/* -------------------------------------------------------------------------- */
/*                                    SYNC                                    */
/* -------------------------------------------------------------------------- */

describe("sync: should properly sync similar properties to RECS registry", () => {
  const runTest = async (options: TestOptions) => {
    const { registry, recsComponents, $records, waitForSyncLive } = await setup(options);
    const player = $records[0];
    assert(registry);

    // Run a few transactions; if it fails, try again
    const targetTables = [registry.Counter, registry.Inventory, registry.Position] as unknown as ContractTable[];
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
    const registryKeys = Object.keys(registry).filter((key) =>
      Object.keys(recsComponents).includes(key),
    ) as (keyof typeof registry)[];

    // Verify the equality
    for (const key of registryKeys) {
      const hasKey = Object.entries(registry[key].metadata.abiKeySchema ?? {}).length > 0;
      const table = hasKey ? registry[key].get(player) : registry[key].get();

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
      const propertiesSchema = registry[key].propertiesSchema ?? {};
      for (const key of Object.keys(propertiesSchema)) {
        if (!(key in table) || key === "__lastSyncedAtBlock") {
          expect(recsComp[key]).toBeUndefined();
        } else {
          expect(table[key as keyof typeof table]).toEqual(recsComp[key]);
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
    // Init and return registry and utils
    const preTest = async () => {
      const { registry, $records } = await setup();
      const player = $records[0];
      assert(registry);

      // Generate random args
      const length = 5;
      const getRandomArgs = () => ({
        items: getRandomNumbers(length),
        weights: getRandomNumbers(length),
        totalWeight: getRandomBigInts(1)[0],
      });

      return { registry, player, getRandomArgs };
    };

    // Check returned properties against input args
    const postTest = (args: Record<string, unknown>, properties: Record<string, unknown>) => {
      Object.entries(args).forEach(([key, v]) => {
        expect(properties?.[key]).toEqual(v);
      });
    };

    // Get table properties after a transaction was made
    it("table.get(), table.getWithKeys()", async () => {
      const { registry, player, getRandomArgs } = await preTest();

      // Set the items and wait for sync
      const args = getRandomArgs();
      const { blockNumber } = await setItems(args);
      await waitForBlockSynced(blockNumber, registry.Inventory, player);

      const properties = registry.Inventory.get(player);
      const propsWithKeys = registry.Inventory.getWithKeys({ id: player });
      postTest({ ...args, block: blockNumber }, { ...properties, block: properties?.__lastSyncedAtBlock });
      expect(properties).toEqual(propsWithKeys);
    });

    // Set table properties locally
    it("table.set(), table.setWithKeys", async () => {
      const { registry, player, getRandomArgs } = await preTest();

      // Set the properties manually
      const args = {
        ...getRandomArgs(),
        __staticData: "0x" as Hex,
        __encodedLengths: "0x" as Hex,
        __dynamicData: "0x" as Hex,
        __lastSyncedAtBlock: BigInt(0),
      };
      registry.Inventory.set(args, player);

      const properties = registry.Inventory.get(player);
      const propsWithKeys = registry.Inventory.getWithKeys({ id: player });
      assert(properties);
      postTest(args, properties);
      expect(properties).toEqual(propsWithKeys);
    });

    // Update table properties client-side
    it("table.update()", async () => {
      const { registry, player, getRandomArgs } = await preTest();

      // Set the items and wait for sync
      const args = getRandomArgs();
      const { blockNumber } = await setItems(args);
      await waitForBlockSynced(blockNumber, registry.Inventory, player);

      // Update the table
      const updateArgs = getRandomArgs();
      registry.Inventory.update(updateArgs, player);

      const properties = registry.Inventory.get(player);
      assert(properties);
      postTest(updateArgs, properties);
    });

    // Remove table properties locally
    it("table.remove()", async () => {
      const { registry, player, getRandomArgs } = await preTest();

      // Set the items and wait for sync
      const args = getRandomArgs();
      const { blockNumber } = await setItems(args);
      await waitForBlockSynced(blockNumber, registry.Inventory, player);

      // Remove the record from the table
      registry.Inventory.remove(player);

      const properties = registry.Inventory.get(player);
      expect(properties).toBeUndefined();
    });
  });

  /* --------------------------------- NATIVE --------------------------------- */
  describe("native methods", () => {
    // Records iterator
    it("table.$records()", async () => {
      const { registry, $records, waitForSyncLive } = await setup();
      assert(registry);

      await Promise.all($records.map(async ($record) => await setPositionFor$Record({ $record, x: 1, y: 1 })));
      await waitForSyncLive();

      const iterator = registry.Position.$records();

      // It _should_ already include the burner account from previous tests
      // Since we're not sure about the order, we can just test the global output
      const iterations = $records.map(() => iterator.next());
      expect(iterations.map((i) => i.value).sort()).toEqual($records.sort());
      expect(iterator.next()).toEqual({ done: true, value: undefined });
    });
  });

  /* --------------------------------- QUERIES -------------------------------- */
  describe("query methods", () => {
    const getRandomArgs = ($record: $Record) => {
      const nums = getRandomNumbers(2);
      return { $record, x: nums[0], y: nums[1] };
    };

    const preTest = async () => {
      const { registry, networkConfig, $records, waitForSyncLive } = await setup();
      assert(registry);

      // 4 $records: A has some properties, B has different properties, C & D have the same properties
      // Obviously this might return similar values and break tests, or running tests a bunch of times over the same running local node might as well
      const argsA = getRandomArgs($records[0]);
      const argsB = getRandomArgs($records[1]);
      const argsC = getRandomArgs($records[2]);
      const argsD = { ...argsC, $record: $records[3] };

      const args = [argsA, argsB, argsC, argsD];
      await Promise.all(args.map(async (a) => await setPositionFor$Record(a)));
      await waitForSyncLive();

      return { registry, networkConfig, $records, args };
    };

    it("table.getAll()", async () => {
      const { registry, $records } = await preTest();

      const allEntities = registry.Position.getAll();
      expect(allEntities.sort()).toEqual($records.sort());
    });

    it("table.getAllWith()", async () => {
      const { registry, $records, args } = await preTest();

      expect(registry.Position.getAllWith({ x: args[0].x, y: args[0].y })).toEqual([$records[0]]);
      expect(registry.Position.getAllWith({ x: args[1].x, y: args[1].y })).toEqual([$records[1]]);
      expect(registry.Position.getAllWith({ x: args[2].x, y: args[2].y }).sort()).toEqual(
        [$records[2], $records[3]].sort(),
      );

      // Test with args not included for any $record
      let randomArgs = getRandomArgs($records[0]);
      while (args.some((a) => a.x === randomArgs.x && a.y === randomArgs.y)) {
        randomArgs = getRandomArgs($records[0]);
      }
      expect(registry.Position.getAllWith({ x: randomArgs.x, y: randomArgs.y })).toEqual([]);

      // Matching only a part of the args should not be enough for the $record to be included
      let argsWithPartialEquality = getRandomArgs($records[0]);
      while (args.some((a) => a.x === argsWithPartialEquality.x)) {
        argsWithPartialEquality = getRandomArgs($records[0]);
      }
      expect(registry.Position.getAllWith({ x: argsWithPartialEquality.x, y: args[0].y })).toEqual([]);
    });

    it("table.getAllWithout()", async () => {
      const { registry, $records, args } = await preTest();

      expect(registry.Position.getAllWithout({ x: args[0].x, y: args[0].y }).sort()).toEqual(
        [$records[1], $records[2], $records[3]].sort(),
      );
      expect(registry.Position.getAllWithout({ x: args[1].x, y: args[1].y }).sort()).toEqual(
        [$records[0], $records[2], $records[3]].sort(),
      );
      expect(registry.Position.getAllWithout({ x: args[2].x, y: args[2].y }).sort()).toEqual(
        [$records[0], $records[1]].sort(),
      );

      // Test with args not included for any $record
      let randomArgs = getRandomArgs($records[0]);
      while (args.some((a) => a.x === randomArgs.x && a.y === randomArgs.y)) {
        randomArgs = getRandomArgs($records[0]);
      }
      expect(registry.Position.getAllWithout({ x: randomArgs.x, y: randomArgs.y }).sort()).toEqual($records.sort());
    });

    it("table.clear()", async () => {
      const { registry, $records } = await preTest();
      expect(registry.Position.getAll().sort()).toEqual($records.sort());

      registry.Position.clear();
      expect(registry.Position.getAll()).toEqual([]);
    });

    it("table.has(), table.hasWithKeys()", async () => {
      const { registry, $records } = await preTest();

      $records.forEach(($record) => {
        expect(registry.Position.has($record)).toBe(true);
        expect(registry.Position.hasWithKeys({ id: $record })).toBe(true);
      });

      const unknown$Record = padHex(toHex("unknown$Record"));
      expect(registry.Position.has(unknown$Record as $Record)).toBe(false);
      expect(registry.Position.hasWithKeys({ id: unknown$Record })).toBe(false);
    });
  });

  /* ---------------------------------- HOOKS --------------------------------- */
  describe("reactive methods", () => {
    const getRandomArgs = ($record: $Record) => {
      const nums = getRandomNumbers(2);
      return { $record, x: nums[0], y: nums[1] };
    };

    const updatePosition = async <
      tableDef extends ResolvedStoreConfig<storeToV1<typeof mudConfig>>["tables"]["Position"],
    >(
      Position: ContractTable<tableDef>,
      $record: $Record,
    ) => {
      const args = getRandomArgs($record);
      const { blockNumber } = await setPositionFor$Record(args);
      await waitForBlockSynced(blockNumber, Position, $record);

      return {
        args: {
          ...args,
          __staticData: "0x" as Hex,
          __encodedLengths: "0x" as Hex,
          __dynamicData: "0x" as Hex,
          __lastSyncedAtBlock: BigInt(0),
        },
      };
    };

    it("table.use(), table.useWithKeys()", async () => {
      const { registry, $records } = await setup();
      assert(registry);
      const player = $records[0];

      const { result } = renderHook(() => registry.Position.use(player));
      const { result: resultWithKeys } = renderHook(() => registry.Position.useWithKeys({ id: player }));

      // Update the position
      const { args } = await updatePosition(registry.Position, player);
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);
      expect(result.current).toEqual(resultWithKeys.current);

      // Update the position again with different properties
      const { args: argsB } = await updatePosition(registry.Position, player);
      expect(result.current).toHaveProperty("x", argsB.x);
      expect(result.current).toHaveProperty("y", argsB.y);
      expect(result.current).toEqual(resultWithKeys.current);

      // Remove a $record
      registry.Position.remove(player);
      expect(result.current).toBeUndefined();
      expect(resultWithKeys.current).toBeUndefined();
    });

    it("table.pauseUpdates()", async () => {
      const { registry, $records } = await setup();
      assert(registry);
      const player = $records[0];

      const { result } = renderHook(() => registry.Position.use($records[0]));

      // Update the position
      const { args } = await updatePosition(registry.Position, player);
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);

      // Pause updates
      registry.Position.pauseUpdates(player, args);

      // Update the position again with different properties
      await updatePosition(registry.Position, player);

      // It should still have the same properties
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);
    });

    it("table.resumeUpdates()", async () => {
      const { registry, $records } = await setup();
      assert(registry);
      const player = $records[0];

      const { result } = renderHook(() => registry.Position.use($records[0]));

      // Update the position
      const { args } = await updatePosition(registry.Position, player);
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);

      // Pause updates
      registry.Position.pauseUpdates(player, args);

      // Update the position again with different properties
      const { args: argsB } = await updatePosition(registry.Position, player);
      // It should keep the old properties
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);

      // Resume updates
      registry.Position.resumeUpdates(player);
      // It should update to the new properties
      expect(result.current).toHaveProperty("x", argsB.x);
      expect(result.current).toHaveProperty("y", argsB.y);
    });

    it("table.useAll()", async () => {
      const { registry, $records } = await setup();
      assert(registry);

      const { result } = renderHook(() => registry.Position.useAll());

      // Update the position for all $records
      await Promise.all($records.map(async ($record) => await updatePosition(registry.Position, $record)));
      expect(result.current.sort()).toEqual($records.sort());

      // Clear the positions
      registry.Position.clear();
      expect(result.current).toEqual([]);

      // Update the position for a few $records
      await Promise.all($records.slice(0, 2).map(async ($record) => await updatePosition(registry.Position, $record)));
      expect(result.current.sort()).toEqual($records.slice(0, 2).sort());

      // Remove a $record
      registry.Position.remove($records[0]);
      expect(result.current).toEqual([$records[1]]);
    });

    it("table.useAllWith()", async () => {
      const { registry, $records } = await setup();
      assert(registry);

      const targetPos = { x: 10, y: 10 };
      const { result } = renderHook(() => registry.Position.useAllWith(targetPos));

      // Update the position for all $records (not to the target position)
      await Promise.all(
        $records.map(async ($record) => {
          let args = getRandomArgs($record);
          while (args.x === targetPos.x && args.y === targetPos.y) {
            args = getRandomArgs($record);
          }

          const { blockNumber } = await setPositionFor$Record(args);
          await waitForBlockSynced(blockNumber, registry.Position, $record);
        }),
      );

      expect(result.current).toEqual([]);

      // Update the position for a few $records to the target position
      const { blockNumber: blockNumberB } = await setPositionFor$Record({ ...targetPos, $record: $records[0] });
      await waitForBlockSynced(blockNumberB, registry.Position, $records[0]);
      expect(result.current).toEqual([$records[0]]);

      const { blockNumber: blockNumberC } = await setPositionFor$Record({ ...targetPos, $record: $records[1] });
      await waitForBlockSynced(blockNumberC, registry.Position, $records[1]);
      expect(result.current.sort()).toEqual([$records[0], $records[1]].sort());

      // And with only part of the properties matching
      const { blockNumber: blockNumberD } = await setPositionFor$Record({
        x: targetPos.x,
        y: 0,
        $record: $records[2],
      });
      await waitForBlockSynced(blockNumberD, registry.Position, $records[2]);
      expect(result.current.sort()).toEqual([$records[0], $records[1]].sort());

      // Remove a $record
      registry.Position.remove($records[0]);
      expect(result.current).toEqual([$records[1]]);
    });

    it("table.useAllWithout()", async () => {
      const { registry, $records } = await setup();
      assert(registry);

      const targetPos = { x: 10, y: 10 };
      const { result } = renderHook(() => registry.Position.useAllWithout(targetPos));

      // Update the position for all $records (not to the target position)
      await Promise.all(
        $records.map(async ($record) => {
          let args = getRandomArgs($record);
          while (args.x === targetPos.x && args.y === targetPos.y) {
            args = getRandomArgs($record);
          }
          const { blockNumber } = await setPositionFor$Record(args);
          await waitForBlockSynced(blockNumber, registry.Position, $record);
        }),
      );

      expect(result.current.sort()).toEqual($records.sort());

      // Update the position for a few $records to the target position
      const { blockNumber: blockNumberB } = await setPositionFor$Record({ ...targetPos, $record: $records[0] });
      await waitForBlockSynced(blockNumberB, registry.Position, $records[0]);
      expect(result.current.sort()).toEqual($records.slice(1).sort());

      const { blockNumber: blockNumberC } = await setPositionFor$Record({ ...targetPos, $record: $records[1] });
      await waitForBlockSynced(blockNumberC, registry.Position, $records[1]);
      expect(result.current.sort()).toEqual($records.slice(2).sort());

      // And with only part of the properties matching
      const { blockNumber: blockNumberD } = await setPositionFor$Record({
        x: targetPos.x,
        y: 0,
        $record: $records[2],
      });
      await waitForBlockSynced(blockNumberD, registry.Position, $records[2]);
      expect(result.current.sort()).toEqual($records.slice(2).sort());

      // Remove a $record
      registry.Position.remove($records[2]);
      expect(result.current).toEqual($records.slice(3));
    });
  });

  /* ---------------------------------- KEYS ---------------------------------- */
  describe("keys (contract-specific) methods", () => {
    it("table.get$RecordKeys()", async () => {
      const { registry, $records } = await setup();
      assert(registry);

      const player = $records[0];
      const keys = registry.Position.get$RecordKeys(player);
      expect(keys).toEqual({ id: player });
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                                   QUERIES                                  */
/* -------------------------------------------------------------------------- */

describe("queries: should emit appropriate update events with the correct data", () => {
  const getRandomArgs = ($record: $Record) => {
    const nums = getRandomNumbers(2);
    return { $record, x: nums[0], y: nums[1] };
  };

  const updatePosition = async <
    tableDef extends ResolvedStoreConfig<storeToV1<typeof mudConfig>>["tables"]["Position"],
  >(
    Position: ContractTable<tableDef>,
    $record: $Record,
    to?: { x: number; y: number },
  ) => {
    const args = to ? { $record, ...to } : getRandomArgs($record);
    const { blockNumber } = await setPositionFor$Record(args);
    await waitForBlockSynced(blockNumber, Position, $record);

    return { args };
  };

  const preTest = async () => {
    const { world, registry, waitForSyncLive, $records } = await setup();
    assert(registry);
    // Just wait for sync for the test to be accurate (prevent tampering data by syncing during the test)
    await waitForSyncLive();

    // Aggregate updates triggered by the system on table update
    const aggregator: TableUpdate[] = [];
    const onUpdate = (update: (typeof aggregator)[number]) => aggregator.push(update);

    return { world, registry, $records, onUpdate, aggregator };
  };

  it("table.watch()", async () => {
    const { registry, $records, onUpdate, aggregator } = await preTest();
    const table = registry.Position;

    registry.Position.watch({ onUpdate }, { runOnInit: false });
    expect(aggregator).toEqual([]);

    // Update the position for a $record (and enter the table)
    const propsA = registry.Position.get($records[0]);
    await updatePosition(registry.Position, $records[0]);
    const propsB = registry.Position.get($records[0]);

    expect(aggregator).toEqual([
      {
        table: toBaseTable(table),
        $record: $records[0],
        properties: { current: propsB, prev: propsA },
        type: propsA ? "change" : "enter",
      },
    ]);

    // Update $record[1]
    const propsC = registry.Position.get($records[1]);
    await updatePosition(registry.Position, $records[1]);
    const propsD = registry.Position.get($records[1]);
    // Exit $record[0]
    registry.Position.remove($records[0]);
    // Enter again $record[0]
    await updatePosition(registry.Position, $records[0]);
    const propsE = registry.Position.get($records[0]);

    expect(aggregator).toEqual([
      {
        table: toBaseTable(table),
        $record: $records[0],
        properties: { current: propsB, prev: propsA },
        type: propsA ? "change" : "enter",
      },
      {
        table: toBaseTable(table),
        $record: $records[1],
        properties: { current: propsD, prev: propsC },
        type: propsC ? "change" : "enter",
      },
      {
        table: toBaseTable(table),
        $record: $records[0],
        properties: { current: undefined, prev: propsB },
        type: "exit",
      },
      {
        table: toBaseTable(table),
        $record: $records[0],
        properties: { current: propsE, prev: undefined },
        type: "enter",
      },
    ]);
  });

  it("table.watch(): run on init", async () => {
    const { registry, $records, onUpdate, aggregator } = await preTest();

    // Enter $records
    await Promise.all($records.map(async ($record) => await updatePosition(registry.Position, $record)));

    registry.Position.watch({ onUpdate }, { runOnInit: true });
    expect(aggregator).toHaveLength($records.length);
  });

  it("query() (query)", async () => {
    const { registry, $records } = await setup();
    const [player, A, B, C] = $records;

    // Prepare $records
    registry.Position.set({ x: 10, y: 10, ...emptyData }, player);
    registry.Position.set({ x: 5, y: 5, ...emptyData }, A);
    registry.Position.set({ x: 10, y: 10, ...emptyData }, B);
    registry.Position.set({ x: 15, y: 10, ...emptyData }, C);
    registry.Inventory.set({ items: [1, 2, 3], weights: [1, 2, 3], totalWeight: BigInt(6), ...emptyData }, player);
    registry.Inventory.set({ items: [2, 3, 4], weights: [2, 3, 4], totalWeight: BigInt(6), ...emptyData }, A);
    registry.Inventory.set({ items: [1, 2, 3], weights: [1, 2, 3], totalWeight: BigInt(3), ...emptyData }, B);

    // Entities inside the Position table
    expect(
      query({
        with: [registry.Position],
      }).sort(),
    ).toEqual([player, A, B, C].sort());

    // Entities inside the Position table but not inside the Inventory table
    expect(
      query({
        with: [registry.Position],
        without: [registry.Inventory],
      }),
    ).toEqual([C]);

    // Entities with a specific property inside the Inventory table, and without a specific property inside the Position table
    expect(
      query({
        withProperties: [
          {
            table: registry.Inventory,
            properties: { totalWeight: BigInt(6) },
          },
        ],
        withoutProperties: [
          {
            table: registry.Position,
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
            table: registry.Inventory,
            properties: { totalWeight: BigInt(6) },
          },
        ],
        withoutProperties: [
          {
            table: registry.Inventory,
            properties: { weights: [1, 2, 3] },
          },
        ],
      }),
    ).toEqual([A]);
  });

  it.only("$query(), useQuery() (useQueryAllMatching)", async () => {
    const { world, registry, $records, onUpdate: onUpdateHook, aggregator: aggregatorHook } = await preTest();
    const [player, A, B, C] = $records;

    // We need another aggregator for the global query
    const aggregatorListener: TableUpdate[] = [];
    const onUpdateListener = (update: (typeof aggregatorListener)[number]) => aggregatorListener.push(update);

    // Prepare $records
    registry.Position.set({ x: 10, y: 10, ...emptyData }, player);
    registry.Position.set({ x: 5, y: 5, ...emptyData }, A);
    registry.Position.set({ x: 10, y: 10, ...emptyData }, B);
    registry.Position.set({ x: 15, y: 10, ...emptyData }, C);
    registry.Inventory.set({ items: [1, 2, 3], weights: [1, 2, 3], totalWeight: BigInt(6), ...emptyData }, player);
    registry.Inventory.set({ items: [2, 3, 4], weights: [2, 3, 4], totalWeight: BigInt(6), ...emptyData }, A);
    registry.Inventory.set({ items: [1, 2, 3], weights: [1, 2, 3], totalWeight: BigInt(3), ...emptyData }, B);

    const queryOptions = {
      with: [registry.Position],
      withProperties: [
        {
          table: registry.Inventory,
          properties: { totalWeight: BigInt(6) },
        },
      ],
    };

    const { result } = renderHook(() =>
      useQuery(
        queryOptions,
        {
          onUpdate: onUpdateHook,
        },
        { runOnInit: true },
      ),
    );
    $query(world, queryOptions, { onUpdate: onUpdateListener }, { runOnInit: false });

    expect(result.current.sort()).toEqual([player, A].sort());
    expect(aggregatorListener).toEqual([]);
    // The hook aggregator has run on init true by default
    expect(aggregatorHook.sort()).toEqual([
      {
        table: registry.Position, // on init we don't know about specific tables
        $record: player,
        properties: { current: registry.Position.get(player), prev: undefined }, // same for properties
        type: "enter",
      },
      {
        table: registry.Position,
        $record: A,
        properties: { current: registry.Position.get(A), prev: undefined },
        type: "enter",
      },
    ]);

    // Update the totalWeight of player
    const propsA = registry.Inventory.get(player);
    registry.Inventory.update({ totalWeight: BigInt(3) }, player);
    const propsB = registry.Inventory.get(player);

    expect(result.current).toEqual([A]);
    const expectedAggregatorItem = {
      table: registry.Inventory,
      $record: player,
      properties: { current: propsB, prev: propsA },
      type: "exit", // out of the query
    };
    expect(aggregatorListener).toEqual([expectedAggregatorItem]);
    expect(aggregatorListener).toHaveLength(3);
    // expect(aggregatorListener[2]).toEqual(expectedAggregatorItem);

    // Update the totalWeight of A
    const propsC = registry.Inventory.get(A);
    registry.Inventory.update({ totalWeight: BigInt(3) }, A);
    const propsD = registry.Inventory.get(A);

    // expect(result.current).toEqual([]);
    const expectedAggregatorItemB = {
      table: registry.Inventory,
      $record: A,
      properties: { current: propsD, prev: propsC },
      type: "exit",
    };
    expect(aggregatorHook).toHaveLength(2);
    expect(aggregatorListener).toHaveLength(4);
    expect(aggregatorHook[1]).toEqual(expectedAggregatorItemB);
    expect(aggregatorListener[3]).toEqual(expectedAggregatorItemB);

    // Update the totalWeight of B
    const propsE = registry.Inventory.get(B);
    registry.Inventory.update({ totalWeight: BigInt(6) }, B);
    const propsF = registry.Inventory.get(B);

    // expect(result.current).toEqual([B]);
    const expectedAggregatorItemC = {
      table: registry.Inventory,
      $record: B,
      properties: { current: propsF, prev: propsE },
      type: "enter",
    };
    expect(aggregatorHook).toHaveLength(3);
    expect(aggregatorListener).toHaveLength(5);
    expect(aggregatorHook[2]).toEqual(expectedAggregatorItemC);
    expect(aggregatorListener[4]).toEqual(expectedAggregatorItemC);

    // Update, then remove B
    const propsG = registry.Position.get(B);
    registry.Position.update({ x: 20, y: 20 }, B);
    const propsH = registry.Position.get(B);
    registry.Position.remove(B);

    expect(result.current).toEqual([]);
    const expectedAggregatorItemD = {
      table: registry.Position,
      $record: B,
      properties: { current: propsH, prev: propsG },
      type: "change",
    };
    const expectedAggregatorItemE = {
      table: registry.Position,
      $record: B,
      properties: { current: undefined, prev: propsH },
      type: "exit",
    };
    expect(aggregatorHook).toHaveLength(5);
    expect(aggregatorListener).toHaveLength(7);
    expect(aggregatorHook[3]).toEqual(expectedAggregatorItemD);
    expect(aggregatorHook[4]).toEqual(expectedAggregatorItemE);
    expect(aggregatorListener[5]).toEqual(expectedAggregatorItemD);
    expect(aggregatorListener[6]).toEqual(expectedAggregatorItemE);
  });
});
