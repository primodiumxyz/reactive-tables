import { describe, it, expect, assert } from "vitest";
import { renderHook } from "@testing-library/react-hooks";

// libs
import { createWorld, getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity, syncToRecs } from "@latticexyz/store-sync/recs";
import { ResolvedStoreConfig } from "@latticexyz/store/config";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { padHex, toHex } from "viem";

// src
import {
  ContractTable,
  $query,
  createLocalTable,
  createLocalCoordTable,
  createWrapper,
  default$Record,
  query,
  $Record,
  PropType,
  TableUpdate,
  useQuery,
  ContractTableDef,
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
} from "@/__tests__/utils";
import mudConfig from "@/__tests__/contracts/mud.config";

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

const setup = async (options: TestOptions = { useIndexer: false }) => {
  const { useIndexer } = options;
  const world = createWorld();

  // Initialize wrapper
  const {
    registry: contractRegistry,
    tableDefs,
    store,
    storageAdapter,
  } = createWrapper({
    mudConfig: mudConfig,
  });
  const localRegistry = createLocalSyncTables(store);
  const registry = { ...contractRegistry, ...localRegistry };

  // Sync tables with the chain
  const sync = createSync({
    registry: localRegistry,
    store: store,
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
    world,
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

      const tinyBaseSync = registry.SyncStatus.get();
      const recsSync = getComponentValue(recsComponents.SyncProgress, singletonEntity);
      synced = tinyBaseSync?.step === SyncStep.Live && recsSync?.step === "live";
    }
  };

  return {
    registry,
    tableDefs,
    store,
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
    const { registry, tableDefs, store, storageAdapter } = await setup();

    // Verify the existence of the result
    expect(registry).toBeDefined();
    expect(tableDefs).toBeDefined();
    expect(store).toBeDefined();
    expect(storageAdapter).toBeDefined();
  });
});

describe("local: create local table", () => {
  it("should be able to create tables from local definitions passed during initialization", async () => {
    // Initialize wrapper
    const { store } = createWrapper({
      mudConfig: mudConfig,
    });

    const registry = {
      A: createLocalCoordTable(store, { id: "A" }),
      B: createLocalTable(store, { bool: PropType.Boolean, array: PropType.$RecordArray }),
      // with default properties
      C: createLocalTable(store, { value: PropType.Number }, { id: "C" }, { value: 10 }),
    };

    registry.A.set({ x: 1, y: 1 });
    registry.B.set({ bool: true, array: [default$Record] });

    expect(registry.A.get()).toHaveProperty("x", 1);
    expect(registry.A.get()).toHaveProperty("y", 1);
    expect(registry.B.get()).toHaveProperty("bool", true);
    expect(registry.B.get()).toHaveProperty("array", [default$Record]);
    expect(registry.C.get()).toHaveProperty("value", 10);
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
        waitForBlockSynced(blockNumber, table, table.metadata.keySchema.id ? player : undefined),
      ),
    );

    // Ignore tables not registered in RECS (e.g. SyncSource)
    const registryKeys = Object.keys(registry).filter((key) =>
      Object.keys(recsComponents).includes(key),
    ) as (keyof typeof registry)[];

    // Verify the equality
    for (const key of registryKeys) {
      const hasKey = Object.entries(registry[key].metadata.keySchema ?? {}).length > 0;
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
      const propertiesSchema = registry[key].metadata.propertiesSchema ?? {};
      for (const key of Object.keys(propertiesSchema)) {
        if (!(key in table)) {
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
    it("get(), getWithKeys()", async () => {
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
    it("set(), setWithKeys", async () => {
      const { registry, player, getRandomArgs } = await preTest();

      // Set the properties manually
      const args = {
        ...getRandomArgs(),
        __staticData: "0x",
        __encodedLengths: "0x",
        __dynamicData: "0x",
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
    it("update()", async () => {
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
    it("remove()", async () => {
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
    it("$records()", async () => {
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

    it("getAll()", async () => {
      const { registry, $records } = await preTest();

      const allEntities = registry.Position.getAll();
      expect(allEntities.sort()).toEqual($records.sort());
    });

    it("getAllWith()", async () => {
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

    it("getAllWithout()", async () => {
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

    it("clear()", async () => {
      const { registry, $records } = await preTest();
      expect(registry.Position.getAll().sort()).toEqual($records.sort());

      registry.Position.clear();
      expect(registry.Position.getAll()).toEqual([]);
    });

    it("has(), hasWithKeys()", async () => {
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
          __staticData: "0x",
          __encodedLengths: "0x",
          __dynamicData: "0x",
          __lastSyncedAtBlock: BigInt(0),
        },
      };
    };

    it("use(), useWithKeys()", async () => {
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

      // Remove an $record
      registry.Position.remove(player);
      expect(result.current).toBeUndefined();
      expect(resultWithKeys.current).toBeUndefined();
    });

    it("pauseUpdates()", async () => {
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

    it("resumeUpdates()", async () => {
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

    it("useAll()", async () => {
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

      // Remove an $record
      registry.Position.remove($records[0]);
      expect(result.current).toEqual([$records[1]]);
    });

    it("useAllWith()", async () => {
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

      // Remove an $record
      registry.Position.remove($records[0]);
      expect(result.current).toEqual([$records[1]]);
    });

    it("useAllWithout()", async () => {
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

      // Remove an $record
      registry.Position.remove($records[2]);
      expect(result.current).toEqual($records.slice(3));
    });
  });

  /* ---------------------------------- KEYS ---------------------------------- */
  describe("keys (contract-specific) methods", () => {
    it("get$RecordKeys()", async () => {
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
    const { registry, store, waitForSyncLive, $records } = await setup();
    assert(registry);
    // Just wait for sync for the test to be accurate (prevent tampering data by syncing during the test)
    await waitForSyncLive();

    // Aggregate updates triggered by the system on table changes
    const aggregator: TableUpdate<typeof registry.Position.schema | typeof registry.Inventory.schema>[] = [];
    const onChange = (update: (typeof aggregator)[number]) => aggregator.push(update);

    return { registry, store, $records, onChange, aggregator };
  };

  it("createTableWatcher(): without query", async () => {
    const { registry, $records, onChange, aggregator } = await preTest();
    const tableId = registry.Position.id;

    const { unsubscribe } = registry.Position.watch({
      onChange,
      options: { runOnInit: false },
    });
    expect(aggregator).toEqual([]);

    // Update the position for an $record (and enter the table)
    const propsA = registry.Position.get($records[0]);
    await updatePosition(registry.Position, $records[0]);
    const propsB = registry.Position.get($records[0]);

    expect(aggregator).toEqual([
      {
        tableId,
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
        tableId,
        $record: $records[0],
        properties: { current: propsB, prev: propsA },
        type: propsA ? "change" : "enter",
      },
      {
        tableId,
        $record: $records[1],
        properties: { current: propsD, prev: propsC },
        type: propsC ? "change" : "enter",
      },
      { tableId, $record: $records[0], properties: { current: undefined, prev: propsB }, type: "exit" },
      { tableId, $record: $records[0], properties: { current: propsE, prev: undefined }, type: "enter" },
    ]);

    unsubscribe();
  });

  it("createTableWatcher(): run on init", async () => {
    const { registry, $records, onChange, aggregator } = await preTest();

    // Enter $records
    await Promise.all($records.map(async ($record) => await updatePosition(registry.Position, $record)));

    const { unsubscribe } = registry.Position.watch({
      onChange,
      options: { runOnInit: true },
    });
    expect(aggregator).toHaveLength($records.length);

    unsubscribe();
  });

  it("createTableWatcher(): with query", async () => {
    const { registry, $records, onChange, aggregator } = await preTest();
    const tableId = registry.Position.id;
    const matchQuery = (x: number) => x > 5 && x < 15;

    const { unsubscribe } = registry.Position.watch({
      onChange,
      options: { runOnInit: false },
      query: ({ where }) => {
        // Where x is between 5 and 15
        where((getCell) => matchQuery(getCell("x") as number));
      },
    });
    // Query didn't run on init so it should be empty
    expect(aggregator).toEqual([]);

    // Move an $record inside the query condition
    const propsA = registry.Position.get($records[0]);
    await updatePosition(registry.Position, $records[0], { x: 9, y: 9 });
    const propsB = registry.Position.get($records[0]);

    expect(aggregator).toEqual([
      {
        tableId,
        $record: $records[0],
        properties: { current: propsB, prev: propsA },
        type: "enter", // because we didn't run on init so it's necessarily an enter
      },
    ]);

    // Update $record[1] inside the query condition
    const propsC = registry.Position.get($records[1]);
    await updatePosition(registry.Position, $records[1], { x: 10, y: 10 });
    const propsD = registry.Position.get($records[1]);

    expect(aggregator[1]).toEqual({
      tableId,
      $record: $records[1],
      properties: { current: propsD, prev: propsC },
      type: "enter",
    });

    // Exit $record[0]
    registry.Position.remove($records[0]);

    expect(aggregator[2]).toEqual({
      tableId,
      $record: $records[0],
      properties: { current: undefined, prev: propsB },
      type: "exit",
    });

    // Move out $record[1] from the query condition
    await updatePosition(registry.Position, $records[1], { x: 20, y: 20 });
    const propsE = registry.Position.get($records[1]);

    expect(aggregator).toHaveLength(4);
    expect(aggregator[3]).toEqual({
      tableId,
      $record: $records[1],
      properties: { current: propsE, prev: propsD },
      type: "exit",
    });

    unsubscribe();
  });

  it("query() (query)", async () => {
    const { registry, store, $records } = await setup();
    const [player, A, B, C] = $records;
    const emptyData = {
      __staticData: "0x",
      __encodedLengths: "0x",
      __dynamicData: "0x",
      __lastSyncedAtBlock: BigInt(0),
    };

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
      query(store, {
        // @ts-expect-error [HTArray] can't infer type of an heterogeneous array of tables
        with: [registry.Position],
      }).sort(),
    ).toEqual([player, A, B, C].sort());

    // Entities inside the Position table but not inside the Inventory table
    expect(
      query(store, {
        // @ts-expect-error [HTArray] can't infer type of an heterogeneous array of tables
        with: [registry.Position],
        // @ts-expect-error [HTArray] can't infer type of an heterogeneous array of tables
        without: [registry.Inventory],
      }),
    ).toEqual([C]);

    // Entities with a specific property inside the Inventory table, and without a specific property inside the Position table
    expect(
      query(store, {
        withProperties: [
          {
            // @ts-expect-error [HTArray] can't infer type of an heterogeneous array of tables
            table: registry.Inventory,
            properties: { totalWeight: BigInt(6) },
          },
        ],
        withoutProperties: [
          {
            // @ts-expect-error [HTArray] can't infer type of an heterogeneous array of tables
            table: registry.Position,
            properties: { x: 5, y: 5 },
          },
        ],
      }),
    ).toEqual([player]);

    // Entities with a specific property inside the Inventory table, not another one
    expect(
      query(store, {
        withProperties: [
          {
            // @ts-expect-error [HTArray] can't infer type of an heterogeneous array of tables
            table: registry.Inventory,
            properties: { totalWeight: BigInt(6) },
          },
        ],
        withoutProperties: [
          {
            // @ts-expect-error [HTArray] can't infer type of an heterogeneous array of tables
            table: registry.Inventory,
            properties: { weights: [1, 2, 3] },
          },
        ],
      }),
    ).toEqual([A]);
  });

  it("$query(), useQuery() (useQueryAllMatching)", async () => {
    const { registry, store, $records, onChange: onChangeHook, aggregator: aggregatorHook } = await preTest();
    const [player, A, B, C] = $records;
    const emptyData = {
      __staticData: "0x",
      __encodedLengths: "0x",
      __dynamicData: "0x",
      __lastSyncedAtBlock: BigInt(0),
    };

    // We need another aggregator for the global query
    const aggregatorListener: TableUpdate<typeof registry.Position.schema | typeof registry.Inventory.schema>[] = [];
    const onChangeListener = (update: (typeof aggregatorListener)[number]) => aggregatorListener.push(update);

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
      // @ts-expect-error [HTArray] can't infer type of an heterogeneous array of tables
      useQuery(store, queryOptions, {
        onChange: onChangeHook,
      }),
    );
    // @ts-expect-error [HTArray] can't infer type of an heterogeneous array of tables
    const { unsubscribe } = $query(store, queryOptions, { onChange: onChangeListener });

    expect(result.current.sort()).toEqual([player, A].sort());
    expect(aggregatorHook).toEqual([]);
    // The listener aggregator has run on init true by default
    expect(aggregatorListener.sort()).toEqual([
      {
        tableId: undefined, // on init we don't know about specific tables
        $record: player,
        properties: { current: undefined, prev: undefined }, // same for properties
        type: "enter",
      },
      {
        tableId: undefined,
        $record: A,
        properties: { current: undefined, prev: undefined },
        type: "enter",
      },
    ]);

    // Update the totalWeight of player
    const propsA = registry.Inventory.get(player);
    registry.Inventory.update({ totalWeight: BigInt(3) }, player);
    const propsB = registry.Inventory.get(player);

    expect(result.current).toEqual([A]);
    const expectedAggregatorItem = {
      tableId: registry.Inventory.id,
      $record: player,
      properties: { current: propsB, prev: propsA },
      type: "exit", // out of the query
    };
    expect(aggregatorHook).toEqual([expectedAggregatorItem]);
    expect(aggregatorListener).toHaveLength(3);
    expect(aggregatorListener[2]).toEqual(expectedAggregatorItem);

    // Update the totalWeight of A
    const propsC = registry.Inventory.get(A);
    registry.Inventory.update({ totalWeight: BigInt(3) }, A);
    const propsD = registry.Inventory.get(A);

    expect(result.current).toEqual([]);
    const expectedAggregatorItemB = {
      tableId: registry.Inventory.id,
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

    expect(result.current).toEqual([B]);
    const expectedAggregatorItemC = {
      tableId: registry.Inventory.id,
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
      tableId: registry.Position.id,
      $record: B,
      properties: { current: propsH, prev: propsG },
      type: "change",
    };
    const expectedAggregatorItemE = {
      tableId: registry.Position.id,
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

    unsubscribe();
  });
});
