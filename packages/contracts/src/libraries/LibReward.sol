// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

// tables
import { P_IsUtility, MaxResourceCount, ResourceCount, P_ResourceReward, P_ResourceRewardData, P_UnitReward, P_UnitRewardData } from "codegen/index.sol";

// libraries
import { LibProduction } from "libraries/LibProduction.sol";
import { LibStorage } from "libraries/LibStorage.sol";
import { LibUnit } from "libraries/LibUnit.sol";

// types
import { EResource } from "src/Types.sol";

library LibReward {
  function receiveRewards(bytes32 playerEntity, bytes32 spaceRockEntity, bytes32 prototype) internal {
    receiveUnitRewards(playerEntity, spaceRockEntity, prototype);
    receiveResourceRewards(playerEntity, spaceRockEntity, prototype);
  }

  function receiveUnitRewards(bytes32 playerEntity, bytes32 spaceRockEntity, bytes32 prototype) internal {
    P_UnitRewardData memory rewardData = P_UnitReward.get(prototype);
    for (uint256 i = 0; i < rewardData.units.length; i++) {
      LibUnit.increaseUnitCount(spaceRockEntity, rewardData.units[i], rewardData.amounts[i], true);
    }
  }

  function receiveResourceRewards(bytes32 playerEntity, bytes32 spaceRockEntity, bytes32 prototype) internal {
    P_ResourceRewardData memory rewardData = P_ResourceReward.get(prototype);
    for (uint256 i = 0; i < rewardData.resources.length; i++) {
      if (P_IsUtility.get(rewardData.resources[i])) {
        LibProduction.increaseResourceProduction(
          spaceRockEntity,
          EResource(rewardData.resources[i]),
          rewardData.amounts[i]
        );
      } else {
        require(
          rewardData.amounts[i] + ResourceCount.get(spaceRockEntity, rewardData.resources[i]) <=
            MaxResourceCount.get(spaceRockEntity, rewardData.resources[i]),
          "[LibReward] Resource count exceeds max"
        );
        LibStorage.increaseStoredResource(spaceRockEntity, rewardData.resources[i], rewardData.amounts[i]);
      }
    }
  }
}
