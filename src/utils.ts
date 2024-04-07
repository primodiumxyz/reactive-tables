import { transportObserver } from "@latticexyz/common";
import { createPublicClient as createViemPublicClient, fallback, http, PublicClient, Transport } from "viem";

import { NetworkConfig } from "@/types";

export const createPublicClient = (networkConfig: NetworkConfig): PublicClient =>
  createViemPublicClient({
    chain: networkConfig.chain,
    // TODO: fix this versions issue; primodium & sync-stack @1.14.0 & mud @2.7.12
    transport: transportObserver(fallback([http()])),
    pollingInterval: 1000,
  });
