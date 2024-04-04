import { Entity } from "@latticexyz/recs";
import { Hex } from "viem";
import { entityToAddress } from "../common";

export type LinkedAddressResult = {
  address: Hex | null;
  ensName: Hex | null;
};

// NOTE: This function will be replaced with account abstraction in a future update.

const addressMap = new Map<string, LinkedAddressResult>();
export const getEnsName = async (playerEntity: Entity | undefined, hard?: boolean): Promise<LinkedAddressResult> => {
  if (!playerEntity) return { address: null, ensName: null };
  const address = entityToAddress(playerEntity);
  if (!hard && addressMap.has(address)) {
    return addressMap.get(address)!;
  }

  try {
    const res = await fetch(`${import.meta.env.PRI_ACCOUNT_LINK_VERCEL_URL}/ens/by-address/${address}`);
    const jsonRes = await res.json();
    addressMap.set(address, jsonRes as LinkedAddressResult);
    return jsonRes as LinkedAddressResult;
  } catch (error) {
    return { address: null, ensName: null } as LinkedAddressResult;
  }
};

export const removeLinkedAddress = (address: Hex) => {
  addressMap.delete(address);
};
