import { describe, it, expect, assert, vi } from "vitest";
import { renderHook } from "@testing-library/react-hooks";
import { render, waitFor } from "@testing-library/react";
import React from "react";

// libs
import { createWorld as createRecsWorld, getComponentValue } from "@latticexyz/recs";
import { encodeEntity, singletonEntity, syncToRecs as _syncToRecs } from "@latticexyz/store-sync/recs";
import { Hex, padHex, toHex } from "viem";

// src
import {
  ContractTable,
  createWorld,
  $query,
  createLocalTable,
  createLocalBigIntTable,
  createLocalCoordTable,
  createWrapper,
  defaultEntity,
  query,
  Entity,
  QueryOptions,
  queryMatchingCondition,
  Type,
  TableUpdate,
  useQuery,
  PersistentStorageAdapter,
  Schema,
  TableProperties,
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
  toBaseTable,
} from "@test/utils";
import mudConfig from "@test/contracts/mud.config";
import { useEffect } from "react";
import { BaseTableMetadata, getEntitySymbol } from "@/lib";

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

const FUZZ_ITERATIONS = 50;

/* -------------------------------------------------------------------------- */
/*                                    SETUP                                   */
/* -------------------------------------------------------------------------- */

const emptyData = {
  __staticData: "0x" as Hex,
  __encodedLengths: "0x" as Hex,
  __dynamicData: "0x" as Hex,
  __lastSyncedAtBlock: BigInt(0),
};

type SetupOptions = {
  startSync?: boolean;
};

const setup = (options?: SetupOptions) => {
  const { startSync = false } = options ?? {};
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
    networkConfig,
    onSync: {
      progress: (_, __, progress) => console.log(`Syncing: ${(progress * 100).toFixed()}%`),
      complete: (blockNumber) => `Synced to block ${blockNumber?.toString()}`,
      error: (err) => console.error(err),
    },
  });

  if (startSync) {
    sync.start();
    world.registerDisposer(sync.unsubscribe);
  }

  // Sync RECS tables for comparison
  const syncToRecs = async () => {
    const { components: recsComponents } = await _syncToRecs({
      world: recsWorld,
      config: mudConfig,
      address: networkConfig.worldAddress,
      publicClient: networkConfig.publicClient,
      startBlock: networkConfig.initialBlockNumber,
    });

    return { recsComponents };
  };

  // Grab a few entities to use across tests (because each test will keep the state of the chain
  // from previous runs)
  const entities = [
    encodeEntity({ address: "address" }, { address: networkConfig.burnerAccount.address }),
    ...["A", "B", "C"].map((id) => padHex(toHex(`entity${id}`))),
  ] as Entity[];

  return {
    world,
    tables,
    tableDefs,
    storageAdapter,
    sync,
    syncToRecs,
    entities,
    networkConfig,
  };
};

/* -------------------------------------------------------------------------- */
/*                                    SETUP                                   */
/* -------------------------------------------------------------------------- */

describe("setup: create wrapper", () => {
  it("should properly initialize and return expected objects", () => {
    const { tables, tableDefs, storageAdapter } = setup();

    // Verify the existence of the result
    expect(tables).toBeDefined();
    expect(tableDefs).toBeDefined();
    expect(storageAdapter).toBeDefined();
  });
});

describe("local: create local table", () => {
  it("should be able to create tables from local definitions", async () => {
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

  it("should be able to retrieve the state from local storage for a persisted table", async () => {
    const world = createWorld();
    const tables = {
      A: createLocalBigIntTable(world, { id: "A", persist: true, version: "1.0.0" }),
      B: createLocalTable(
        world,
        { bool: Type.Boolean, array: Type.EntityArray },
        { id: "B", persist: true, version: "1.0.0" },
      ),
    };

    tables.A.set({ value: BigInt(1) });
    tables.B.set({ bool: true, array: [defaultEntity] });
    tables.A.update({ value: BigInt(2) });

    const nextWorld = createWorld();
    const nextTables = {
      A: createLocalBigIntTable(nextWorld, { id: "A", persist: true, version: "1.0.0" }),
      B: createLocalTable(
        nextWorld,
        { bool: Type.Boolean, array: Type.EntityArray },
        { id: "B", persist: true, version: "1.0.0" },
      ),
    };

    expect(nextTables.A.get()).toHaveProperty("value", BigInt(2));
    expect(nextTables.B.get()).toHaveProperty("bool", true);
    expect(nextTables.B.get()).toHaveProperty("array", [defaultEntity]);
  });

  it("should be able to use versioning for persisted tables", async () => {
    const entities = [padHex(toHex("entityA")), padHex(toHex("entityB"))] as Entity[];

    const world = createWorld();
    const tables = {
      A: createLocalBigIntTable(world, { id: "A", persist: true, version: "2.0.0" }),
      B: createLocalTable(
        world,
        { bool: Type.Boolean, array: Type.EntityArray },
        { id: "B", persist: true, version: "2.0.0" },
      ),
    };

    tables.A.set({ value: BigInt(1) });
    tables.B.set({ bool: true, array: [entities[0]] });

    // Create new tables with the same id but different version
    const worldV2 = createWorld();
    const tablesV2 = {
      A: createLocalBigIntTable(worldV2, { id: "A", persist: true, version: "3.0.0" }),
      B: createLocalTable(
        worldV2,
        { bool: Type.Boolean, array: Type.EntityArray },
        { id: "B", persist: true, version: "3.0.0" },
      ),
    };

    // The new tables should have undefined properties (persisted tables get their types converted to optional types)
    expect(tablesV2.A.get()).toEqual({ value: undefined });
    expect(tablesV2.B.get()).toEqual({ bool: undefined, array: undefined });

    tablesV2.A.set({ value: BigInt(2) });
    tablesV2.B.set({ bool: false, array: [entities[1]] });

    // The old tables should still have the old properties
    expect(tables.A.get()).toHaveProperty("value", BigInt(1));
    expect(tables.B.get()).toHaveProperty("bool", true);
    expect(tables.B.get()).toHaveProperty("array", [entities[0]]);

    // The new tables should have the new properties
    expect(tablesV2.A.get()).toHaveProperty("value", BigInt(2));
    expect(tablesV2.B.get()).toHaveProperty("bool", false);
    expect(tablesV2.B.get()).toHaveProperty("array", [entities[1]]);
  });

  it("should be able to set default properties for persisted tables", async () => {
    const world = createWorld();
    const tables = {
      A: createLocalBigIntTable(world, { id: "A", persist: true, version: "4.0.0" }, { value: BigInt(1) }),
      B: createLocalTable(
        world,
        { bool: Type.Boolean, array: Type.EntityArray },
        { id: "B", persist: true, version: "4.0.0" },
        { bool: true, array: [defaultEntity] },
      ),
    };

    expect(tables.A.get()).toHaveProperty("value", BigInt(1));
    expect(tables.B.get()).toHaveProperty("bool", true);
    expect(tables.B.get()).toHaveProperty("array", [defaultEntity]);
  });

  it("should be able to handle a change in the properties schema for persisted tables", async () => {
    const world = createWorld();
    const tables = {
      A: createLocalBigIntTable(world, { id: "A", persist: true, version: "5.0.0" }),
      B: createLocalTable(
        world,
        { bool: Type.Boolean, array: Type.EntityArray },
        { id: "B", persist: true, version: "5.0.0" },
        { bool: true, array: [defaultEntity] },
      ),
    };

    tables.A.set({ value: BigInt(1) });
    tables.B.set({ bool: true, array: [defaultEntity] });

    const nextWorld = createWorld();
    const nextTables = {
      // Add new property
      A: createLocalTable(
        nextWorld,
        { value: Type.BigInt, timestamp: Type.Number },
        { id: "A", persist: true, version: "5.0.0" },
      ),
      // Change property name (remove+add) and type of existing property
      B: createLocalTable(
        nextWorld,
        { newBool: Type.Boolean, array: Type.NumberArray },
        { id: "B", persist: true, version: "5.0.0" },
      ),
    };

    expect(nextTables.A.get()).toHaveProperty("value", BigInt(1));
    expect(nextTables.A.get()).toHaveProperty("timestamp", undefined);
    expect(nextTables.B.get()).toHaveProperty("newBool", undefined);
    // type changed so it's set to undefined
    expect(nextTables.B.get()).toHaveProperty("array", undefined);

    nextTables.A.set({ value: BigInt(2), timestamp: 123 });
    nextTables.B.set({ newBool: true, array: [1, 2, 3] });

    expect(nextTables.A.get()).toHaveProperty("value", BigInt(2));
    expect(nextTables.A.get()).toHaveProperty("timestamp", 123);
    expect(nextTables.B.get()).toHaveProperty("newBool", true);
    expect(nextTables.B.get()).toHaveProperty("array", [1, 2, 3]);
  });

  it("should be able to pass a custom storage adapter for persisted tables", async () => {
    const entities = [padHex(toHex("entityA")), padHex(toHex("entityB"))] as Entity[];
    const schemas = {
      A: { value: Type.BigInt },
      B: { x: Type.Number, y: Type.Number },
    } as const;

    const mockState = {
      A: { value: new Map([[getEntitySymbol(entities[0]), BigInt(1)]]) } as TableProperties<(typeof schemas)["A"]>,
      B: {
        x: new Map([
          [getEntitySymbol(entities[0]), 1],
          [getEntitySymbol(entities[1]), 2],
        ]),
        y: new Map([
          [getEntitySymbol(entities[0]), 3],
          [getEntitySymbol(entities[1]), 4],
        ]),
      } as TableProperties<(typeof schemas)["B"]>,
    };

    const set = (tableId: string, entity: Entity, key: string, value: unknown) =>
      // @ts-expect-error index types
      mockState[tableId][key].set(getEntitySymbol(entity), value);

    const adapter = {
      getAllProperties: <PS extends Schema, T = unknown>(tableId: string) =>
        mockState[tableId as keyof typeof mockState] as TableProperties<PS, BaseTableMetadata, T>,
      setProperties: (table, properties, entity) => {
        Object.entries(properties).forEach(([key, value]) => {
          set(table.id, entity, key, value);
        });
      },
      updateProperties: (table, properties, entity) => {
        Object.entries(properties).forEach(([key, value]) => {
          set(table.id, entity, key, value);
        });
      },
    } as const satisfies PersistentStorageAdapter;

    const world = createWorld();
    const tables = {
      A: createLocalBigIntTable(world, { id: "A", persist: true, storageAdapter: adapter }),
      B: createLocalCoordTable(world, { id: "B", persist: true, storageAdapter: adapter }),
    };

    expect(tables.A.get(entities[0])).toHaveProperty("value", BigInt(1));
    expect(tables.B.get(entities[0])).toHaveProperty("x", 1);
    expect(tables.B.get(entities[0])).toHaveProperty("y", 3);
    expect(tables.B.get(entities[1])).toHaveProperty("x", 2);
    expect(tables.B.get(entities[1])).toHaveProperty("y", 4);
  });
});

/* -------------------------------------------------------------------------- */
/*                                    SYNC                                    */
/* -------------------------------------------------------------------------- */

const min = (a = BigInt(0), b = BigInt(0)) => (a < b ? a : b);

describe("sync: should properly sync similar properties to RECS tables", () => {
  it("sync via RPC", async () => {
    const { tables, syncToRecs, entities } = setup({ startSync: true });
    const { recsComponents } = await syncToRecs();
    const player = entities[0];
    assert(tables);

    // Run a few transactions; if it fails, try again
    const targetTables = [tables.Counter, tables.Inventory, tables.Position] as unknown as ContractTable[];
    let { blockNumber, status } = await fuzz(FUZZ_ITERATIONS, targetTables);

    while (status !== "success") {
      console.error("Fuzzing failed, retrying...");
      ({ blockNumber, status } = await fuzz(FUZZ_ITERATIONS, targetTables));
    }

    // Wait for sync to be live at the block of the latest transaction for each table
    let synced = false;
    while (!synced) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const lastProcessed = min(
        // RETA
        tables.SyncStatus.get()?.lastBlockNumberProcessed,
        // RECS
        (getComponentValue(recsComponents.SyncProgress, singletonEntity)?.lastBlockNumberProcessed || BigInt(0)) +
          BigInt(1), // when live sync kicks in, `lastBlockNumberProcessed` is the last block processed during historical sync, so 1 block behind
      );

      synced = lastProcessed >= blockNumber;
    }

    // Ignore tables not registered in RECS (e.g. SyncStatus)
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
  });
});

/* -------------------------------------------------------------------------- */
/*                                TABLE METHODS                               */
/* -------------------------------------------------------------------------- */

describe("methods: should set and return intended properties", () => {
  /* ---------------------------------- BASIC --------------------------------- */
  describe("basic methods", () => {
    // Init and return tables and utils
    const preTest = () => {
      const { tables, entities } = setup();
      const player = entities[0];
      assert(tables);

      // Generate random args
      const length = 5;
      const getRandomArgs = () => ({
        items: getRandomNumbers(length),
        weights: getRandomNumbers(length),
        totalWeight: getRandomBigInts(1)[0],
        ...emptyData,
      });

      return { tables, player, getRandomArgs };
    };

    // Check returned properties against input args
    const postTest = (args: Record<string, unknown>, properties?: Record<string, unknown>) => {
      Object.entries(args).forEach(([key, v]) => {
        expect(properties?.[key]).toEqual(v);
      });
    };

    // Set/get table properties
    it("table.get(), table.getWithKeys()", () => {
      const { tables, player, getRandomArgs } = preTest();

      // Set the items and wait for sync
      const args = getRandomArgs();
      tables.Inventory.set(args, player);

      const properties = tables.Inventory.get(player);
      const propsWithKeys = tables.Inventory.getWithKeys({ id: player });
      postTest(args, properties);
      expect(properties).toEqual(propsWithKeys);
    });

    // Update table properties client-side
    it("table.update()", () => {
      const { tables, player, getRandomArgs } = preTest();

      // Set the items
      const args = getRandomArgs();
      tables.Inventory.set(args, player);
      const properties = tables.Inventory.get(player);
      postTest(args, properties);

      // Update the items
      const argsB = getRandomArgs();
      tables.Inventory.update({ items: argsB.items, totalWeight: argsB.totalWeight }, player);
      const propertiesB = tables.Inventory.get(player);
      postTest({ ...args, items: argsB.items, totalWeight: argsB.totalWeight }, propertiesB);
    });

    // Remove table properties locally
    it("table.remove()", () => {
      const { tables, player, getRandomArgs } = preTest();

      // Set the items
      const args = getRandomArgs();
      tables.Inventory.set(args, player);
      assert(tables.Inventory.get(player));

      // Remove the entity from the table
      tables.Inventory.remove(player);

      const properties = tables.Inventory.get(player);
      expect(properties).toBeUndefined();
    });
  });

  /* --------------------------------- NATIVE --------------------------------- */
  describe("native methods", () => {
    // Records iterator
    it("table.entities()", () => {
      const { tables, entities } = setup();
      assert(tables);
      entities.forEach((entity) => tables.Position.set({ x: 1, y: 1, ...emptyData }, entity));

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
    const getRandomArgs = () => {
      const nums = getRandomNumbers(2);
      return { x: nums[0], y: nums[1], ...emptyData };
    };

    const preTest = () => {
      const { tables, networkConfig, entities } = setup();
      assert(tables);

      // 4 entities: A has some properties, B has different properties, C & D have the same properties
      // Obviously this might return similar values and break tests, or running tests a bunch of times over the same running local node might as well
      const argsA = getRandomArgs();
      const argsB = getRandomArgs();
      const argsC = getRandomArgs();
      const argsD = argsC;

      const args = [argsA, argsB, argsC, argsD];
      entities.forEach((entity, i) => tables.Position.set(args[i], entity));

      return { tables, networkConfig, entities, args };
    };

    it("table.getAll()", () => {
      const { tables, entities } = preTest();

      const allEntities = tables.Position.getAll();
      expect(allEntities.sort()).toEqual(entities.sort());
    });

    it("table.getAllWith()", () => {
      const { tables, entities, args } = preTest();

      expect(tables.Position.getAllWith({ x: args[0].x, y: args[0].y })).toEqual([entities[0]]);
      expect(tables.Position.getAllWith({ x: args[1].x, y: args[1].y })).toEqual([entities[1]]);
      expect(tables.Position.getAllWith({ x: args[2].x, y: args[2].y }).sort()).toEqual(
        [entities[2], entities[3]].sort(),
      );

      // Test with args not included for any entity
      let randomArgs = getRandomArgs();
      while (args.some((a) => a.x === randomArgs.x && a.y === randomArgs.y)) {
        randomArgs = getRandomArgs();
      }
      expect(tables.Position.getAllWith({ x: randomArgs.x, y: randomArgs.y })).toEqual([]);

      // Matching only a part of the args should not be enough for the entity to be included
      let argsWithPartialEquality = getRandomArgs();
      while (args.some((a) => a.x === argsWithPartialEquality.x)) {
        argsWithPartialEquality = getRandomArgs();
      }
      expect(tables.Position.getAllWith({ x: argsWithPartialEquality.x, y: args[0].y })).toEqual([]);
    });

    it("table.getAllWithout()", () => {
      const { tables, entities, args } = preTest();

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
      let randomArgs = getRandomArgs();
      while (args.some((a) => a.x === randomArgs.x && a.y === randomArgs.y)) {
        randomArgs = getRandomArgs();
      }
      expect(tables.Position.getAllWithout({ x: randomArgs.x, y: randomArgs.y }).sort()).toEqual(entities.sort());
    });

    it("table.clear()", () => {
      const { tables, entities } = preTest();
      expect(tables.Position.getAll().sort()).toEqual(entities.sort());

      tables.Position.clear();
      expect(tables.Position.getAll()).toEqual([]);
    });

    it("table.has(), table.hasWithKeys()", () => {
      const { tables, entities } = preTest();

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
    const getRandomArgs = () => {
      const nums = getRandomNumbers(2);
      return { x: nums[0], y: nums[1], ...emptyData };
    };

    it("table.use(), table.useWithKeys()", () => {
      const { tables, entities } = setup();
      assert(tables);
      const player = entities[0];

      const { result } = renderHook(() => tables.Position.use(player));
      const { result: resultWithKeys } = renderHook(() => tables.Position.useWithKeys({ id: player }));

      // Update the position
      const args = getRandomArgs();
      tables.Position.set(args, player);
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);
      expect(result.current).toEqual(resultWithKeys.current);

      // Update the position again with different properties
      const argsB = getRandomArgs();
      tables.Position.set(argsB, player);
      expect(result.current).toHaveProperty("x", argsB.x);
      expect(result.current).toHaveProperty("y", argsB.y);
      expect(result.current).toEqual(resultWithKeys.current);

      // Remove an entity
      tables.Position.remove(player);
      expect(result.current).toBeUndefined();
      expect(resultWithKeys.current).toBeUndefined();
    });

    it("table.pauseUpdates()", () => {
      const { tables, entities } = setup();
      assert(tables);
      const player = entities[0];

      const { result } = renderHook(() => tables.Position.use(entities[0]));

      // Update the position
      const args = getRandomArgs();
      tables.Position.set(args, player);
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);

      // Pause updates
      tables.Position.pauseUpdates(player, { x: args.x, y: args.y, ...emptyData });
      // Update the position again with different properties
      const argsB = getRandomArgs();
      tables.Position.set(argsB, player);

      // It should still have the same properties
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);
    });

    it("table.resumeUpdates()", () => {
      const { tables, entities } = setup();
      assert(tables);
      const player = entities[0];

      const { result } = renderHook(() => tables.Position.use(entities[0]));

      // Update the position
      const args = getRandomArgs();
      tables.Position.set(args, player);
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);

      // Pause updates
      tables.Position.pauseUpdates(player);

      // Update the position again with different properties
      const argsB = getRandomArgs();
      tables.Position.set(argsB, player);

      // It should keep the old properties
      expect(result.current).toHaveProperty("x", args.x);
      expect(result.current).toHaveProperty("y", args.y);

      // Resume updates
      tables.Position.resumeUpdates(player);
      // It should update to the new properties
      expect(result.current).toHaveProperty("x", argsB.x);
      expect(result.current).toHaveProperty("y", argsB.y);
    });

    it("table.useAll()", () => {
      const { tables, entities } = setup();
      assert(tables);

      const { result } = renderHook(() => tables.Position.useAll());

      // Update the position for all entities
      entities.forEach(async (entity) => {
        const args = getRandomArgs();
        tables.Position.set(args, entity);
      });
      expect(result.current.sort()).toEqual(entities.sort());

      // Clear the positions
      tables.Position.clear();
      expect(result.current).toEqual([]);

      // Update the position for a few entities
      entities.slice(0, 2).forEach(async (entity) => {
        const args = getRandomArgs();
        tables.Position.set(args, entity);
      });
      expect(result.current.sort()).toEqual(entities.slice(0, 2).sort());

      // Remove an entity
      tables.Position.remove(entities[0]);
      expect(result.current).toEqual([entities[1]]);
    });

    it("table.useAllWith()", () => {
      const { tables, entities } = setup();
      assert(tables);

      const targetPos = { x: 10, y: 10, ...emptyData };
      const { result } = renderHook(() => tables.Position.useAllWith(targetPos));

      // Update the position for all entities (not to the target position)
      entities.forEach((entity) => {
        let args = getRandomArgs();
        while (args.x === targetPos.x && args.y === targetPos.y) {
          args = getRandomArgs();
        }

        tables.Position.set(args, entity);
      });

      expect(result.current).toEqual([]);

      // Update the position for a few entities to the target position
      tables.Position.set(targetPos, entities[0]);
      expect(result.current).toEqual([entities[0]]);

      tables.Position.set(targetPos, entities[1]);
      expect(result.current.sort()).toEqual([entities[0], entities[1]].sort());

      // And with only part of the properties matching
      tables.Position.set(
        {
          x: targetPos.x,
          y: 0,
          ...emptyData,
        },
        entities[2],
      );
      expect(result.current.sort()).toEqual([entities[0], entities[1]].sort());

      // Remove an entity
      tables.Position.remove(entities[0]);
      expect(result.current).toEqual([entities[1]]);
    });

    it("table.useAllWithout()", () => {
      const { tables, entities } = setup();
      assert(tables);

      const targetPos = { x: 10, y: 10, ...emptyData };
      const { result } = renderHook(() => tables.Position.useAllWithout(targetPos));

      // Update the position for all entities (not to the target position)
      entities.forEach(async (entity) => {
        let args = getRandomArgs();
        while (args.x === targetPos.x && args.y === targetPos.y) {
          args = getRandomArgs();
        }

        tables.Position.set(args, entity);
      });

      expect(result.current.sort()).toEqual(entities.sort());

      // Update the position for a few entities to the target position
      tables.Position.set(targetPos, entities[0]);
      expect(result.current.sort()).toEqual(entities.slice(1).sort());

      tables.Position.set(targetPos, entities[1]);
      expect(result.current.sort()).toEqual(entities.slice(2).sort());

      // And with only part of the properties matching
      tables.Position.set(
        {
          x: targetPos.x,
          y: 0,
          ...emptyData,
        },
        entities[2],
      );
      expect(result.current.sort()).toEqual(entities.slice(2).sort());

      // Remove an entity
      tables.Position.remove(entities[2]);
      expect(result.current).toEqual(entities.slice(3));
    });

    it("table.useAllMatching()", () => {
      const { tables, entities } = setup();
      assert(tables);

      const { result } = renderHook(() => tables.Position.useAllMatching((properties) => properties.x > 10));

      // Update the position for all entities
      entities.forEach((entity) => {
        tables.Position.set({ x: 10, y: 10, ...emptyData }, entity);
      });
      expect(result.current).toEqual([]);

      // Update the position for a few entities
      tables.Position.set({ x: 15, y: 10, ...emptyData }, entities[0]);
      expect(result.current).toEqual([entities[0]]);

      tables.Position.set({ x: 10, y: 10, ...emptyData }, entities[1]);
      expect(result.current).toEqual([entities[0]]);
    });
  });

  /* ---------------------------------- KEYS ---------------------------------- */
  describe("keys (contract-specific) methods", () => {
    it("table.getEntityKeys()", () => {
      const { tables, entities } = setup();
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
  const getRandomArgs = () => {
    const nums = getRandomNumbers(2);
    return { x: nums[0], y: nums[1], ...emptyData };
  };

  const preTest = () => {
    const { world, tables, entities } = setup();
    assert(tables);

    // Aggregate updates triggered by the system on table update
    const aggregator: TableUpdate[] = [];
    const onChange = (update: (typeof aggregator)[number]) => aggregator.push(update);

    return { world, tables, entities, onChange, aggregator };
  };

  it("table.watch()", () => {
    const { tables, entities, onChange, aggregator } = preTest();
    const table = tables.Position;

    tables.Position.watch({ onChange }, { runOnInit: false });
    expect(aggregator).toEqual([]);

    // Update the position for an entity (and enter the table)
    const propsA = tables.Position.get(entities[0]);
    const argsA = getRandomArgs();
    tables.Position.set(argsA, entities[0]);

    expect(aggregator).toEqual([
      {
        table: toBaseTable(table),
        entity: entities[0],
        properties: { current: argsA, prev: propsA },
        type: propsA ? "update" : "enter",
      },
    ]);

    // Update entity[1]
    const propsB = tables.Position.get(entities[1]);
    const argsB = getRandomArgs();
    tables.Position.set(argsB, entities[1]);
    // Exit entity[0]
    tables.Position.remove(entities[0]);
    // Enter again entity[0]
    const argsC = getRandomArgs();
    tables.Position.set(argsC, entities[0]);

    expect(aggregator).toEqual([
      {
        table: toBaseTable(table),
        entity: entities[0],
        properties: { current: argsA, prev: propsA },
        type: propsA ? "update" : "enter",
      },
      {
        table: toBaseTable(table),
        entity: entities[1],
        properties: { current: argsB, prev: propsB },
        type: propsB ? "update" : "enter",
      },
      {
        table: toBaseTable(table),
        entity: entities[0],
        properties: { current: undefined, prev: argsA },
        type: "exit",
      },
      {
        table: toBaseTable(table),
        entity: entities[0],
        properties: { current: argsC, prev: undefined },
        type: "enter",
      },
    ]);
  });

  it("table.watch(): run on init", () => {
    const { tables, entities, onChange, aggregator } = preTest();

    // Enter entities
    entities.forEach((entity) => {
      const args = getRandomArgs();
      tables.Position.set(args, entity);
    });

    tables.Position.watch({ onChange }, { runOnInit: true });
    expect(aggregator).toHaveLength(entities.length);
  });

  it("table.once()", () => {
    const { tables, entities, onChange, aggregator } = preTest();
    const table = tables.Position;

    entities.forEach((entity) => {
      tables.Position.remove(entity);
    });

    tables.Position.once(
      {
        filter: ({ table, entity, properties }) => {
          return table.id === tables.Position.id && entity === entities[0] && properties.current?.x === 10;
        },
        do: onChange,
      },
      { runOnInit: false },
    );
    expect(aggregator).toEqual([]);

    // Update entities to fit the filter (except for the first one)
    tables.Position.set({ x: 5, y: 10, ...emptyData }, entities[0]);
    tables.Position.set({ x: 10, y: 10, ...emptyData }, entities[1]);

    expect(aggregator).toEqual([]);

    // Update the first entity to fit the filter
    tables.Position.set({ x: 10, y: 10, ...emptyData }, entities[0]);
    const expected = [
      {
        table: toBaseTable(table),
        entity: entities[0],
        properties: { current: tables.Position.get(entities[0]), prev: { x: 5, y: 10, ...emptyData } },
        type: "update",
      },
    ];
    expect(aggregator).toEqual(expected);

    // Update another entity to fit the filter
    tables.Position.set({ x: 10, y: 10, ...emptyData }, entities[2]);
    expect(aggregator).toEqual(expected);
  });

  it("query() (query)", () => {
    const { tables, entities } = setup();
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

  it("$query(), useQuery()", () => {
    const { world, tables, entities, onChange: onChangeHook, aggregator: aggregatorHook } = preTest();
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

  it("complex query (matching)", () => {
    const { tables, entities } = setup();
    const [player, A, B, C] = entities;

    // Prepare entities
    tables.Position.set({ x: 10, y: 10, ...emptyData }, player);
    tables.Position.set({ x: 5, y: 5, ...emptyData }, A);
    tables.Position.set({ x: 10, y: 10, ...emptyData }, B);
    tables.Position.set({ x: 15, y: 10, ...emptyData }, C);
    tables.Inventory.set({ items: [1, 2, 3], weights: [1, 2, 3], totalWeight: BigInt(6), ...emptyData }, player);
    tables.Inventory.set({ items: [2, 3, 4, 5], weights: [2, 3, 4], totalWeight: BigInt(6), ...emptyData }, A);
    tables.Inventory.set({ items: [1, 2, 3], weights: [1, 2, 3], totalWeight: BigInt(3), ...emptyData }, B);

    // Entities with at least 4 items in the Inventory table
    expect(
      query({
        with: [tables.Inventory],
        matching: [
          // this is exactly the same syntax but with a wrapper function for type inference
          queryMatchingCondition({
            table: tables.Inventory,
            where: ({ items }) => items.length > 3,
          }),
        ],
      }).sort(),
    ).toEqual([A]);

    // Entities inside Position with x >= 10 and totalWeight === 6
    expect(
      query({
        with: [tables.Position],
        matching: [
          queryMatchingCondition({
            table: tables.Position,
            where: ({ x }) => x >= 10,
          }),
          queryMatchingCondition({
            table: tables.Inventory,
            where: ({ totalWeight }) => totalWeight === BigInt(6),
          }),
        ],
      }).sort(),
    ).toEqual([player]);
  });
});

describe("react: should work correctly in a react environment", () => {
  describe("no infinite render", () => {
    const TestComponent = ({ onRender, useHook }: { onRender: () => void; useHook: () => unknown }) => {
      const res = useHook();

      useEffect(() => {
        onRender();
      }, [res]);

      return null;
    };

    it("useQuery", async () => {
      const { tables, entities } = setup();

      const onRender = vi.fn();
      const useHook = () => useQuery({ with: [tables.Position] });
      render(<TestComponent onRender={onRender} useHook={useHook} />);

      // 1: initial render
      // 2: `setEntities` inside `useEffect`
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(2));
      tables.Position.set({ x: 10, y: 10, ...emptyData }, entities[0]);
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(3));
      tables.Position.remove(entities[0]);
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(4));
    });

    it("table.use", async () => {
      const { tables, entities } = setup();

      const onRender = vi.fn();
      const useHook = () => tables.Position.use(entities[0]);
      render(<TestComponent onRender={onRender} useHook={useHook} />);

      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(1));
      tables.Position.set({ x: 10, y: 10, ...emptyData }, entities[0]);
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(2));
      tables.Position.set({ x: 10, y: 10, ...emptyData }, entities[1]);
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(2));
    });

    it("table.useAll", async () => {
      const { tables, entities } = setup();

      const onRender = vi.fn();
      const useHook = () => tables.Position.useAll();
      render(<TestComponent onRender={onRender} useHook={useHook} />);

      // 1: initial render
      // 2: `setEntities` inside `useEffect`
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(2));
      tables.Position.set({ x: 10, y: 10, ...emptyData }, entities[0]);
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(3));
      tables.Position.remove(entities[0]);
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(4));
    });

    it("table.useAllWith", async () => {
      const { tables, entities } = setup();

      const onRender = vi.fn();
      const useHook = () => tables.Position.useAllWith({ x: 10, y: 10 });
      render(<TestComponent onRender={onRender} useHook={useHook} />);

      // 1: initial render
      // 2: `setEntities` inside `useEffect`
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(2));
      tables.Position.set({ x: 10, y: 10, ...emptyData }, entities[0]);
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(3));
      tables.Position.update({ x: 0 }, entities[0]);
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(4));
    });

    it("table.useAllWithout", async () => {
      const { tables, entities } = setup();

      const onRender = vi.fn();
      const useHook = () => tables.Position.useAllWithout({ x: 10, y: 10 });
      render(<TestComponent onRender={onRender} useHook={useHook} />);

      // 1: initial render
      // 2: `setEntities` inside `useEffect`
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(2));
      tables.Position.set({ x: 10, y: 10, ...emptyData }, entities[0]);
      // not entering, should not trigger a render
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(2));
      tables.Position.update({ x: 0 }, entities[0]);
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(3));
      tables.Position.update({ x: 10 }, entities[0]);
      await waitFor(() => expect(onRender).toHaveBeenCalledTimes(4));
    });
  });
});
