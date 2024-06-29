import React, { useEffect, useState } from "react";

import { StorageAdapterData } from "@/dev/components";
import { useVisualizer } from "@/dev/lib/context";

export const HomePage = () => {
  const { publicClient, worldAddress } = useVisualizer();
  const [latestBlockNumber, setLatestBlockNumber] = useState<bigint | undefined>(undefined);

  useEffect(() => {
    if (!publicClient) return;

    let unwatch: () => void | undefined;
    const initWatcher = async () => {
      unwatch = publicClient.watchBlockNumber({
        onBlockNumber: (blockNumber) => {
          setLatestBlockNumber(blockNumber);
        },
      });
    };

    initWatcher();
    return () => unwatch?.();
  }, [publicClient]);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-bold text-base-500 uppercase text-xs">Network</h1>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex gap-4">
          <span className="text-base-500">Chain</span>
          <span>{publicClient ? `${publicClient.chain?.name} (${publicClient.chain?.id})` : "unknown"}</span>
        </div>
        <div className="flex gap-4">
          <span className="text-base-500">Latest block</span>
          <span>{latestBlockNumber?.toString() ?? "unknown"}</span>
        </div>
        {!!worldAddress && (
          <div className="flex gap-4">
            <span className="text-base-500">World</span>
            <span>{worldAddress}</span>
          </div>
        )}
      </div>
      <h1 className="font-bold text-base-500 uppercase text-xs">Storage adapter</h1>
      <StorageAdapterData limit={10} />
    </div>
  );
};
