# Reactive Tables

TODO: introduction (one-liner + short description)

Every relevant functions and constants are exported from the main module, as well as a few utilities, mostly for encoding/decoding, under the `utils` namespace.

All methods for communicating with a table are directly available on its object, with the exception of global query and watching methods—meant for usage across multiple tables—which must be imported from the main module.

## How to use

### Installation

TODO after publishing

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
