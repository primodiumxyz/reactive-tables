import { EventEmitter } from "eventemitter3";
import { ReaderFilterIndexerParams, Reader, StorageAdapterBlock } from "../../types";
import { isStorageAdapterBlockIndexer, processJSONStream } from "../../utils/common";

export const filterLogs = (args: ReaderFilterIndexerParams): Reader => {
  const { indexerUrl, filter } = args;
  return {
    subscribe: (userCallback, errorCallback) => {
      const eventEmitter = new EventEmitter();

      // Listen for the 'update' event
      eventEmitter.on("update", userCallback);

      // Listen for the 'error' event
      if (errorCallback) eventEmitter.on("error", errorCallback);

      // Start fetching the logs
      (async () => {
        try {
          const urlEncodedQuery = encodeURIComponent(JSON.stringify(filter));
          const url = `${indexerUrl}/api/logs?input=${urlEncodedQuery}`;
          for await (const result of processJSONStream(url)) {
            if (!isStorageAdapterBlockIndexer(result)) {
              eventEmitter.emit("update", {
                blockNumber: 0n,
                logs: [],
                progress: 1,
              } as StorageAdapterBlock);
              return;
            }

            eventEmitter.emit("update", {
              blockNumber: BigInt(result.blockNumber),
              logs: result.logs,
              progress: result.chunk / result.totalChunks,
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
};
