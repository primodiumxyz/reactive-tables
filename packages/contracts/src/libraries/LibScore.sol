// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;
import { EResource, EUnit } from "src/Types.sol";

import { LibStorage } from "libraries/LibStorage.sol";
import { LibUnit } from "libraries/LibUnit.sol";
import { UtilityMap } from "libraries/UtilityMap.sol";

import { P_Transportables, P_IsRecoverable, Level, IsActive, P_ConsumesResource, ConsumptionRate, ProducedResource, P_RequiredResources, P_IsUtility, ProducedResource, P_RequiredResources, Score, P_ScoreMultiplier, P_IsUtility, P_RequiredResources, P_GameConfig, P_RequiredResourcesData, P_RequiredUpgradeResources, P_RequiredUpgradeResourcesData, P_EnumToPrototype, ResourceCount, MaxResourceCount, UnitLevel, LastClaimedAt, ProductionRate, BuildingType, OwnedBy } from "codegen/index.sol";
import { AsteroidOwnedByKey, UnitKey } from "src/Keys.sol";

import { WORLD_SPEED_SCALE } from "src/constants.sol";

library LibScore {
  function updateScore(bytes32 spaceRock, uint8 resource, uint256 value) internal {
    uint256 count = ResourceCount.get(spaceRock, resource);
    uint256 currentSpaceRockScore = Score.get(spaceRock);
    uint256 scoreChangeAmount = P_ScoreMultiplier.get(resource);

    if (scoreChangeAmount == 0) return;

    if (value < count) {
      scoreChangeAmount *= (count - value);
      currentSpaceRockScore -= scoreChangeAmount;
    } else {
      scoreChangeAmount *= (value - count);
      currentSpaceRockScore += scoreChangeAmount;
    }
    Score.set(spaceRock, currentSpaceRockScore);
  }

  function updatePlayerScore(bytes32 playerEntity, bytes32 spaceRockEntity, uint256 score) internal {
    uint256 currentScore = Score.get(playerEntity);
    uint256 spaceRockScore = Score.get(spaceRockEntity);

    if (score < spaceRockScore) {
      currentScore -= spaceRockScore - score;
    } else {
      currentScore += score - spaceRockScore;
    }
    Score.set(playerEntity, currentScore);
  }

  function updateScoreOnSpaceRock(bytes32 playerEntity, bytes32 spaceRock, bool isAquisition) internal {
    uint256 currentSpaceRockScore = Score.get(spaceRock);
    uint256 currenPlayerScore = Score.get(playerEntity);
    if (isAquisition) Score.set(playerEntity, currenPlayerScore + currentSpaceRockScore);
    else Score.set(playerEntity, currenPlayerScore - currentSpaceRockScore);
  }
}
