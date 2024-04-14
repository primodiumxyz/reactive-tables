import { transportObserver } from "@latticexyz/common";
import { createPublicClient as createViemPublicClient, fallback, http, PublicClient, Transport } from "viem";
import createDebug from "debug";

import { NetworkConfig } from "@/types";

/* ---------------------------------- VIEM ---------------------------------- */
export const createPublicClient = (networkConfig: NetworkConfig): PublicClient =>
  createViemPublicClient({
    chain: networkConfig.chain,
    transport: transportObserver(fallback([http()])),
    pollingInterval: 1000,
  });

/* ---------------------------------- DEBUG --------------------------------- */
export const debug = createDebug("primodium:tiny-base-integration");
export const error = createDebug("primodium:tiny-base-integration");
// Pipe debug output to stdout instead of stderr
debug.log = console.debug.bind(console);
// Pipe error output to stderr
error.log = console.error.bind(console);
