import { useEffect, useState } from "react";
import { Metadata, Type, Entity } from "@latticexyz/recs";
import { world } from "src/network/world";
import { Options, createExtendedComponent } from "./ExtendedComponent";
import { TransactionQueue } from "../clientComponents";
import { TransactionQueueType, TransactionQueueMetadataTypes } from "src/util/constants";

export type MetadataTypes = {
  [K in TransactionQueueType]: K extends keyof TransactionQueueMetadataTypes
    ? TransactionQueueMetadataTypes[K]
    : unknown;
};

export function createTransactionQueueComponent<M extends Metadata>(options?: Options<M>) {
  const queue: { id: Entity; fn: () => Promise<void> }[] = [];
  let isRunning = false;

  const component = createExtendedComponent(
    world,
    {
      metadata: Type.OptionalString,
      type: Type.OptionalNumber,
    },
    options
  );

  // Add a function to the queue
  async function enqueue<T extends keyof MetadataTypes>(
    fn: () => Promise<void>,
    id: Entity,
    type?: T,
    metadata?: MetadataTypes[T]
  ) {
    if (component.has(id)) return;

    queue.push({
      id,
      fn,
    });

    component.set(
      {
        metadata: JSON.stringify(metadata),
        type,
      },
      id
    );

    await run();
  }

  async function run() {
    if (isRunning) return;
    isRunning = true;

    while (queue.length) {
      const tx = queue[0];

      if (!tx) continue;

      const { id, fn } = tx;

      if (fn) {
        try {
          await fn();
        } catch (error) {
          console.error("Error executing function:", error);
        } finally {
          queue.shift();
          component.remove(id);
        }
      }
    }

    isRunning = false;
  }

  function getIndex(id: Entity) {
    return queue.findIndex((item) => item.id === id);
  }

  function getSize() {
    return queue.length;
  }

  function getMetadata<T extends keyof MetadataTypes>(id: Entity): MetadataTypes[T] | undefined {
    const index = getIndex(id);
    if (index === -1) return undefined;
    return JSON.parse(component.get(id)?.metadata || "");
  }

  function useIndex(id: Entity) {
    const [position, setPosition] = useState<number>(getIndex(id));

    useEffect(() => {
      const sub = TransactionQueue.update$.subscribe(() => {
        const position = getIndex(id);
        setPosition(position);
      });

      return () => {
        sub.unsubscribe();
      };
    }, [id]);

    return position;
  }

  function useSize() {
    const [size, setSize] = useState<number>(getSize());

    useEffect(() => {
      const sub = TransactionQueue.update$.subscribe(() => {
        const size = getSize();
        setSize(size);
      });

      return () => {
        sub.unsubscribe();
      };
    }, []);

    return size;
  }

  return {
    ...component,
    enqueue,
    run,
    getIndex,
    useIndex,
    useSize,
    getSize,
    getMetadata,
  };
}
