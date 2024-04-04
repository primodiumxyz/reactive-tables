// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { System } from "@latticexyz/world/src/System.sol";

import { LibResource } from "libraries/LibResource.sol";
import { IsActive } from "codegen/index.sol";

contract S_SpendResourcesSystem is System {
  function spendBuildingRequiredResources(bytes32 buildingEntity, uint256 level) public {
    LibResource.spendBuildingRequiredResources(buildingEntity, level);
  }

  function spendUpgradeResources(bytes32 spaceRockEntity, bytes32 upgradePrototype, uint256 level) public {
    LibResource.spendUpgradeResources(spaceRockEntity, upgradePrototype, level);
  }

  function toggleBuildingUtility(bytes32 buildingEntity) public {
    if (IsActive.get(buildingEntity)) {
      // Clear utility usage for the building
      LibResource.activateUtilityUsage(buildingEntity);
    } else {
      // Clear utility usage for the building
      LibResource.deactivateUtilityUsage(buildingEntity);
    }
  }

  function clearUtilityUsage(bytes32 buildingEntity) public {
    LibResource.clearUtilityUsage(buildingEntity);
  }
}
