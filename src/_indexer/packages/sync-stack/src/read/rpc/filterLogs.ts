import { EventEmitter } from "eventemitter3";
import { fetchLogs } from "@latticexyz/block-logs-stream";
import { storeEventsAbi } from "@latticexyz/store";
import { ReaderFilterRpcParams, Reader } from "../../types";

export function filterLogs(args: ReaderFilterRpcParams): Reader {
  return {
    subscribe: (userCallback, errorCallback) => {
      const eventEmitter = new EventEmitter();

      // Listen for the 'update' event
      eventEmitter.on("update", userCallback);

      // Listen for the 'error' event
      if (errorCallback) eventEmitter.on("error", errorCallback);

      (async () => {
        try {
          for await (const { logs, toBlock } of fetchLogs({
            events: storeEventsAbi,
            fromBlock: args.fromBlock,
            address: args.address,
            toBlock: args.toBlock,
            publicClient: args.publicClient,
            maxBlockRange: args.maxBlockRange,
          })) {
            const blocks = Number(toBlock - args.fromBlock);
            const totalBlocks = Number(args.toBlock - args.fromBlock);
            eventEmitter.emit("update", {
              blockNumber: toBlock,
              logs,
              progress: totalBlocks ? blocks / totalBlocks : 1,
            });
          }
        } catch (err) {
          eventEmitter.emit("error", err);
        } finally {
          eventEmitter.removeAllListeners("update");
          eventEmitter.removeAllListeners("error");
        }
      })();

      return () => {
        eventEmitter.removeAllListeners("update");
        eventEmitter.removeAllListeners("error");
      };
    },
  };
}
