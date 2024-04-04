import { Observable, ReplaySubject, filter, map } from "rxjs";
import { Block } from "viem";
import { world } from "./world";

/**
 * Create a clock optimistically keeping track of the current chain time.
 * The optimisitic chain time should be synced to the actual chain time in regular intervals using the `update` function.
 *
 * @param config
 * @returns: {@link Clock}
 */
export function createClock(
  latestBlock$: Observable<Block>,
  config: {
    period: number;
    initialTime: number;
    syncInterval: number;
  }
) {
  const { initialTime, period } = config;

  const clock = {
    currentTime: initialTime,
    lastUpdateTime: initialTime,
    time$: new ReplaySubject<number>(1),
    dispose: () => clearInterval(intervalId),
    update,
  };

  let intervalId = createTickInterval();
  emit();

  function emit() {
    clock.time$.next(clock.currentTime);
  }

  function createTickInterval() {
    return setInterval(() => {
      clock.currentTime += Math.floor(period / 1000);
      emit();
    }, period);
  }

  function update(time: number) {
    clearInterval(intervalId);
    clock.currentTime = time;
    clock.lastUpdateTime = time;
    emit();
    intervalId = createTickInterval();
  }

  latestBlock$
    .pipe(
      map((block) => Number(block.timestamp)), // Map to timestamp in ms
      filter((blockTimestamp) => blockTimestamp !== clock.lastUpdateTime), // Ignore if the clock was already refreshed with this block
      filter((blockTimestamp) => blockTimestamp !== clock.currentTime) // Ignore if the current local timestamp is correct
    )
    .subscribe(clock.update); // Update the local clock

  world.registerDisposer(() => clock.dispose());
  return clock;
}
