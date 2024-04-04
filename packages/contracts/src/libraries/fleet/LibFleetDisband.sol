// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { EResource } from "src/Types.sol";
import { P_Transportables, P_EnumToPrototype, FleetStance, FleetStanceData, Position, FleetMovementData, FleetMovement, Spawned, PirateAsteroid, DefeatedPirate, UnitCount, ReversePosition, PositionData, P_Unit, P_UnitData, UnitLevel, P_GameConfig, P_GameConfigData, ResourceCount, OwnedBy, P_UnitPrototypes } from "codegen/index.sol";

import { LibMath } from "libraries/LibMath.sol";
import { LibEncode } from "libraries/LibEncode.sol";
import { LibUnit } from "libraries/LibUnit.sol";
import { LibStorage } from "libraries/LibStorage.sol";
import { LibFleet } from "libraries/fleet/LibFleet.sol";
import { FleetsMap } from "libraries/fleet/FleetsMap.sol";
import { LibFleetStance } from "libraries/fleet/LibFleetStance.sol";
import { LibCombatAttributes } from "libraries/LibCombatAttributes.sol";
import { FleetKey, FleetOwnedByKey, FleetIncomingKey, FleetStanceKey } from "src/Keys.sol";

import { WORLD_SPEED_SCALE, UNIT_SPEED_SCALE } from "src/constants.sol";
import { EResource, EFleetStance } from "src/Types.sol";

library LibFleetDisband {
  function disbandFleet(bytes32 fleetId) internal {
    uint8[] memory transportables = P_Transportables.get();
    //remove resources from fleet
    for (uint8 i = 0; i < transportables.length; i++) {
      uint256 fleetResourceCount = ResourceCount.get(fleetId, transportables[i]);
      if (fleetResourceCount == 0) continue;
      LibFleet.decreaseFleetResource(fleetId, transportables[i], fleetResourceCount);
    }

    //remove units and return utility to space rock
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    for (uint8 i = 0; i < unitPrototypes.length; i++) {
      uint256 unitCount = UnitCount.get(fleetId, unitPrototypes[i]);
      if (unitCount == 0) continue;
      LibFleet.decreaseFleetUnit(fleetId, unitPrototypes[i], unitCount, true);
    }
  }

  function disbandUnitsAndResourcesFromFleet(
    bytes32 fleetId,
    uint256[] calldata unitCounts,
    uint256[] calldata resourceCounts
  ) internal {
    disbandResources(fleetId, resourceCounts);
    disbandUnits(fleetId, unitCounts);
  }

  function disbandUnits(bytes32 fleetId, uint256[] calldata unitCounts) internal {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    for (uint8 i = 0; i < unitPrototypes.length; i++) {
      if (unitCounts[i] == 0) continue;
      uint256 fleetUnitCount = UnitCount.get(fleetId, unitPrototypes[i]);
      require(fleetUnitCount >= unitCounts[i], "[Fleet] Not enough units to disband from fleet");
      LibFleet.decreaseFleetUnit(fleetId, unitPrototypes[i], unitCounts[i], true);
    }
    uint256 cargoCapacity = LibCombatAttributes.getCargoCapacity(fleetId);
    uint256 cargo = LibCombatAttributes.getCargo(fleetId);
    require(cargoCapacity >= cargo, "[Fleet] Not enough cargo to disband units from fleet");
  }

  function disbandResources(bytes32 fleetId, uint256[] calldata resourceCounts) internal {
    uint8[] memory transportables = P_Transportables.get();
    for (uint8 i = 0; i < transportables.length; i++) {
      if (resourceCounts[i] == 0) continue;
      uint256 fleetResourceCount = ResourceCount.get(fleetId, transportables[i]);
      require(fleetResourceCount >= resourceCounts[i], "[Fleet] Not enough resources to disband from fleet");
      LibFleet.decreaseFleetResource(fleetId, transportables[i], resourceCounts[i]);
    }
  }
}
