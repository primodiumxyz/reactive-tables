// SPDX-License-Identifier: MIT
// This contract updates alliance scores based on player scores.

pragma solidity >=0.8.21;

import { StoreHook } from "@latticexyz/store/src/StoreHook.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { Score, Alliance, PlayerAlliance } from "codegen/index.sol";
import { ResourceIdInstance } from "@latticexyz/store/src/ResourceId.sol";
import { LibResource } from "libraries/LibResource.sol";
import { SliceLib, SliceInstance } from "@latticexyz/store/src/Slice.sol";

/// @title OnScore_Alliance_Score - Updates alliance scores based on player scores.
contract OnScore_Alliance_Score is StoreHook {
  constructor() {}

  /// @dev This function is called before splicing static data.
  /// @param keyTuple The key tuple of the player score.
  /// @param start The start position of the data.
  /// @param data The data to be processed.
  function onBeforeSpliceStaticData(
    ResourceId,
    bytes32[] memory keyTuple,
    uint48 start,
    bytes memory data
  ) public override {
    bytes32 playerEntity = keyTuple[0];
    bytes32 allianceEntity = PlayerAlliance.getAlliance(playerEntity);

    // Check if the player is part of an alliance
    if (allianceEntity == 0) {
      // If the player is not part of an alliance, there is no alliance score to update
      return;
    }

    bytes memory newScoreRaw = SliceInstance.toBytes(SliceLib.getSubslice(data, start));
    uint256 newScore = abi.decode(newScoreRaw, (uint256));
    uint256 oldScore = Score.get(playerEntity);
    uint256 allianceScore = Alliance.getScore(allianceEntity);

    if (newScore > oldScore) {
      uint256 scoreDiff = newScore - oldScore;
      Alliance.setScore(allianceEntity, allianceScore + scoreDiff);
    } else {
      uint256 scoreDiff = oldScore - newScore;
      Alliance.setScore(allianceEntity, allianceScore - scoreDiff);
    }
  }
}
