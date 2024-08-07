# Reactive Tables

**A fully fledged, strictly typed library for generating and managing reactive tables in a MUD application for node and browser environments.**

_Reactive Tables is available from npm
as
[`@primodiumxyz/reactive-tables`](https://www.npmjs.com/package/@primodiumxyz/reactive-tables). It is a fork of the [RECS package](https://mud.dev/state-query/typescript/recs) from Lattice._

## Table of contents

- [Introduction](#introduction)
  - [Overview](#overview)
  - [Notable features](#notable-features)
  - [Installation](#installation)
  - [Quickstart](#quickstart)
- [Usage](#usage)
  - [Creating tables](#creating-tables)
  - [Querying tables](#querying-tables)
  - [Watching tables for changes](#watching-tables-for-changes)
  - [Using dev tools](#using-dev-tools)
- [Details](#details)
  - [Entry points](#entry-points)
  - [Structure](#structure)
  - [Conventions](#conventions)
- [Contributing](#contributing)
- [License](#license)

## Introduction

### Overview

The package encompasses a wide range of features, from creating a tables registry from a MUD config object, including metadata and typed methods for updating, fetching and querying data associated with each entity, to decoding onchain logs into consumable properties, and creating/syncing local tables with minimal effort.

It is meant to be used inside a MUD application, encapsulating all of RECS features, with a more convenient and explicit API, and clearer [conventions and architectural pattern](#conventions).

### Notable features

- **Fully typed** - The package is fully typed, with strict types for all properties, methods and functions.
- **Dynamic and reactive** - The tables are reactive, meaning that each table (or group of tables) can be watched for changes, either globally or inside a precise query; including callbacks to trigger side effects, with details on the entity and properties that were modified.
- **Local tables** - Local tables are tailored for client-side state management, can be aggregated with contract tables, and include all the same methods, as well as optional local storage persistence over sessions.
- **Storage adapter** - A built-in bridge between onchain logs and direct properties consumption on the client-side, which is a perfect fit for indexer/RPC sync using [the sync-stack](https://www.npmjs.com/package/@primodiumxyz/sync-stack), [as demonstrated in the tests](./__tests__/utils/sync/createSync.ts#83).

### Installation

Just install the package from npm, preferably with pnpm.

```bash
pnpm add @primodiumxyz/reactive-tables
```

### Quickstart

The wrapper is rather straightforward to use. Given a MUD config object, containing tables definitions, it will provide a fully typed tables registry, each with its own methods for updating, retrieving and querying data, as well as a storage adapter for syncing the state with onchain logs.

```typescript
import { createWrapper, createWorld } from "@primodiumxyz/reactive-tables";
import mudConfig from "contracts/mud.config";

const { tables, tableDefs, storageAdapter } = createWrapper({
  mudConfig,
  // (optional) a world will be created and returned if not provided
  world: createWorld(),
  // (optional) any additional table definitions
  // otherTableDefs: ...,
  // (optional) function that resolves to whether the update stream should be skipped (not triggered) on table properties update
  // shouldSkipUpdateStream: () => true/false,
  // (optional) options for the dev tools, if used (see below in the Usage section)
  // devTools: { ... },
});
```

## Usage

### Creating tables

After [creating the wrapper](#quickstart), the registry can then be supplemented with local tables, which are custom-made tables with the same API as contract ones, but with no onchain counterpart.

```typescript
import { createLocalTable, createLocalNumberTable } from "@primodiumxyz/reactive-tables";
// ...

const Counter = createLocalNumberTable(world, { id: "Counter" });
// or with any properties schema
const Settings = createLocalTable(world, { language: Type.String, darkMode: Type.Bool }, { id: "Settings" });

// and then use it as any other table
Counter.set({ value: 1 });
const count = Counter.get();
console.log(count); // -> { value: 1 }
```

### Querying tables

The package provides the same range of querying methods as RECS, in a more explicit syntax, with direct retrieval or hooks optionally supplied with callbacks.

```typescript
// ...

tables.Player.set({ id: "player1", name: "Alice", score: 15, level: 3 }, aliceEntity);
tables.Player.set({ id: "player2", name: "Bob", score: 10, level: 1 }, bobEntity);
tables.Player.set({ id: "player3", name: "Charlie", score: 0, level: 1 }, charlieEntity);

// Retrieve players at the first level, with a non-zero score
const players = query({
  withProperties: [{ table: tables.Player, properties: { level: 1 } }],
  withoutProperties: [{ table: tables.Player, properties: { score: 0 } }],
});
console.log(players); // -> [bobEntity]
```

Or keep an updated result using a hook, if you're in a React environment.

```typescript
// ...

const players = useQuery({
  withProperties: [{ table: tables.Player, properties: { level: 1 } }],
  withoutProperties: [{ table: tables.Player, properties: { score: 0 } }],
});
console.log(players); // -> [bobEntity]

// Increase the score of Charlie, which will have them enter the query condition
tables.Player.update({ score: 1 }, charlieEntity);
console.log(players); // -> [bobEntity, charlieEntity]
```

### Watching tables for changes

An API with a similar syntax to the queries shown above is available, with additional callbacks to trigger side effects when an entity is modified, added or removed.

```typescript
// ...

tables.Player.set({ id: "player1", name: "Alice", score: 15, level: 3 }, aliceEntity);
tables.Player.set({ id: "player2", name: "Bob", score: 10, level: 1 }, bobEntity);
tables.Player.set({ id: "player3", name: "Charlie", score: 0, level: 1 }, charlieEntity);

// Watch for players at the first level, with a non-zero score
$query(
  world,
  {
    withProperties: [{ table: tables.Player, properties: { level: 1 } }],
    withoutProperties: [{ table: tables.Player, properties: { score: 0 } }],
  },
  {
    onEnter: (update) => console.log(update),
    onUpdate: (update) => console.log(update),
    onExit: (update) => console.log(update),
    // or `onChange`, which encapsulates all the above
  },
  { runOnInit: true },
); // this is the default behavior
// `runOnInit` can be set to false to avoid triggering the callbacks on the initial state
// -> { table: tables.Player, entity: bobEntity, current: { id: "player2", name: "Bob", score: 10, level: 1 }, prev: undefined, type: "enter" }

// Increase the score of Charlie, which will have them enter the query condition
tables.Player.update({ score: 1 }, charlieEntity);
// -> { table: tables.Player, entity: charlieEntity, current: { id: "player3", name: "Charlie", score: 1, level: 1 }, prev: undefined, type: "enter" }

// Update their score again, within the query condition
tables.Player.update({ score: 5 }, charlieEntity);
// -> { table: tables.Player, entity: charlieEntity, current: { id: "player3", name: "Charlie", score: 5, level: 1 }, prev: { id: "player3", name: "Charlie", score: 1, level: 1 }, type: "update" }

// Increase the level of Bob, which will have them exit the query condition
tables.Player.update({ level: 2, score: 0 }, bobEntity);
// -> { table: tables.Player, entity: bobEntity, current: undefined, prev: { id: "player2", name: "Bob", score: 10, level: 1 }, type: "exit" }
```

Apart from the built-in methods (e.g. `table.useAll()`, `table.useAllWith(<properties>)`), you can listen for any change inside a table.

```typescript
// ...

// Watch for any change inside the table
tables.Player.watch(
  {
    onChange: (update) => console.log(update),
  },
  { runOnInit: false },
);

tables.Player.update({ score: 20 }, aliceEntity);
// -> { table: tables.Player, entity: aliceEntity, current: { id: "player1", name: "Alice", score: 20, level: 3 }, prev: { id: "player1", name: "Alice", score: 15, level: 3 }, type: "update" }
```

### Using dev tools

If the package is consumed in a React environment, some additional parameters can be passed to the `createWrapper` function to mount the dev tools and use them alongside development. These will help debugging tables state (properties and entities), sync with the storage adapter and querying tables.

_This is a modified version of [MUD Dev Tools](https://github.com/latticexyz/mud/tree/main/packages/dev-tools)._

```typescript
// ...

const { tables } = createWrapper({
  mudConfig,
  devTools: {
    enabled: true
    // (optional) a viem public client and world address to track blocks on the home screen
    publicClient,
    worldAddress,
    // (optional) other tables—typically created with `createLocalTable`—to track in the dev tools as well
    otherTables
  }
});
```

This will mount a button in the bottom right corner of the screen, which will open a new tab with the dev tools when clicked.

### Testing

The tests are intended to be published to a running anvil node, with the mock contracts deployed. This can be done in a few steps:

The prerequisites are to have the repository cloned and installed, as well as Foundry available. If you wish to test the sync with the indexer, you should have a Docker instance running before starting the following steps.

[Benchmarks](./__tests__/benchmarks) can use multiple versions of the library to measure against historic implementations; in such case, the specific version is installed directly from npm as an alias.

1. Start the dev server, which encompasses spinning up an anvil node, deploying contracts, and if available starting a local indexer.

```bash
pnpm dev
```

2. Wait for a few blocks (~30s) for the contracts to be deployed.

3. Run the tests.

```bash
pnpm test
# or write the logs into a file for debugging
pnpm test:verbose
```

Or directly run the benchmarks (measuring the usage of the previous TinyBase implementation against RECS and other popular state management libraries).

```bash
pnpm test:benchmarks
```

### Building

The package can be built for production using `pnpm build`.

If there are any issues with dependencies at some point, e.g. after updating them, you can run `pnpm clean && pnpm i`, which will recursively clean up all `node_modules` and reinstall all dependencies.

## Details

### Entry points

There are basically 3 entry points to the package, which are all exported from the main module:

1. `createWrapper` - The main entry point, which takes the MUD configuration, and returns the registry, table definitions, the TinyBase store wrapper and a storage adapter for RPC/indexer-client sync.
2. `createLocalTable` (and `createLocal<type>Table` templates) - A factory function for creating local tables, with the same API as contract tables.
3. `query`, `$query`, `useQuery` - Global methods for querying multiple tables at once, and watching for changes.

... as well as a few utilities for encoding/decoding, under the `utils` namespace.

### Structure

```ml
dist - "Compiled files for distribution"
├── index - "Main module"
└── utils - "Utilities for encoding/decoding"
src - "Source files"
├── adapter - "Storage adapter (decode properties from logs)"
├── lib - "Internal and external types, constants, and functions"
│   ├── external - "Any external utilities, e.g. non-modified or adapted MUD types and functions"
├── queries - "Table queries and listeners"
├── tables - "Table creation from contract definition or local properties to generic table object with metadata and methods"
├── createWrapper.ts - "Main entry point for the package, creates a tables registry from a MUD config object"
├── index.ts - "Main module, exports all relevant functions and constants"
└── utils.ts - "Utilities for encoding/decoding"
__tests__ - "Tests related to the library"
├── benchmarks - "Benchmarks for measuring the performance of the library"
├── contracts - "MUD contracts for testing various tables and systems"
└── utils - "Utilities for testing (sync, function calls, network config)"
```

### Conventions

This package follows new naming conventions, which are meant to be more explicit than RECS, and fit better with the new architecture, i.e. tabular data. Hence, it follows an architectural pattern that could be described as "reactive tables", which would encompass entities, components and systems (ECS) in a more explicit and relational way.

See the table below for details on the differences with RECS.

| Reference          | RECS reference | Details                                                                                      | Notes (TODO: only for internal review) |
| ------------------ | -------------- | -------------------------------------------------------------------------------------------- | -------------------------------------- |
| `Table definition` | `Table`        | A contract table issued from the MUD config object, or provided directly to the wrapper      | Could be `specs` as well               |
| `Tables`           | `Components`   | A collection of tables                                                                       | Sometimes mentioned as `registry`      |
| `Table`            | `Component`    | Either a contract or local table, including its metadata and methods                         |                                        |
| `Entity`           | `Entity`       | The key of a row inside a table, the content of the row being its properties (see below)     | (Unchanged)                            |
| `Properties`       | `Value`        | The content of a row associated with an entity, which is made of multiple cells = properties |                                        |
| `Property`         | ?              | A single cell, as a key-value pair                                                           |                                        |

It's worth noting that _systems_, which are not mentioned above, are included as table watchers (or listeners) directly tied to each table, and global watchers and queries.

## Contributing

If you wish to contribute to the package, please open an issue first to make sure that this is within the scope of the library, and that it is not already being worked on.

## License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) for details.

The library contains large chunks of code copied and modified from the MUD codebase, especially in `lib` and in type-focused files, e.g. for adapting them, changing naming conventions, or various other purposes. It is as best as possible documented above each block of code inside the JSDoc comments.
