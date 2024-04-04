import { Entity } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { Hex, getAddress, isAddress, pad, size, trim } from "viem";
import { BlockIdToKey } from "./constants";

export function hasCommonElement<T>(setA: Set<T>, setB: Set<T>) {
  for (const element of setA) {
    if (setB.has(element)) {
      return true; // Found a common element
    }
  }
  return false; // No common elements found
}

export function clampedIndex(index: number, length: number) {
  if (index < 0) {
    return 0;
  }
  if (index >= length) {
    return length - 1;
  }
  return index;
}

export const wrap = (index: number, length: number) => {
  return ((index % length) + length) % length;
};

export const getRandomRange = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

export const distanceBI = (a: Coord, b: Coord) => {
  return BigInt(Math.round(Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))));
};

export const getDistance = (a: Coord, b: Coord) => {
  return Math.round(Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)));
};

export function toRomanNumeral(number: number) {
  const romanNumerals = [
    { value: 1000, symbol: "M" },
    { value: 900, symbol: "CM" },
    { value: 500, symbol: "D" },
    { value: 400, symbol: "CD" },
    { value: 100, symbol: "C" },
    { value: 90, symbol: "XC" },
    { value: 50, symbol: "L" },
    { value: 40, symbol: "XL" },
    { value: 10, symbol: "X" },
    { value: 9, symbol: "IX" },
    { value: 5, symbol: "V" },
    { value: 4, symbol: "IV" },
    { value: 1, symbol: "I" },
  ];

  let result = "";

  for (const numeral of romanNumerals) {
    while (number >= numeral.value) {
      result += numeral.symbol;
      number -= numeral.value;
    }
  }

  return result;
}

export const getBlockTypeName = (blockType: Entity | undefined) => {
  if (blockType === undefined || BlockIdToKey[blockType] == undefined) return "";

  return BlockIdToKey[blockType]
    .replace(/([A-Z])([0-9])/g, "$1 $2") // Insert a space between an uppercase letter and a number.
    .replace(/([0-9])([A-Z])/g, "$1 $2") // Insert a space between a number and an uppercase letter.
    .replace(/([a-z])([0-9])/g, "$1 $2") // Insert a space between a lowercase letter and a number.
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2") // Insert a space between consecutive uppercase letters where the second one is followed by lowercase letter (camelCase).
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Handle general camelCase like "minePlatinum".
    .trimStart();
};

export const shortenAddress = (address: Hex): Hex => {
  return `0x${address.slice(2, 6)}...${address.slice(-4)}`;
};

export function reverseRecord<T extends PropertyKey, U extends PropertyKey>(input: Record<T, U>) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [value, key])) as Record<U, T>;
}

export const normalizeAddress = (address: Hex): Hex => {
  // Assumes that the address is already a valid address with length at most 20 bytes
  return pad(trim(address), { size: 20 });
};

export const entityToAddress = (entity: Entity | string, shorten = false): Hex => {
  // Cannot use trim() directly because a valid address might start with 0x0000...
  // After trimming the address, we need to pad it back to 20 bytes using viem pad()
  const normalizedAddress = normalizeAddress(entity as Hex);

  // This function should throw an error if entity is not a valid address
  const checksumAddress = getAddress(normalizedAddress);

  return shorten ? shortenAddress(checksumAddress) : checksumAddress;
};

export const isPlayer = (entity: Entity) => {
  const trimmedAddress = trim(entity as Hex);
  const addressSize = size(trimmedAddress);

  const address = addressSize <= 20 ? pad(trimmedAddress, { size: 20 }) : trimmedAddress;

  return isAddress(address);
};

export function clampBigInt(value: bigint, min: bigint, max: bigint) {
  return value < BigInt(min) ? BigInt(min) : value > BigInt(max) ? BigInt(max) : value;
}

export function calculateAngleBetweenPoints(point1: Coord, point2: Coord) {
  const dy = point2.y - point1.y;
  const dx = point2.x - point1.x;
  const radian = Math.atan2(dy, dx);
  let degree = radian * (180 / Math.PI);
  if (degree < 0) degree = 360 + degree;
  return { radian, degree };
}
