import { transportObserver } from "@latticexyz/common";
import { createPublicClient as createViemPublicClient, fallback, http, PublicClient, Transport } from "viem";

import { NetworkConfig } from "@/types";

export const createPublicClient = (networkConfig: NetworkConfig): PublicClient =>
  createViemPublicClient({
    chain: networkConfig.chain,
    transport: transportObserver(fallback([http()])),
    pollingInterval: 1000,
  });
