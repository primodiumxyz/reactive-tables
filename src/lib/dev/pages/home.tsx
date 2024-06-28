import React, { useEffect } from "react";

import { useVisualizer } from "@/lib/dev/config/context";
import { EventsData } from "@/lib/dev/components";

export const HomePage = () => {
  const { publicClient, worldAddress } = useVisualizer();

  const [latestBlockNumber, setLatestBlockNumber] = React.useState<bigint | undefined>(undefined);

  useEffect(() => {
    if (!publicClient || !worldAddress) return;

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
  }, [publicClient, worldAddress]);

  if (!publicClient || !worldAddress)
    return (
      <p className="text-center text-sm">
        Please provide a client and the address of the world to monitor onchain activity.
      </p>
    );

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-bold text-base-500 uppercase text-xs">Network</h1>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex gap-4">
          <span className="text-base-500">Chain</span>
          <span>
            {publicClient.chain?.name} ({publicClient.chain?.id})
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-base-500">Latest block</span>
          <span>{latestBlockNumber?.toString()}</span>
        </div>
        <div className="flex gap-4">
          <span className="text-base-500">World</span>
          <span>{worldAddress}</span>
        </div>
      </div>
      <h1 className="font-bold text-base-500 uppercase text-xs">Recent events</h1>
      <EventsData />
    </div>
  );
};
