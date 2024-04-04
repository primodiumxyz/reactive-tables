import { createBlockStream } from "@latticexyz/block-logs-stream";
import { isDefined } from "@latticexyz/common/utils";
import { World as RecsWorld } from "@latticexyz/recs";
import { ResolvedStoreConfig, StoreConfig, Table, resolveConfig } from "@latticexyz/store";
import { StorageAdapterBlock } from "@latticexyz/store-sync";
import { RecsStorageAdapter, recsStorage } from "@latticexyz/store-sync/recs";
import storeConfig from "@latticexyz/store/mud.config";
import worldConfig from "@latticexyz/world/mud.config";
import { Read } from "@primodiumxyz/sync-stack";
import {
  Observable,
  concatMap,
  filter,
  firstValueFrom,
  identity,
  map,
  scan,
  share,
  shareReplay,
  throwError,
  timeout,
} from "rxjs";
import { Hex, PublicClient, TransactionReceiptNotFoundError } from "viem";

export const setupRecs = <config extends StoreConfig, extraTables extends Record<string, Table>>(args: {
  mudConfig: config;
  world: RecsWorld;
  publicClient: PublicClient;
  address: Hex;
  otherTables?: extraTables;
}) => {
  const { mudConfig, publicClient, world, address, otherTables } = args;

  const tables = {
    ...resolveConfig(mudConfig).tables,
    ...(otherTables ?? {}),
  } as ResolvedStoreConfig<config>["tables"] & extraTables;

  const { components } = recsStorage({
    tables,
    world,
  }) as { components: RecsStorageAdapter<ResolvedStoreConfig<config>["tables"] & extraTables>["components"] };

  const latestBlock$ = createBlockStream({ publicClient, blockTag: "latest" }).pipe(shareReplay(1));

  const latestBlockNumber$ = latestBlock$.pipe(
    map((block) => block.number),
    shareReplay(1)
  );

  const storedBlockLogs$ = new Observable<StorageAdapterBlock>((subscriber) => {
    const unsub = Read.fromRPC
      .subscribe({
        address,
        publicClient,
      })
      .subscribe((block) => {
        subscriber.next({
          blockNumber: block.blockNumber,
          logs: [...block.logs],
        });
      });

    // Handle unsubscription
    return () => {
      unsub();
    };
  }).pipe(share());

  // keep 10 blocks worth processed transactions in memory
  const recentBlocksWindow = 10;
  // most recent block first, for ease of pulling the first one off the array
  const recentBlocks$ = storedBlockLogs$.pipe(
    scan<StorageAdapterBlock, StorageAdapterBlock[]>(
      (recentBlocks, block) => [block, ...recentBlocks].slice(0, recentBlocksWindow),
      []
    ),
    filter((recentBlocks) => recentBlocks.length > 0),
    shareReplay(1)
  );

  // TODO: move to its own file so we can test it, have its own debug instance, etc.
  async function waitForTransaction(tx: Hex): Promise<void> {
    // debug("waiting for tx", tx);

    // This currently blocks for async call on each block processed
    // We could potentially speed this up a tiny bit by racing to see if 1) tx exists in processed block or 2) fetch tx receipt for latest block processed
    const hasTransaction$ = recentBlocks$.pipe(
      concatMap(async (blocks) => {
        const txs = blocks.flatMap((block) => block.logs.map((op) => op.transactionHash).filter(isDefined));
        if (txs.includes(tx)) return true;

        try {
          const lastBlock = blocks[0];
          // debug("fetching tx receipt for block", lastBlock.blockNumber);
          const receipt = await publicClient.getTransactionReceipt({ hash: tx });
          return lastBlock.blockNumber >= receipt.blockNumber;
        } catch (error) {
          if (error instanceof TransactionReceiptNotFoundError) {
            return false;
          }
          console.log(error);
          return false;
        }
      })
    );

    await firstValueFrom(
      hasTransaction$.pipe(
        filter(identity),
        timeout({ each: 10_000, with: () => throwError(() => new Error("Transaction failed.")) })
      )
    );
  }

  //include internal mud tables for recs sync
  const storeTables = resolveConfig(storeConfig).tables;
  const worldTables = resolveConfig(worldConfig).tables;

  return {
    components,
    latestBlock$,
    latestBlockNumber$,
    tables: { ...tables, ...storeTables, ...worldTables },
    storedBlockLogs$,
    waitForTransaction,
  };
};
