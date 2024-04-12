// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

/* Autogenerated file. Do not edit manually. */

/**
 * @title ITestSystem
 * @author MUD (https://mud.dev) by Lattice (https://lattice.xyz)
 * @dev This interface is automatically generated from the corresponding system contract. Do not edit manually.
 */
interface ITestSystem {
  error ITEMS_LENGTH_MISMATCH();

  function increment() external;

  function move(int32 x, int32 y) external;

  function storeItems(uint32[] memory ids, uint32[] memory weights) external;
}