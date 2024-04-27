# Reactive Tables

**A fully fledged, strictly typed library for generating and managing reactive tables in a MUD application, available for node and browser environments.**

The package encompasses a wide range of functionnalities, from creating a tables registry from a MUD config object, including metadata and typed methods for updating, fetching and querying data associated with each record, to decoding onchain logs into consumable properties, and creating/syncing local tables with minimal effort.

It is meant to be used inside a MUD application, as a replacement for the native RECS framework, meaning both in terms of technical state management and [in terms of conventions and architectural pattern](#conventions).

## Overview

### Entry points

There are basically 3 entry points to the package, which are all exported from the main module:

1. `createWrapper` - The main entry point, which takes the MUD configuration, and returns the registry, table definitions, the TinyBase store wrapper and a storage adapter for RPC/indexer-client sync.
2. `createLocalTable` (and `createLocal<type>Table` templates) - A factory function for creating local tables, with the same API as contract tables.
3. `query`, `createQuery`, `useQuery` - Global methods for querying multiple tables at once, and watching for changes.

... as well as a few utilities for encoding/decoding, under the `utils` namespace.

### Notable features

- **Fully typed** - The package is fully typed, with strict types for all properties, methods and functions.
- **Efficient storage and manipulation** - All properties are stored as tabular data using TinyBase, which allows for performant storage, retrieval, and savvy large-scale manipulation.
- **Powerful queries** - Using multiple query languages, both over a single or multiple tables, including TinyQL (a typed and programmatic API) (TODO: link example), straightforward human-readable queries (TODO: link example), and built-in direct/hook queries.
- **Dynamic and reactive** - The tables are reactive, meaning that each table (or group of tables) can be watched for changes, either globally or inside a precise query; including callbacks to trigger side effects, with details on the record and properties that were modified.
- **Local tables** - Local tables are tailored for client-side state management, can be aggregated with contract tables, and include all the same methods, as well as optional local storage persistence over sessions.
- **Storage adapter** - A built-in bridge between onchain logs and direct properties consumption on the client-side, which is a perfect fit for indexer/RPC sync using [the sync-stack](https://www.npmjs.com/package/@primodiumxyz/sync-stack), [as demonstrated in the tests](./packages//reactive-tables/src/__tests__/utils/sync/createSync.ts#83).

## Details

### Structure

```ml
packages/reactive-tables - "Entry point for the package"
├── dist - "Compiled files for distribution"
│   ├── index - "Main module"
│   └── utils - "Utilities for encoding/decoding"
└── src - "Source files"
    ├── __tests__ - "Tests related to the library"
    │   ├── contracts - "MUD contracts for testing various tables and systems"
    │   └── utils - "Utilities for testing (sync, function calls, network config)"
    ├── adapter - "Storage adapter (decode properties from logs), TinyBase adapter (encode/decode to/from TinyBase storable format)"
    ├── lib - "Internal and external types, constants, and functions"
    │   ├── external - "Any external utilities, e.g. non-modified MUD types"
    │   └── tinybase - "Functionalities strictly specific to TinyBase, e.g. storage/retrieval utilities, store creation, cell change parsing"
    ├── queries - "Table queries and listeners"
    │   └── templates - "Templates for common queries (direct and hooks)"
    ├── tables - "Generic table creation; definition -> table object with metadata and methods"
    │   ├── contract - "Registry creation, contract-specific metadata and methods"
    │   └── local - "Local table creation, including templates"
    ├── createWrapper.ts - "Main entry point for the package, creates a tables registry from a MUD config object"
    ├── index.ts - "Main module, exports all relevant functions and constants"
    └── utils.ts - "Utilities for encoding/decoding"
```

### Conventions

This package follows new naming conventions, which are meant to be more explicit than RECS, and fit better with the new architecture, i.e. tabular data, similar to TinyBase storage. Hence, it follows an architectural pattern that could be described as "reactive tables", which would encompass entities, components and systems (ECS) in a more explicit and relational way.

See the table below for details on the differences with RECS.

| Reference          | RECS reference | Details                                                                                     | Notes (TODO: only for internal review)                                                                                                                             |
| ------------------ | -------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Table definition` | `Table`        | A contract table issued from the MUD config object, or provided directly to the wrapper     | Could be `specs` as well                                                                                                                                           |
| `Registry`         | `Components`   | A collection of tables                                                                      | (I find it practical but not that much attached to it)                                                                                                             |
| `Table`            | `Component`    | Either a contract or local table, including its metadata and methods                        |                                                                                                                                                                    |
| `Record`           | `Entity`       | The key of a row inside a table, the content of the row being its properties (see below)    | This one is really explicit 95% of the time, but there is still that 5% where it is a bit confusing; could be identifier, id, tag (key is a bit confusing as well) |
| `Properties`       | `Value`        | The content of a row associated with a record, which is made of multiple cells = properties |                                                                                                                                                                    |
| `Property`         | ?              | A single cell, as a key-value pair                                                          |                                                                                                                                                                    |

It's worth noting that _systems_, which are not mentioned above, are included as table watchers (or listeners) directly tied to each table, and global watchers and queries.

## How to use

### Installation

Just install the package from npm, preferably with pnpm.

```bash
pnpm add @primodiumxyz/reactive-tables
```

### Usage

The wrapper is rather straightforward to use. Given a MUD config object, containing tables definitions, it will provide a fully typed tables registry, each with its own methods for updating, retrieving and querying data, as well as a storage adapter for syncing the state with onchain logs.

```typescript
import { createWrapper } from "@primodiumxyz/reactive-tables";
import mudConfig from "contracts/mud.config";

const { registry, tableDefs, store, storageAdapter } = createWrapper({
  mudConfig,
  // (optional) any additional table definitions
  // otherTableDefs: ...,
});
```

It can then be supplemented with local tables, which are custom-made tables with the same API as contract ones, but with no onchain counterpart.

```typescript
import { createLocalTable } from "@primodiumxyz/reactive-tables";
// ...

const Counter = createLocalNumberTable(store, { id: "Counter" });
// or with any properties schema
const Settings = createLocalTable(store, { language: PropType.String, darkMode: PropType.Bool }, { id: "Settings" });

// and then use it as any other table
Counter.set({ value: 1 });
const count = Counter.get();
console.log(count); // { value: 1 }
```

Local tables can also be synced with local storage, using a persistent store, which will automatically save/load all properties inside opted-in tables from one session to another.

```typescript
// ...

const { store } = createWrapper({ mudConfig });

// Wait for the persistent store to be ready to use (meaning for the sync to restore previous state)
// This needs to be done _before_ creating any local component
await store("PERSIST").ready();

// Create a persisted local table
const Settings = createLocalTable(
  store,
  { language: PropType.String, darkMode: PropType.Bool },
  { id: "Settings" },
  { persist: true },
);

// Dispose of the autosave/autoload on unmount
store("PERSIST").dispose();
```

TODO: global query methods

### Testing

The tests are intended to be published to a running anvil node, with the mock contracts deployed. This can be done in a few steps:

The prerequisites are to have the repository cloned and installed, as well as Foundry available. If you wish to test the sync with the indexer, you should have a Docker instance running before starting the following steps.

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

### Building

The package can be built for production using `pnpm build`.

If there are any issues with dependencies at some point, e.g. after updating them, you can run `pnpm clean && pnpm i`, which will recursively clean up all `node_modules` and reinstall all dependencies.
