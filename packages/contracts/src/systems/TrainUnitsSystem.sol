// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { PrimodiumSystem } from "systems/internal/PrimodiumSystem.sol";
import { P_UnitPrototypes, P_EnumToPrototype, QueueItemUnitsData, OwnedBy } from "codegen/index.sol";
import { UnitProductionQueue } from "codegen/Libraries.sol";

import { EUnit } from "src/Types.sol";
import { UnitKey } from "src/Keys.sol";
import { claimResources, claimUnits } from "libraries/SubsystemCalls.sol";
import { LibResource } from "codegen/Libraries.sol";
import { LibUnit } from "codegen/Libraries.sol";

contract TrainUnitsSystem is PrimodiumSystem {
  /// @notice Trains units based on specified unit type and count
  /// @param buildingEntity Entity identifier of the building
  /// @param unit Unit type to be trained
  /// @param count Quantity of units to be trained
  function trainUnits(bytes32 buildingEntity, EUnit unit, uint256 count) public {
    // Ensure the unit is valid (within the defined range of unit types).
    require(unit > EUnit.NULL && unit < EUnit.LENGTH, "[TrainUnitsSystem] Unit does not exist");
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(unit));
    _trainUnits(buildingEntity, unitPrototype, count);
  }

  /// @notice Trains units based on specified unit prototype and count this has an inefficiency of looping through all unit prototypes
  /// @param buildingEntity Entity identifier of the building
  /// @param unitPrototype Unit prototype to be trained
  /// @param count Quantity of units to be trained
  function trainUnits(bytes32 buildingEntity, bytes32 unitPrototype, uint256 count) public {
    // Ensure the unit is valid (within the defined range of unit types).
    bool isValid = false;
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) {
        isValid = true;
        break;
      }
    }
    require(isValid, "[TrainUnitsSystem] Unit does not exist");
    _trainUnits(buildingEntity, unitPrototype, count);
  }

  /// @notice Trains units based on specified unit type and count
  /// @param buildingEntity Entity identifier of the building
  /// @param unitPrototype Unit prototype to be trained
  /// @param count Quantity of units to be trained
  function _trainUnits(bytes32 buildingEntity, bytes32 unitPrototype, uint256 count) internal {
    if (count == 0) return;

    bytes32 spaceRockEntity = OwnedBy.get(buildingEntity);

    claimResources(spaceRockEntity);
    claimUnits(spaceRockEntity);
    LibResource.spendUnitRequiredResources(spaceRockEntity, unitPrototype, count);
    LibUnit.checkTrainUnitsRequirements(buildingEntity, unitPrototype);

    QueueItemUnitsData memory queueItem = QueueItemUnitsData({ unitId: unitPrototype, quantity: count });
    UnitProductionQueue.enqueue(buildingEntity, queueItem);
  }
}
