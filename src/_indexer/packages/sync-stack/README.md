# Sync Stack

## Description

`@primodiumxyz/sync-stack` is a modularized utility library based on Lattice's MUD sync-store to easily build reusable sync pipelines that require more granular control over reading and writing from/to multiple sources.

## Components

A sync stack is comprised of a number of readers and writers:

- **Reader**: Defines how records are retrieved from an external source (RPC, indexer, etc.)
  - Included: RPC, Indexer, and Decoded Indexer (See [examples](#examples) and filter/query [schemas](/packages/pg-indexer-reader/README.md#schemas))
- **Write**: Defines how these records are written to a store of choice. (recs, zustand, cache, etc.)
  - Included: Recs (See [examples](#examples))
- **Sync**: A helper function to create reusable sync stacks by passing in a number of readers and writers.

## Prerequisites

- Node.js (>=14.0.0)
- pnpm
- MUD V2
- viem (RPC reading)

## Installation

Install with npm, yarn, or pnpm

npm:

```bash
npm install @primodiumxyz/sync-stack
```

yarn:

```
yarn add @primodiumxyz/sync-stack
```

pnpm:

```
pnpm i @primodiumxyz/sync-stack
```

## Architecture

<img width="491" alt="image" src="https://github.com/primodiumxyz/mud-state-tools/assets/43505437/695436a5-1c14-4702-89bc-505798271cf2">

## Basic Usage

### Stream from RPC and Write to Console

Let's setup a basic sync pipeline that reads for mud events on the rpc and prints the records to console:

```ts
// create viem client
const publicClient = createPublicClient({
  transport: transportObserver(http()),
  chain: localhost,
});

//create sync pipeline
const sync = Sync.withCustom({
  reader: Read.fromRPC.subscribe({
    address: WORLD_ADDRESS,
    publicClient,
  }),
  writer: Write.toConsole,
});

//start the sync
sync.start();

// stop listening after 10 seconds
setTimeout(() => {
  sync.unsubscribe();
}, 1000 * 10);
```

See full [example](/packages/sync-stack/examples/sync/syncToConsole.ts).

### Sync with recs using included helper `withLiveRPCRecsSync`:

Sync stack also comes with pre-configured sync helpers for getting started with `recs`.

```ts
// create viem client
const publicClient = createPublicClient({
  transport: transportObserver(http()),
  chain: localhost,
});

// create recs world and components
const world = createWorld();
const tables = resolveConfig(config).tables;
recsStorage({
  world,
  tables,
});

//sync to recs components
const sync = Sync.withLiveRPCRecsSync({
  address: WORLD_ADDRESS,
  publicClient,
  world,
  tables,
});

//start the sync
sync.start();

// stop listening after 10 seconds
setTimeout(() => {
  sync.unsubscribe();
}, 1000 * 10);
```

See full [example](/packages/sync-stack/examples/sync/syncWithRecs.ts).

## Advanced Usage

### Sync from Decoded Indexer using helper `withQueryDecodedIndexerRecsSync`

```ts
// create recs world and components
const world = createWorld();
const tables = resolveConfig(config).tables;
recsStorage({
  world,
  tables,
});

// sync recs from query results whre score is greater than 100k
const sync = Sync.withQueryDecodedIndexerRecsSync({
  indexerUrl: INDEXER_URL,
  world,
  tables,
  query: {
    address: WORLD_ADDRESS,
    queries: [
      {
        tableName: "Score",
        where: {
          column: "value",
          operation: "gt",
          value: 100_000,
        },
      },
    ],
  },
});

//start the sync
sync.start();
```

See full [example](/packages/sync-stack/examples/sync/syncWithRecsFromIndexer.ts).

## Examples

To see all examples, including creating your own custom readers and writers, go [here](/packages/sync-stack/examples).

## Contributions

Pull requests and issues are welcome.

## License

MIT
