// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { System } from "@latticexyz/world/src/System.sol";

import { LibProduction } from "libraries/LibProduction.sol";
import { LibReduceProductionRate } from "libraries/LibReduceProductionRate.sol";
import { Level, IsActive } from "codegen/index.sol";

contract S_ProductionRateSystem is System {
  function upgradeProductionRate(bytes32 buildingEntity, uint256 level) public {
    if (!IsActive.get(buildingEntity)) return;
    // Reduce the production rate of resources the building requires
    LibReduceProductionRate.reduceProductionRate(buildingEntity, level);

    // Upgrade resource production for the player's building entity
    LibProduction.upgradeResourceProduction(buildingEntity, level);
  }

  function toggleProductionRate(bytes32 buildingEntity) public {
    uint256 level = Level.get(buildingEntity);
    if (IsActive.get(buildingEntity)) {
      // Activate consumption
      LibReduceProductionRate.activateReduceProductionRate(buildingEntity, level);

      // Activate Production
      LibProduction.activateResourceProduction(buildingEntity, level);
    } else {
      // Clear production rate reductions for the building
      LibReduceProductionRate.clearProductionRateReduction(buildingEntity);

      // Clear resource production for the building
      LibProduction.clearResourceProduction(buildingEntity);
    }
  }

  function clearProductionRate(bytes32 buildingEntity) public {
    if (!IsActive.get(buildingEntity)) return;

    // Clear production rate reductions for the building
    LibReduceProductionRate.clearProductionRateReduction(buildingEntity);

    // Clear resource production for the building
    LibProduction.clearResourceProduction(buildingEntity);
  }
}
