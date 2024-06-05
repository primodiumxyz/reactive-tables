// @vitest-environment node
import { assert, describe, it } from "vitest";
import { Bench } from "tinybench";

// libs
import {
  Entity,
  Has,
  HasValue,
  createWorld,
  defineComponentSystem,
  getComponentValue,
  runQuery,
  setComponent,
  updateComponent,
} from "@latticexyz/recs";
import { recsStorage } from "@latticexyz/store-sync/recs";
import { Hex, padHex, toHex } from "viem";

// src
import {
  createWrapper,
  default$Record,
  query,
  $Record,
  Properties,
  Schema,
  PropType,
} from "./dist_reactive-tables-tinybase";

// utils
import { getRandomBigInts, getRandomNumbers } from "@test/utils";
import mudConfig from "@test/contracts/mud.config";

// libs
import { createDB, createTable, first, insert, many, update as updateDB } from "blinkdb";
import { createStore as createElfStore } from "@ngneat/elf";
import {
  entitiesPropsFactory,
  getEntity,
  updateEntities,
  upsertEntities,
  getAllEntities,
  getAllEntitiesApply,
  selectAllEntities,
} from "@ngneat/elf-entities";
import { createRxDatabase } from "rxdb";
import { getRxStorageMemory } from "rxdb/plugins/storage-memory";

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

// The amount of repetitions for operations within each table
const ITERATIONS = 1_000;
// The time to run each benchmark for (calculate how many operations could be ran)
const BENCH_TIME = 5_000;
// The amount of records to set/get/update
const RECORDS = 1_000;
// Tested libraries
const LIBRARIES = ["RETA", "RECS", "BlinkDB", "Elf", "RxDB"] as const;
// Mock tables
const TABLES = ["Counter", "Position", "Inventory"] as const;

type EmptyMetadata = {
  __staticData: PropType.Hex;
  __dynamicData: PropType.Hex;
  __encodedLengths: PropType.Hex;
};
const emptyMetadata = {
  __staticData: "0x" as Hex,
  __dynamicData: "0x" as Hex,
  __encodedLengths: "0x" as Hex,
};

type Counter = { value: PropType.Number } & EmptyMetadata;
type Position = { x: PropType.Number; y: PropType.Number } & EmptyMetadata;
type Inventory = {
  totalWeight: PropType.BigInt;
  items: PropType.NumberArray;
  weights: PropType.NumberArray;
} & EmptyMetadata;

interface BlinkDBTable {
  table: string;
  record: string;
  id: string;
  properties: Properties<Schema, unknown>;
}

/* -------------------------------------------------------------------------- */
/*                                    SETUP                                   */
/* -------------------------------------------------------------------------- */

const setup = async (scope = "tables") => {
  const world = createWorld();

  /* -------------------------------- TINYBASE -------------------------------- */
  const { registry, store, tableDefs } = createWrapper({
    mudConfig: mudConfig,
  });

  /* ---------------------------------- RECS ---------------------------------- */
  const { components } = recsStorage({
    world,
    tables: tableDefs,
  });

  /* --------------------------------- BLINKDB -------------------------------- */
  const blinkDb = createDB({ clone: false });
  const blinkTable = createTable<BlinkDBTable>(
    blinkDb,
    scope,
  )({
    primary: "id",
    //  add indexes: ["record"] https://blinkdb.io/docs/reference/createtable#indexes
    // small overhead on writes; we don't actually need this here
    // indexes: ["table", "record"],
  });
  const blinkRegistry = TABLES.reduce(
    (acc, key) => {
      const get = async (record: $Record) => {
        const id = `${key}__${record}`;
        const data = await first(blinkTable, {
          where: {
            // table: key,
            // record: record,
            id,
          },
        });
        return data?.properties;
      };
      const update = async (properties: Properties<(typeof registry)[typeof key]["schema"]>, record: $Record) => {
        const id = `${key}__${record}`;
        await updateDB(blinkTable, { id, properties });
      };
      const set = async (properties: Properties<Schema, unknown>, record: $Record) => {
        // cheaper than upsert
        if (await get(record)) {
          await update(properties, record);
        } else {
          const id = `${key}__${record}`;
          await insert(blinkTable, { id, table: key, record, properties });
        }
      };

      acc[key] = { set, get, update } as const;
      return acc;
    },
    {} as Record<
      string,
      {
        get: (record: $Record) => Promise<Properties<Schema, unknown> | undefined>;
        update: (properties: Properties<Schema, unknown>, record: $Record) => Promise<void>;
        set: (properties: Properties<Schema, unknown>, record: $Record) => Promise<void>;
      }
    >,
  );

  /* ----------------------------------- ELF ---------------------------------- */
  const { CounterEntitiesRef, withCounterEntities } = entitiesPropsFactory("Counter");
  const { PositionEntitiesRef, withPositionEntities } = entitiesPropsFactory("Position");
  const { InventoryEntitiesRef, withInventoryEntities } = entitiesPropsFactory("Inventory");
  const elfStore = createElfStore(
    { name: scope },
    withCounterEntities<Properties<typeof registry.Counter.schema> & { id: $Record }>(),
    withPositionEntities<Properties<typeof registry.Position.schema> & { id: $Record }>(),
    withInventoryEntities<Properties<typeof registry.Inventory.schema> & { id: $Record }>(),
  );
  const elfRefs = {
    Counter: CounterEntitiesRef,
    Position: PositionEntitiesRef,
    Inventory: InventoryEntitiesRef,
  } as const;
  // same was possible with separate stores but not worth it; same performance but prevents efficiently querying multiple tables
  // const counterStore = createElfStore({ name: "Counter" }, withEntities<typeof registry.Counter.schema & { id: $Record }>());
  // const positionStore = createElfStore({ name: "Position" }, withEntities<typeof registry.Position.schema & { id: $Record }>());
  // const inventoryStore = createElfStore({ name: "Inventory" }, withEntities<typeof registry.Inventory.schema & { id: $Record }>());
  // const elfStore = {
  //   Counter: counterStore,
  //   Position: positionStore,
  //   Inventory: inventoryStore,
  // }

  const elfRegistry = Object.entries(elfRefs).reduce(
    (acc, [key, ref]) => {
      const get = async (record: $Record) => {
        return elfStore.query(getEntity(record, { ref }));
      };
      const update = async (properties: Properties<(typeof registry)[typeof key]["schema"]>, record: $Record) => {
        elfStore.update(updateEntities(record, (props) => ({ ...props, ...properties }), { ref }));
      };
      const set = async (properties: Properties<(typeof registry)[typeof key]["schema"]>, record: $Record) => {
        elfStore.update(upsertEntities({ id: record, ...properties }, { ref }));
      };

      acc[key] = { set, get, update } as const;
      return acc;
    },
    {} as Record<
      string,
      {
        get: (record: $Record) => Promise<Properties<(typeof registry)[keyof typeof registry]["schema"]> | undefined>;
        update: (
          properties: Properties<(typeof registry)[keyof typeof registry]["schema"]>,
          record: $Record,
        ) => Promise<void>;
        set: (
          properties: Properties<(typeof registry)[keyof typeof registry]["schema"]>,
          record: $Record,
        ) => Promise<void>;
      }
    >,
  );

  /* ---------------------------------- RXDB ---------------------------------- */
  const rxDb = await createRxDatabase({
    name: scope,
    storage: getRxStorageMemory(),
    eventReduce: true,
  });

  await rxDb.addCollections({
    Counter: {
      schema: {
        version: 0,
        primaryKey: "record",
        type: "object",
        properties: {
          record: { type: "string", maxLength: 66 },
          value: { type: "number" },
          __staticData: { type: "string" },
          __dynamicData: { type: "string" },
          __encodedLengths: { type: "string" },
        },
        required: ["value"],
      },
    },
    Position: {
      schema: {
        version: 0,
        primaryKey: "record",
        type: "object",
        properties: {
          record: { type: "string", maxLength: 66 },
          x: { type: "number" },
          y: { type: "number" },
          __staticData: { type: "string" },
          __dynamicData: { type: "string" },
          __encodedLengths: { type: "string" },
        },
        required: ["x", "y"],
      },
    },
    Inventory: {
      schema: {
        version: 0,
        primaryKey: "record",
        type: "object",
        properties: {
          record: { type: "string", maxLength: 66 },
          totalWeight: { type: "string" }, // doesn't support bigint...
          items: { type: "array", items: { type: "number" } },
          weights: { type: "array", items: { type: "number" } },
          __staticData: { type: "string" },
          __dynamicData: { type: "string" },
          __encodedLengths: { type: "string" },
        },
        required: ["totalWeight", "items", "weights"],
      },
    },
  });

  const rxDbRegistry = TABLES.reduce(
    (acc, key) => {
      const collection = rxDb[key];

      const get = async (record: $Record) => {
        const item = await collection.findOne(record).exec();
        // this would be handled generically
        if (key === "Inventory") {
          return item ? { ...item, totalWeight: BigInt(item.totalWeight) } : undefined;
        } else {
          return item;
        }
      };
      const update = async (properties: Properties<(typeof registry)[typeof key]["schema"]>, record: $Record) => {
        set(properties, record);
      };
      const set = async (properties: Properties<(typeof registry)[typeof key]["schema"]>, record: $Record) => {
        if (key === "Inventory" && properties.totalWeight) {
          collection.upsert({
            ...properties,
            record,
            totalWeight: (properties as Properties<Inventory>).totalWeight.toString(),
          });
        } else {
          collection.upsert({ ...properties, record });
        }
      };

      acc[key] = { set, get, update } as const;
      return acc;
    },
    {} as Record<
      string,
      {
        get: (record: $Record) => Promise<Properties<(typeof registry)[keyof typeof registry]["schema"]> | undefined>;
        update: (
          properties: Properties<(typeof registry)[keyof typeof registry]["schema"]>,
          record: $Record,
        ) => Promise<void>;
        set: (
          properties: Properties<(typeof registry)[keyof typeof registry]["schema"]>,
          record: $Record,
        ) => Promise<void>;
      }
    >,
  );

  /* -------------------------------- UTILITIES ------------------------------- */
  // Grab a few records to use across tests
  const $records = Array.from({ length: RECORDS }, (_, i) => padHex(toHex(`record${i}`))) as $Record[];

  // Create a JS map to compare with (basically RECS but stripped of anything else)
  const jsMap = {
    Counter: new Map<string, Properties<Counter, unknown>>(),
    Position: new Map<string, Properties<Position, unknown>>(),
    Inventory: new Map<string, Properties<Inventory, unknown>>(),
  };

  // Prepare random values to set registry/components with
  // Basically sets of { table, record, properties } (or { component, entity, value })
  const actions = [
    {
      key: "Counter" as keyof typeof registry,
      record: Array.from({ length: ITERATIONS }, () => default$Record),
      properties: getRandomNumbers(ITERATIONS).map((value) => ({ value, ...emptyMetadata })),
      updates: getRandomNumbers(ITERATIONS).map((value) => ({ value, ...emptyMetadata })),
    },
    {
      key: "Position" as keyof typeof registry,
      // Choose a record
      record: Array.from({ length: ITERATIONS }, (_, i) => $records[i % RECORDS]),
      // Get random x and y values for each iteration
      properties: getRandomNumbers(2 * ITERATIONS).reduce(
        (acc, value, i) => {
          const index = Math.floor(i / 2);
          if (!acc[index]) acc[index] = { x: 0, y: 0, ...emptyMetadata };
          acc[index][i % 2 === 0 ? "x" : "y"] = value;
          return acc;
        },
        [{}] as Array<
          {
            x: number;
            y: number;
          } & typeof emptyMetadata
        >,
      ),
      // Get a random property to update for each iteration
      updates: getRandomNumbers(ITERATIONS).map((x) => ({ x })),
    },
    {
      key: "Inventory" as keyof typeof registry,
      record: Array.from({ length: ITERATIONS }, (_, i) => $records[i % RECORDS]),
      // Get a random total weight for each iteration
      properties: getRandomBigInts(ITERATIONS).reduce(
        (acc, totalWeight, i) => {
          // Get between 1 and 10 items and weights, with random values between 1 and 100_000
          const items = getRandomNumbers(1 + Math.floor(Math.random() * 10), 1, 100_000);
          const weights = getRandomNumbers(items.length, 1, 100_000);
          acc[i] = { totalWeight, items, weights, ...emptyMetadata };
          return acc;
        },
        [{}] as Array<
          {
            totalWeight: bigint;
            items: number[];
            weights: number[];
          } & typeof emptyMetadata
        >,
      ),
      updates: getRandomBigInts(ITERATIONS).map((totalWeight) => ({ totalWeight })),
    },
  ];

  return {
    registry,
    store,
    components,
    world,
    blinkTable,
    blinkRegistry,
    elfStore,
    elfRegistry,
    elfRefs,
    rxDb,
    rxDbRegistry,
    jsMap,
    actions,
  };
};

/* -------------------------------------------------------------------------- */
/*                                 BENCHMARKS                                 */
/* -------------------------------------------------------------------------- */

describe("Benchmarks", () => {
  /* ---------------------------- TABLE OPERATIONS ---------------------------- */
  // Basic set/get/update operations on tables
  it("Table Operations", async () => {
    const { registry, components, blinkRegistry, elfRegistry, rxDbRegistry, jsMap, actions } =
      await setup("TableOperations");
    const bench = new Bench({ time: BENCH_TIME });

    bench
      .add("RETA", () => {
        for (const { key, record, properties, updates } of actions) {
          for (let i = 0; i < ITERATIONS; i++) {
            // @ts-expect-error incompatible properties schema
            registry[key].set(properties[i], record[i]);
            registry[key].get(record[i]);
            // @ts-expect-error incompatible properties schema
            registry[key].update(updates[i], record[i]);
            registry[key].get(record[i]);
          }
        }
      })
      .add("RECS", () => {
        for (const { key, record, properties } of actions) {
          for (let i = 0; i < ITERATIONS; i++) {
            setComponent(components[key], record[i] as unknown as Entity, properties[i]);
            getComponentValue(components[key], record[i] as unknown as Entity);
            updateComponent(components[key], record[i] as unknown as Entity, properties[i]);
            getComponentValue(components[key], record[i] as unknown as Entity);
          }
        }
      })
      .add("BlinkDB", async () => {
        for (const { key, record, properties, updates } of actions) {
          for (let i = 0; i < ITERATIONS; i++) {
            await blinkRegistry[key].set(properties[i], record[i]);
            await blinkRegistry[key].get(record[i]);
            await blinkRegistry[key].update(updates[i], record[i]);
            await blinkRegistry[key].get(record[i]);
          }
        }
      })
      .add("Elf", async () => {
        for (const { key, record, properties, updates } of actions) {
          for (let i = 0; i < ITERATIONS; i++) {
            await elfRegistry[key].set(properties[i], record[i]);
            await elfRegistry[key].get(record[i]);
            await elfRegistry[key].update(updates[i], record[i]);
            await elfRegistry[key].get(record[i]);
          }
        }
      })
      .add("RxDB", async () => {
        for (const { key, record, properties, updates } of actions) {
          for (let i = 0; i < ITERATIONS; i++) {
            await rxDbRegistry[key].set(properties[i], record[i]);
            await rxDbRegistry[key].get(record[i]);
            await rxDbRegistry[key].update(updates[i], record[i]);
            await rxDbRegistry[key].get(record[i]);
          }
        }
      })
      .add("JS Map", () => {
        for (const { key, record, properties, updates } of actions) {
          const map = jsMap[key as keyof typeof jsMap];
          for (let i = 0; i < ITERATIONS; i++) {
            // @ts-expect-error incompatible properties schema
            map.set(record[i], properties[i]);
            map.get(record[i]);
            // @ts-expect-error incompatible properties schema
            map.set(record[i], updates[i]);
            map.get(record[i]);
          }
        }
      });

    _benchmark(bench, "Table Operations");
  });

  /* --------------------------------- QUERIES -------------------------------- */
  // Querying tables with provided properties
  it("Queries", async () => {
    const { registry, store, components, blinkTable, elfStore, elfRefs, rxDb, actions } = await setup("Queries");
    const bench = new Bench({ time: BENCH_TIME });
    // Make sure results are the same across all implementations
    const results = Object.fromEntries(LIBRARIES.map((lib) => [lib, []])) as unknown as Record<
      (typeof LIBRARIES)[number],
      $Record[][]
    >;

    bench
      .add("RETA", () => {
        for (const { key, properties } of actions) {
          const res = query(store, {
            // @ts-expect-error [HTArray] can't infer type of an heterogeneous array of tables
            with: [registry.Counter],
            // @ts-expect-error [HTArray] can't infer type of an heterogeneous array of tables
            withProperties: [{ table: registry[key], properties: properties[0] }],
          });
          results["RETA"].push(res || []);
        }
      })
      .add("RECS", () => {
        for (const { key, properties } of actions) {
          const res = runQuery([Has(components.Counter), HasValue(components[key], properties[0])]);
          results["RECS"].push(Array.from(res as unknown as Set<$Record>) || []);
        }
      })
      .add("BlinkDB", async () => {
        for (const { key, properties } of actions) {
          const res = await many(blinkTable, {
            where: {
              table: key,
              ...properties,
            },
          });
          results["BlinkDB"].push(res.map((r) => r.record as $Record));
        }
      })
      .add("Elf", () => {
        for (const { key, properties } of actions) {
          const A = elfStore.query(
            getAllEntitiesApply({
              filterEntity: (e) => Object.entries(properties[0]).every(([key, value]) => e[key] === value),
              ref: elfRefs[key as keyof typeof elfRefs],
            }),
          );
          const B = elfStore.query(getAllEntities({ ref: elfRefs.Counter }));
          const res = A.filter((a) => B.includes(a));
          results["Elf"].push(res.map((e) => e.id));
        }
      })
      .add("RxDB", async () => {
        for (const { key, properties } of actions) {
          // serialize bigint in Inventory
          const serialized =
            key === "Inventory"
              ? { ...properties[0], totalWeight: (properties[0] as Properties<Inventory>).totalWeight.toString() }
              : properties[0];

          const A = await rxDb[key]
            .find({
              selector: {
                ...serialized,
              },
            })
            .exec();
          const B = await rxDb.Counter.find({ selector: {} }).exec();

          const res = A.filter((a) => B.includes(a));
          results["RxDB"].push(res.map((e) => e.record));
        }
      });

    await _benchmark(bench, "Queries");

    // make sure results are the same across all implementations
    for (const res of Object.values(results)) {
      // compare with the smallest array (lowest op/sec)
      const smallest = Math.min(res.length, results["RETA"].length);
      assert.deepEqual(res.slice(0, smallest), results["RETA"].slice(0, smallest));
    }
  });

  /* --------------------------------- SYSTEMS -------------------------------- */
  // Watching for changes on tables
  // BlinkDB `watch` doesn't include the updated record anyway, and doesn't separate tables so it's not even a contender in its
  // native state
  it("Systems", async () => {
    const { registry, components, world, elfRegistry, elfRefs, elfStore, rxDbRegistry, rxDb, actions } =
      await setup("Systems");
    const bench = new Bench({ time: BENCH_TIME });

    bench
      .add("RETA", () => {
        const updates = [];
        const unsubs = [];

        for (const { key } of actions) {
          const { unsubscribe } = registry[key].watch({
            onChange: (update) => updates.push(update),
          });
          unsubs.push(unsubscribe);
        }

        for (const { key, record, properties, updates } of actions) {
          for (let i = 0; i < ITERATIONS; i++) {
            // @ts-expect-error incompatible properties schema
            registry[key].set(properties[i], record[i]);
            registry[key].get(record[i]);
            // @ts-expect-error incompatible properties schema
            registry[key].update(updates[i], record[i]);
            registry[key].get(record[i]);
          }
        }

        unsubs.forEach((unsub) => unsub());
      })
      .add("RECS", () => {
        const updates = [];

        for (const { key } of actions) {
          defineComponentSystem(world, components[key], (update) => updates.push(update));
        }

        for (const { key, record, properties } of actions) {
          for (let i = 0; i < ITERATIONS; i++) {
            setComponent(components[key], record[i] as unknown as Entity, properties[i]);
            getComponentValue(components[key], record[i] as unknown as Entity);
            updateComponent(components[key], record[i] as unknown as Entity, properties[i]);
            getComponentValue(components[key], record[i] as unknown as Entity);
          }
        }

        world.dispose();
      })
      // here it could be refined to get the same API on update but it doesn't really matter anymore at this point
      .add("Elf", async () => {
        const updates = [];
        const subs = [];

        for (const { key } of actions) {
          const subscription = elfStore
            .pipe(selectAllEntities({ ref: elfRefs[key as keyof typeof elfRefs] }))
            .subscribe((entries) => updates.push(entries));
          subs.push(subscription);
        }

        for (const { key, record, properties, updates } of actions) {
          for (let i = 0; i < ITERATIONS; i++) {
            await elfRegistry[key].set(properties[i], record[i]);
            await elfRegistry[key].get(record[i]);
            await elfRegistry[key].update(updates[i], record[i]);
            await elfRegistry[key].get(record[i]);
          }
        }

        subs.forEach((sub) => {
          if (!sub.closed) sub.unsubscribe();
        });
      })
      // same here as it would need to be adapted to provide the updated entry (document) on change
      .add("RxDB", async () => {
        const updates = [];
        const subs = [];

        for (const { key } of actions) {
          const subscription = rxDb[key].$.subscribe((entries) => updates.push(entries));
          subs.push(subscription);
        }

        for (const { key, record, properties, updates } of actions) {
          for (let i = 0; i < ITERATIONS; i++) {
            await rxDbRegistry[key].set(properties[i], record[i]);
            await rxDbRegistry[key].get(record[i]);
            await rxDbRegistry[key].update(updates[i], record[i]);
            await rxDbRegistry[key].get(record[i]);
          }
        }

        subs.forEach((sub) => {
          if (!sub.closed) sub.unsubscribe();
        });
      });

    _benchmark(bench, "Systems");
  });
});

/* -------------------------------------------------------------------------- */
/*                                    UTILS                                   */
/* -------------------------------------------------------------------------- */

type BenchmarkTable = {
  "Task Name": string;
  "ops/sec": string;
  "Average Time (ns)": number;
  Margin: string;
  Samples: number;
  Period: number;
};

const _benchmark = async (bench: Bench, label: string) => {
  await bench.warmup();
  await bench.run();
  const results = bench.table().map((row, i) => ({
    ...row,
    Period: bench.results[i]?.period || 0,
  })) as BenchmarkTable[];
  const relevantResults = results
    // remove any non-lib just here for reference
    .filter((row) => LIBRARIES.includes(row["Task Name"] as (typeof LIBRARIES)[number]))
    // sort by efficiency
    .sort((a, b) => a["Period"] - b["Period"]);
  const additionalContext = results
    .filter((row) => !LIBRARIES.includes(row["Task Name"] as (typeof LIBRARIES)[number]))
    .sort((a, b) => a["Period"] - b["Period"]);

  console.log(label);
  console.table(
    relevantResults.concat(additionalContext).map((result) => {
      const best = relevantResults[0];
      return {
        Lib: result["Task Name"],
        "Ops/sec": result["ops/sec"],
        Margin: result["Margin"],
        Diff: `${Number((result["Period"] / best["Period"]).toFixed(2))}x`, // n*slower than best
      };
    }),
  );
};
