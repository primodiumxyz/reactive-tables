import { groupLogsByBlockNumber } from "@latticexyz/block-logs-stream";
import { storeEventsAbi } from "@latticexyz/store";
import { PublicClient, WatchEventReturnType } from "viem";

import { createLogFilter } from "../../utils/common";
import { LogFilter, Reader, ReaderSubscribeRpcParams, StorageAdapterBlock } from "../../types";
import { debug, error } from "../../utils/debug";

type Subscription = {
  id: number;
  filter: LogFilter["filters"];
  callback: (block: StorageAdapterBlock) => void;
};

const clients = new Map<PublicClient, Subscription[]>();
const clientWatchers = new Map<PublicClient, WatchEventReturnType>();

function subscribe(
  publicClient: PublicClient,
  filter: LogFilter["filters"],
  callback: (block: StorageAdapterBlock) => void
): number {
  const subs = clients.get(publicClient);

  if (!subs) return -1;

  const id = subs.length;
  subs.push({ id, filter, callback });
  debug(`sub event - client: ${publicClient.name}, id: ${id}, subs: ${subs.length}`);
  return id;
}

function unsubscribe(publicClient: PublicClient, subscriptionId: number): void {
  const subs = clients.get(publicClient);

  if (!subs) return;

  if (subs.length === 1) {
    debug(`unsub event - client: ${publicClient.name}, id: ${subscriptionId}, subs: ${subs.length - 1}`);
    debug(`no listeners, unsubscribing from watch event`);

    //unsub from watch event
    clientWatchers.get(publicClient)?.();

    //remove client registration
    clients.delete(publicClient);
    clientWatchers.delete(publicClient);

    return;
  }

  clients.set(
    publicClient,
    subs.filter((sub) => sub.id !== subscriptionId)
  );

  debug(`unsub event - client: ${publicClient.name}, id: ${subscriptionId}, subs: ${subs.length - 1}`);
}

function initializeWatchEvent(args: ReaderSubscribeRpcParams) {
  const { publicClient, address } = args;

  //set client with empty subscriptions
  clients.set(publicClient, []);

  const unsub = publicClient.watchEvent({
    onLogs: (logs) => {
      const subs = clients.get(publicClient);

      if (!subs === undefined) {
        error("could not find public client");
        return;
      }

      //just in case
      if (subs?.length === 0) {
        debug(`no listeners, unsubscribing from watch event`);
        unsub();
        clients.delete(publicClient);
        clientWatchers.delete(publicClient);
        return;
      }

      subs?.forEach(({ filter, callback }) => {
        const filteredLogs = filter ? logs.filter(createLogFilter(filter)) : logs;
        const blocks = groupLogsByBlockNumber(filteredLogs) as StorageAdapterBlock[];
        debug(
          `client: ${publicClient.name}, subs: ${subs.length}: logs: ${logs.length}, filteredLogs: ${filteredLogs.length}, blocks: ${blocks.length}`
        );
        for (const block of blocks) {
          callback(block);
        }
      });
    },
    events: storeEventsAbi,
    address: address,
    strict: true,
  });

  clientWatchers.set(publicClient, unsub);
}

export function subscribeLogs(args: ReaderSubscribeRpcParams): Reader {
  if (!clients.has(args.publicClient)) {
    initializeWatchEvent(args);
  }

  return {
    subscribe: (userCallback) => {
      const subscriptionId = subscribe(args.publicClient, args.logFilter, userCallback);
      return () => unsubscribe(args.publicClient, subscriptionId);
    },
  };
}
