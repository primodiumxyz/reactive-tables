// SPDX-License-Identifier: MIT
// This contract handles resource counting and scoring.

pragma solidity >=0.8.21;

import { StoreHook } from "@latticexyz/store/src/StoreHook.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { LibScore } from "libraries/LibScore.sol";
import { OwnedBy, Home, IsFleet, Asteroid } from "codegen/index.sol";
import { SliceLib, SliceInstance } from "@latticexyz/store/src/Slice.sol";

/// @title OnAsteroidScore_PlayerScore - Handles updating score when resource count is updated.
contract OnAsteroidScore_PlayerScore is StoreHook {
  constructor() {}

  /// @dev This function is called before splicing static data.
  /// @param keyTuple The key tuple of the resource count.
  /// @param start The start position of the data.
  /// @param data The data to be processed.
  function onBeforeSpliceStaticData(
    ResourceId,
    bytes32[] memory keyTuple,
    uint48 start,
    bytes memory data
  ) public override {
    bytes32 entity = keyTuple[0];
    if (!Asteroid.getIsAsteroid(entity)) return;
    bytes32 playerEntity = OwnedBy.get(entity);
    bytes memory amountRaw = SliceInstance.toBytes(SliceLib.getSubslice(data, start));
    uint256 amount = abi.decode(amountRaw, (uint256));

    LibScore.updatePlayerScore(playerEntity, entity, amount);
  }
}
