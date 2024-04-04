// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { Position, P_UnitPrototypes, Asteroid, IsActive, P_RawResource, Spawned, ConsumptionRate, OwnedBy, MaxResourceCount, ProducedUnit, ClaimOffset, BuildingType, ProductionRate, P_UnitProdTypes, P_RequiredResourcesData, P_RequiredResources, P_IsUtility, UnitCount, ResourceCount, Level, UnitLevel, Home, BuildingType, P_GameConfig, P_GameConfigData, P_Unit, P_UnitProdMultiplier, LastClaimedAt, P_EnumToPrototype } from "codegen/index.sol";

import { EUnit, EResource } from "src/Types.sol";
import { UnitFactorySet } from "libraries/UnitFactorySet.sol";
import { LibMath } from "libraries/LibMath.sol";
import { LibStorage } from "libraries/LibStorage.sol";
import { LibProduction } from "libraries/LibProduction.sol";
import { ColoniesMap } from "libraries/ColoniesMap.sol";
import { UnitProductionQueue, UnitProductionQueueData } from "libraries/UnitProductionQueue.sol";
import { UnitKey, AsteroidOwnedByKey } from "src/Keys.sol";
import { WORLD_SPEED_SCALE } from "src/constants.sol";

library LibUnit {
  /**
   * @dev Checks the requirements for training (producing) a specific unit in a building.
   * @param buildingEntity The identifier of the building where the unit is being trained.
   * @param unitPrototype The type of unit to be trained.
   * @notice Checks if the unit exists and if the building can produce the specified unit.
   */
  function checkTrainUnitsRequirements(bytes32 buildingEntity, bytes32 unitPrototype) internal view {
    require(IsActive.get(buildingEntity), "[TrainUnitsSystem] Can not train units using an in active building");

    // Determine the prototype of the unit based on its unit key.
    bytes32 buildingType = BuildingType.get(buildingEntity);

    uint256 level = Level.get(buildingEntity);
    // Check if the building can produce the specified unit based on its prototype.
    require(canProduceUnit(buildingType, level, unitPrototype), "[TrainUnitsSystem] Building cannot produce unit");
  }

  /// @notice Check if a building can produce a unit
  /// @param buildingEntity Entity ID of the building
  /// @param level Level of the building
  /// @param unitPrototype Unit prototype to check
  /// @return True if unit can be produced, false otherwise
  function canProduceUnit(bytes32 buildingEntity, uint256 level, bytes32 unitPrototype) internal view returns (bool) {
    if (P_UnitProdTypes.length(buildingEntity, level) == 0) return false;
    bytes32[] memory unitTypes = P_UnitProdTypes.get(buildingEntity, level);
    for (uint256 i = 0; i < unitTypes.length; i++) {
      if (unitTypes[i] == unitPrototype) return true;
    }
    return false;
  }

  /// @notice Claim units from all player's buildings
  /// @param spaceRockEntity Entity ID of the player
  function claimUnits(bytes32 spaceRockEntity) internal {
    // get all player buildings that can produce units
    bytes32[] memory buildings = UnitFactorySet.getAll(spaceRockEntity);
    for (uint256 i = 0; i < buildings.length; i++) {
      bytes32 building = buildings[i];
      claimBuildingUnits(building);
    }
  }

  /// @notice Claim units for a single building
  /// @param building Entity ID of the building
  function claimBuildingUnits(bytes32 building) internal {
    uint256 startTime = LastClaimedAt.get(building) - ClaimOffset.get(building);
    LastClaimedAt.set(building, block.timestamp);
    bytes32 asteroid = OwnedBy.get(building);
    require(Asteroid.getIsAsteroid(asteroid), "[ClaimBuildingUnits]: Asteroid does not exist");
    bytes32 player = OwnedBy.get(asteroid);
    bool stillClaiming = !UnitProductionQueue.isEmpty(building);
    while (stillClaiming) {
      UnitProductionQueueData memory item = UnitProductionQueue.peek(building);
      uint256 trainingTime = getUnitBuildTime(building, item.unitId);
      uint256 trainedUnits = item.quantity;
      if (trainingTime > 0) trainedUnits = LibMath.min(item.quantity, ((block.timestamp - startTime) / (trainingTime)));

      if (trainedUnits == 0) {
        ClaimOffset.set(building, (block.timestamp - startTime) % trainingTime);
        return;
      }
      if (trainedUnits == item.quantity) {
        UnitProductionQueue.dequeue(building);
        stillClaiming = !UnitProductionQueue.isEmpty(building);
        startTime += trainingTime * trainedUnits;
        if (!stillClaiming) ClaimOffset.set(building, 0);
      } else {
        item.quantity -= trainedUnits;
        UnitProductionQueue.updateFront(building, item);
        ClaimOffset.set(building, (block.timestamp - startTime) % trainingTime);
        stillClaiming = false;
      }
      ProducedUnit.set(player, item.unitId, ProducedUnit.get(player, item.unitId) + trainedUnits);

      increaseUnitCount(asteroid, item.unitId, trainedUnits, false);
    }
  }

  /// @notice Get the build time for a unit
  /// @param building Entity ID of the building
  /// @param unitPrototype Unit prototype to check
  /// @return Time in seconds
  function getUnitBuildTime(bytes32 building, bytes32 unitPrototype) internal view returns (uint256) {
    uint256 buildingLevel = Level.get(building);
    bytes32 buildingType = BuildingType.get(building);
    uint256 multiplier = P_UnitProdMultiplier.get(buildingType, buildingLevel);
    uint256 unitLevel = UnitLevel.get(Position.getParent(building), unitPrototype);
    uint256 rawTrainingTime = P_Unit.getTrainingTime(unitPrototype, unitLevel);
    require(multiplier > 0, "Building has no unit production multiplier");
    P_GameConfigData memory config = P_GameConfig.get();
    return
      (rawTrainingTime * 100 * 100 * WORLD_SPEED_SCALE) / (multiplier * config.unitProductionRate * config.worldSpeed);
  }

  /**
   * @dev Updates the stored utility resources based on the addition or removal of units.
   * @param spaceRockEntity The identifier of the player.
   * @param unitType The type of unit.
   * @param count The number of units being added or removed.
   * @param add A boolean indicating whether units are being added (true) or removed (false).
   */
  function updateStoredUtilities(bytes32 spaceRockEntity, bytes32 unitType, uint256 count, bool add) internal {
    if (count == 0) return;
    bytes32 playerEntity = OwnedBy.get(spaceRockEntity);
    uint256 unitLevel = UnitLevel.get(spaceRockEntity, unitType);

    P_RequiredResourcesData memory resources = P_RequiredResources.get(unitType, unitLevel);
    for (uint8 i = 0; i < resources.resources.length; i++) {
      uint8 resource = resources.resources[i];
      if (!P_IsUtility.get(resource)) continue;
      uint256 requiredAmount = resources.amounts[i] * count;
      if (requiredAmount == 0) continue;
      uint256 currentAmount = ResourceCount.get(spaceRockEntity, resource);

      if (add) {
        require(currentAmount >= requiredAmount, "[LibUnit] Not enough utility resources");
        ResourceCount.set(spaceRockEntity, resource, currentAmount - requiredAmount);
      } else {
        require(
          currentAmount + requiredAmount <= MaxResourceCount.get(spaceRockEntity, resource),
          "[LibUnit] Can't store more utility resources"
        );
        ResourceCount.set(spaceRockEntity, resource, currentAmount + requiredAmount);
      }
    }
  }

  function getCapitalShipCostMultiplier(bytes32 playerEntity) internal view returns (uint256) {
    uint256 multiplier = getCapitalShipsPlusAsteroids(playerEntity);
    return 2 ** multiplier;
  }

  function getCapitalShipsPlusAsteroids(bytes32 playerEntity) internal view returns (uint256) {
    bytes32[] memory ownedAsteroids = ColoniesMap.getAsteroidIds(playerEntity, AsteroidOwnedByKey);
    uint256 ret = 0;
    for (uint256 i = 0; i < ownedAsteroids.length; i++) {
      uint256 ships = MaxResourceCount.get(ownedAsteroids[i], uint8(EResource.U_CapitalShipCapacity)) -
        ResourceCount.get(ownedAsteroids[i], uint8(EResource.U_CapitalShipCapacity));

      ret += ships;
    }
    // subtract one so the first asteroid doesn't count
    return ret + ownedAsteroids.length - 1;
  }

  /**
   * @dev Increases the count of a specific unit type for a player's rock entity.
   * @param rockEntity The identifier of the player's rock entity.
   * @param unitType The type of unit to increase.
   * @param unitCount The number of units to increase.
   */
  function increaseUnitCount(bytes32 rockEntity, bytes32 unitType, uint256 unitCount, bool updatesUtility) internal {
    if (unitCount == 0) return;
    uint256 prevUnitCount = UnitCount.get(rockEntity, unitType);
    UnitCount.set(rockEntity, unitType, prevUnitCount + unitCount);
    if (updatesUtility) updateStoredUtilities(rockEntity, unitType, unitCount, true);
  }

  /**
   * @dev Decreases the count of a specific unit type for a player's rock entity.
   * @param rockEntity The identifier of the player's rock entity.
   * @param unitType The type of unit to decrease.
   * @param unitCount The number of units to decrease.
   */
  function decreaseUnitCount(bytes32 rockEntity, bytes32 unitType, uint256 unitCount, bool updatesUtility) internal {
    if (unitCount == 0) return;
    uint256 currUnitCount = UnitCount.get(rockEntity, unitType);
    require(currUnitCount >= unitCount, "[LibUnit] Not enough units to decrease");
    UnitCount.set(rockEntity, unitType, currUnitCount - unitCount);
    if (updatesUtility) updateStoredUtilities(rockEntity, unitType, unitCount, false);
  }
}
