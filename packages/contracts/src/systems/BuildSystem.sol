// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

// external
import { PrimodiumSystem } from "systems/internal/PrimodiumSystem.sol";

// tables
import { P_EnumToPrototype, PositionData } from "codegen/index.sol";

// libraries
import { LibBuilding } from "libraries/LibBuilding.sol";
import { increaseMaxStorage, upgradeProductionRate, spendBuildingRequiredResources } from "libraries/SubsystemCalls.sol";

// types
import { BuildingKey } from "src/Keys.sol";
import { EBuilding } from "src/Types.sol";

contract BuildSystem is PrimodiumSystem {
  function build(
    EBuilding buildingType,
    PositionData memory coord
  ) public _claimResources(coord.parent) returns (bytes32 buildingEntity) {
    require(buildingType > EBuilding.NULL && buildingType < EBuilding.LENGTH, "[BuildSystem] Invalid building type");

    bytes32 buildingPrototype = P_EnumToPrototype.get(BuildingKey, uint8(buildingType));
    buildingEntity = LibBuilding.build(_player(), buildingPrototype, coord);

    increaseMaxStorage(buildingEntity, 1);
    upgradeProductionRate(buildingEntity, 1);
    spendBuildingRequiredResources(buildingEntity, 1);
  }
}
