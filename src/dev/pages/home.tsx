import React, { useEffect, useState } from "react";

import { Title } from "@/dev/components";
import { useDevTools } from "@/dev/lib/context";

export const HomePage = () => {
  const { publicClient, worldAddress } = useDevTools();
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
      <Title>Network</Title>
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
      <div className="flex flex-col gap-1">
        <Title>Tables</Title>
        <span className="text-base-100 text-sm">
          View and search entities and their associated properties inside each table.
        </span>
        <Title>Storage adapter</Title>
        <span className="text-base-100 text-sm">
          View and query all historical and live table updates from the storage adapter.
        </span>
        <Title>Entities</Title>
        <span className="text-base-100 text-sm">Search properties for an entity inside all tables.</span>
        <Title>Query</Title>
        <span className="text-base-100 text-sm">
          Perform queries over tables and their state to find entities that match specific criteria.
        </span>
      </div>
    </div>
  );
};
