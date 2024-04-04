// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { P_ConsumesResource, ConsumptionRate, OwnedBy, ResourceCount, BuildingType, Level, P_Production, P_ProductionData, P_IsUtility, ProductionRate } from "codegen/index.sol";
import { EResource } from "src/Types.sol";
import { LibStorage } from "libraries/LibStorage.sol";

library LibProduction {
  /// @notice activates the resource production of a building
  /// @param buildingEntity Entity ID of the building to upgrade
  /// @param targetLevel Level to which the building is upgraded
  function activateResourceProduction(bytes32 buildingEntity, uint256 targetLevel) internal {
    bytes32 spaceRockEntity = OwnedBy.get(buildingEntity);
    bytes32 buildingPrototype = BuildingType.get(buildingEntity);
    P_ProductionData memory prototypeProduction = P_Production.get(buildingPrototype, targetLevel);

    for (uint8 i = 0; i < prototypeProduction.resources.length; i++) {
      increaseResourceProduction(
        spaceRockEntity,
        EResource(prototypeProduction.resources[i]),
        prototypeProduction.amounts[i]
      );
    }
  }

  /// @notice Upgrades the resource production of a building
  /// @param buildingEntity Entity ID of the building to upgrade
  /// @param targetLevel Level to which the building is upgraded
  function upgradeResourceProduction(bytes32 buildingEntity, uint256 targetLevel) internal {
    bytes32 spaceRockEntity = OwnedBy.get(buildingEntity);
    bytes32 buildingPrototype = BuildingType.get(buildingEntity);
    P_ProductionData memory prototypeProduction = P_Production.get(buildingPrototype, targetLevel);

    uint256 lastLevelResourceLength;
    uint256[] memory lastLevelAmounts;

    if (targetLevel > 1) {
      lastLevelResourceLength = P_Production.lengthAmounts(buildingPrototype, targetLevel - 1);
      lastLevelAmounts = P_Production.get(buildingPrototype, targetLevel - 1).amounts;
    }
    for (uint8 i = 0; i < prototypeProduction.resources.length; i++) {
      uint256 prevLevelPrototypeProduction = 0;
      if (targetLevel > 1 && lastLevelResourceLength > i) {
        prevLevelPrototypeProduction = lastLevelAmounts[i];
      }
      uint256 addedProductionRate = prototypeProduction.amounts[i] - prevLevelPrototypeProduction;
      increaseResourceProduction(spaceRockEntity, EResource(prototypeProduction.resources[i]), addedProductionRate);
    }
  }

  /// @notice increases the resource production for the spaceRock
  /// @param spaceRockEntity Entity ID of the spaceRock owning the building
  /// @param resource the resource the production is increased for
  /// @param amount the amount the production is increased by
  function increaseResourceProduction(bytes32 spaceRockEntity, EResource resource, uint256 amount) internal {
    uint8 resourceIndex = uint8(resource);
    if (P_IsUtility.get(resourceIndex)) {
      LibStorage.increaseMaxUtility(spaceRockEntity, resourceIndex, amount);
      LibStorage.increaseStoredResource(spaceRockEntity, resourceIndex, amount);
      return;
    }
    uint256 prevProductionRate = ProductionRate.get(spaceRockEntity, resourceIndex);
    ProductionRate.set(spaceRockEntity, resourceIndex, prevProductionRate + amount);
  }

  /// @notice Clears the resource production of a building, used when the building is destroyed
  /// @param buildingEntity Entity ID of the building to clear
  function clearResourceProduction(bytes32 buildingEntity) internal {
    bytes32 spaceRockEntity = OwnedBy.get(buildingEntity);
    bytes32 buildingPrototype = BuildingType.get(buildingEntity);
    uint256 buildingLevel = Level.get(buildingEntity);
    P_ProductionData memory prototypeProduction = P_Production.get(buildingPrototype, buildingLevel);
    for (uint8 i = 0; i < prototypeProduction.resources.length; i++) {
      decreaseResourceProduction(
        spaceRockEntity,
        EResource(prototypeProduction.resources[i]),
        prototypeProduction.amounts[i]
      );
    }
  }

  /// @notice Reduces the resource production for the spaceRock
  /// @param spaceRockEntity Entity ID of the spaceRock owning the building
  /// @param resource the resource the production is reduced for
  /// @param amount the amount the production is reduced by
  function decreaseResourceProduction(bytes32 spaceRockEntity, EResource resource, uint256 amount) internal {
    uint8 resourceIndex = uint8(resource);
    if (P_IsUtility.get(resourceIndex)) {
      uint256 availableUtility = ResourceCount.get(spaceRockEntity, resourceIndex);
      require(availableUtility >= amount, "[UtilityUsage] Cannot decrease utility amount below 0");
      LibStorage.decreaseStoredResource(spaceRockEntity, resourceIndex, amount);
      LibStorage.decreaseMaxUtility(spaceRockEntity, resourceIndex, amount);
      return;
    }
    uint256 prevProductionRate = ProductionRate.get(spaceRockEntity, resourceIndex);
    require(prevProductionRate >= amount, "[ProductionUsage] Cannot decrease resource production below 0");
    ProductionRate.set(spaceRockEntity, resourceIndex, prevProductionRate - amount);
  }
}
