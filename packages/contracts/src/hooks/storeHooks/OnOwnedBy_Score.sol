// SPDX-License-Identifier: MIT
// This contract handles resource counting and scoring.

pragma solidity >=0.8.21;

import { StoreHook } from "@latticexyz/store/src/StoreHook.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { LibScore } from "libraries/LibScore.sol";
import { OwnedBy, Asteroid } from "codegen/index.sol";
import { SliceLib, SliceInstance } from "@latticexyz/store/src/Slice.sol";

/// @title OnOwnedBy_Score - Handles updating score when asteroid ownership changes.
contract OnOwnedBy_Score is StoreHook {
  constructor() {}

  /// @dev This function is called before splicing static data.
  /// @param keyTuple The key tuple which is the target asteroid.
  /// @param start The start position of the data.
  /// @param data The data to be processed which is the new owner entity.
  function onBeforeSpliceStaticData(
    ResourceId,
    bytes32[] memory keyTuple,
    uint48 start,
    bytes memory data
  ) public override {
    bytes32 spaceRockEntity = keyTuple[0];

    if (!Asteroid.getIsAsteroid(spaceRockEntity)) return;

    bytes32 formerOwner = OwnedBy.get(spaceRockEntity);
    //score only updated for player owned asteroids
    bytes memory newOwnerRaw = SliceInstance.toBytes(SliceLib.getSubslice(data, start));
    bytes32 newOwner = abi.decode(newOwnerRaw, (bytes32));
    if (formerOwner == newOwner) return;
    if (formerOwner != bytes32(0)) {
      LibScore.updateScoreOnSpaceRock(formerOwner, spaceRockEntity, false);
    }
    if (newOwner != bytes32(0)) {
      LibScore.updateScoreOnSpaceRock(newOwner, spaceRockEntity, true);
    }
  }
}
