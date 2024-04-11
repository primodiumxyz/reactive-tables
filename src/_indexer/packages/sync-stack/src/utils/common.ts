import { LogFilter, StorageAdapterBlock, StoreEventsLog } from "../types";

export function isStorageAdapterBlock(
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  data: any
): data is Omit<StorageAdapterBlock, "blockNumber"> & { blockNumber: string } {
  return data && typeof data.blockNumber === "string" && Array.isArray(data.logs);
}

export function isStorageAdapterBlockIndexer(
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  data: any
): data is Omit<StorageAdapterBlock, "blockNumber"> & { blockNumber: string; chunk: number; totalChunks: number } {
  return (
    data &&
    typeof data.blockNumber === "string" &&
    Array.isArray(data.logs) &&
    typeof data.chunk === "number" &&
    typeof data.totalChunks === "number"
  );
}

export const createLogFilter =
  (filters: NonNullable<LogFilter["filters"]>) =>
  (log: StoreEventsLog): boolean =>
    filters.some(
      (filter) =>
        filter.tableId === log.args.tableId &&
        (filter.key0 == null || filter.key0 === log.args.keyTuple[0]) &&
        (filter.key1 == null || filter.key1 === log.args.keyTuple[1])
    );

export async function* processJSONStream(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  let incompleteChunk = "";

  let done: boolean, value: Uint8Array | undefined;

  if (!reader) {
    console.error("No reader found on response body while processing JSON stream");
    return;
  }

  while ((({ done, value } = await reader.read()), !done)) {
    let decodedValue: string = decoder.decode(value, { stream: true });

    // Combine with the previous incomplete chunk (if any)
    decodedValue = incompleteChunk + decodedValue;

    // Indexer chunks are delimited by newlines
    const chunks: string[] = decodedValue.split("\n");

    // The last line might be incomplete, save it for the next iteration
    incompleteChunk = chunks.pop() as string;

    for (const chunk of chunks) {
      if (chunk) {
        yield JSON.parse(chunk);
      }
    }
  }
}
