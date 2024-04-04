import { namespaceWorld } from "@latticexyz/recs";
import { Observable } from "rxjs";
import { BlockNumber } from "../components/clientComponents";
import { world } from "../world";

export const setupBlockNumber = (blockNumber$: Observable<bigint>) => {
  const span = 100;
  const blockTimes: number[] = [];
  let prevBlockTime: number | undefined = undefined;

  const systemWorld = namespaceWorld(world, "systems");
  const blockListener = blockNumber$.subscribe(async (blockNumber) => {
    if (!prevBlockTime) {
      prevBlockTime = Date.now();
      return;
    }

    const timeDifference = (Date.now() - prevBlockTime) / 1000;
    prevBlockTime = Date.now();

    blockTimes.push(timeDifference); // Add the new block time to the queue

    // If we have more than 100 blocks, remove the oldest
    if (blockTimes.length > span) {
      blockTimes.shift();
    }

    // Compute the average over the window (i.e., over the items in the queue)
    const total = blockTimes.reduce((sum, time) => sum + time, 0);
    const avgBlockTime = Math.round(total / blockTimes.length);

    BlockNumber.set({ value: blockNumber, avgBlockTime: avgBlockTime });
  });

  systemWorld.registerDisposer(() => blockListener.unsubscribe());
};
