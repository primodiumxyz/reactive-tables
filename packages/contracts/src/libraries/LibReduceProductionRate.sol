// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { ConsumptionRate, OwnedBy, P_RequiredDependency, P_RequiredDependencyData, P_Production, ProductionRate, Level, BuildingType } from "codegen/index.sol";

library LibReduceProductionRate {
  /// @notice Restores production rate when a building is destroyed
  /// @param buildingEntity Entity ID of the building
  function clearProductionRateReduction(bytes32 buildingEntity) internal {
    bytes32 spaceRockEntity = OwnedBy.get(buildingEntity);
    uint256 level = Level.get(buildingEntity);
    bytes32 buildingPrototype = BuildingType.get(buildingEntity);
    P_RequiredDependencyData memory requiredDeps = P_RequiredDependency.get(buildingPrototype, level);
    uint8 resource = requiredDeps.resource;
    uint256 requiredValue = requiredDeps.amount;
    if (requiredValue == 0) return;
    uint256 consumptionRate = ConsumptionRate.get(spaceRockEntity, resource);
    ConsumptionRate.set(spaceRockEntity, resource, consumptionRate - requiredValue);
  }

  /// @notice re activates reduces production rate for a building
  /// @param buildingEntity Entity ID of the building
  /// @param level Target level for the building
  function activateReduceProductionRate(bytes32 buildingEntity, uint256 level) internal {
    bytes32 spaceRockEntity = OwnedBy.get(buildingEntity);
    bytes32 buildingPrototype = BuildingType.get(buildingEntity);
    P_RequiredDependencyData memory requiredDeps = P_RequiredDependency.get(buildingPrototype, level);

    uint8 resource = requiredDeps.resource;
    uint256 requiredValue = requiredDeps.amount;
    if (requiredValue == 0) return;

    uint256 consumptionRate = ConsumptionRate.get(spaceRockEntity, resource);
    ConsumptionRate.set(spaceRockEntity, resource, consumptionRate + requiredValue);
  }

  /// @notice Reduces production rate when building or upgrading
  /// @param buildingEntity Entity ID of the building
  /// @param level Target level for the building
  function reduceProductionRate(bytes32 buildingEntity, uint256 level) internal {
    bytes32 spaceRockEntity = OwnedBy.get(buildingEntity);
    bytes32 buildingPrototype = BuildingType.get(buildingEntity);
    P_RequiredDependencyData memory requiredDeps = P_RequiredDependency.get(buildingPrototype, level);
    P_RequiredDependencyData memory prevRequiredDeps;
    if (level > 1) {
      prevRequiredDeps = P_RequiredDependency.get(buildingPrototype, level - 1);
    }

    uint8 resource = requiredDeps.resource;
    uint256 prevAmount = level > 1 ? prevRequiredDeps.amount : 0;
    uint256 requiredValue = requiredDeps.amount - prevAmount;
    if (requiredValue == 0) return;

    uint256 consumptionRate = ConsumptionRate.get(spaceRockEntity, resource);
    ConsumptionRate.set(spaceRockEntity, resource, consumptionRate + requiredValue);
  }
}
