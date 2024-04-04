// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { EResource } from "src/Types.sol";
import { IsFleet, IsFleetEmpty, GracePeriod, P_GracePeriod, P_Transportables, P_EnumToPrototype, FleetStance, FleetStanceData, Position, FleetMovementData, FleetMovement, Spawned, PirateAsteroid, DefeatedPirate, UnitCount, ReversePosition, PositionData, P_Unit, P_UnitData, UnitLevel, P_GameConfig, P_GameConfigData, ResourceCount, OwnedBy, P_UnitPrototypes } from "codegen/index.sol";

import { LibMath } from "libraries/LibMath.sol";
import { LibEncode } from "libraries/LibEncode.sol";
import { LibUnit } from "libraries/LibUnit.sol";
import { LibStorage } from "libraries/LibStorage.sol";
import { FleetsMap } from "libraries/fleet/FleetsMap.sol";
import { LibCombatAttributes } from "libraries/LibCombatAttributes.sol";
import { LibFleetStance } from "libraries/fleet/LibFleetStance.sol";
import { FleetKey, FleetOwnedByKey, FleetIncomingKey, FleetStanceKey } from "src/Keys.sol";
import { WORLD_SPEED_SCALE } from "src/constants.sol";

import { EResource, EFleetStance } from "src/Types.sol";

library LibFleet {
  /// @notice creates a fleet.
  function createFleet(
    bytes32 playerEntity,
    bytes32 spaceRock,
    uint256[] calldata unitCounts,
    uint256[] calldata resourceCounts
  ) internal returns (bytes32 fleetId) {
    require(ResourceCount.get(spaceRock, uint8(EResource.U_MaxFleets)) > 0, "[Fleet] Space rock has no max moves");
    LibStorage.decreaseStoredResource(spaceRock, uint8(EResource.U_MaxFleets), 1);
    //require(ResourceCount.get(spaceRock, EResource.U_Cargo) > 0, "[Fleet] Space rock has no cargo capacity"))
    fleetId = LibEncode.getTimedHash(playerEntity, FleetKey);
    uint256 gracePeriodLength = (P_GracePeriod.getFleet() * WORLD_SPEED_SCALE) / P_GameConfig.getWorldSpeed();
    GracePeriod.set(fleetId, block.timestamp + gracePeriodLength);

    OwnedBy.set(fleetId, spaceRock);
    IsFleet.set(fleetId, true);
    IsFleetEmpty.set(fleetId, false);

    FleetMovement.set(
      fleetId,
      FleetMovementData({
        arrivalTime: block.timestamp,
        sendTime: block.timestamp,
        origin: spaceRock,
        destination: spaceRock
      })
    );

    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();

    for (uint8 i = 0; i < unitPrototypes.length; i++) {
      if (unitCounts[i] == 0) continue;
      uint256 rockUnitCount = UnitCount.get(spaceRock, unitPrototypes[i]);
      require(rockUnitCount >= unitCounts[i], "[Fleet] Not enough units to add to fleet");
      LibUnit.decreaseUnitCount(spaceRock, unitPrototypes[i], unitCounts[i], false);
      increaseFleetUnit(fleetId, unitPrototypes[i], unitCounts[i], false);
    }

    uint256 freeCargoSpace = LibCombatAttributes.getCargoSpace(fleetId);
    uint8[] memory transportables = P_Transportables.get();
    for (uint8 i = 0; i < transportables.length; i++) {
      uint8 resource = transportables[i];
      if (resourceCounts[i] == 0) continue;
      uint256 rockResourceCount = ResourceCount.get(spaceRock, transportables[i]);
      require(rockResourceCount >= resourceCounts[i], "[Fleet] Not enough resources to add to fleet");
      LibStorage.decreaseStoredResource(spaceRock, transportables[i], resourceCounts[i]);
      increaseFleetResource(fleetId, transportables[i], resourceCounts[i]);
    }

    FleetsMap.add(spaceRock, FleetOwnedByKey, fleetId);
    FleetsMap.add(spaceRock, FleetIncomingKey, fleetId);
  }

  function increaseFleetUnit(bytes32 fleetId, bytes32 unitPrototype, uint256 unitCount, bool updatesUtility) internal {
    if (unitCount == 0) return;
    if (updatesUtility) {
      LibUnit.updateStoredUtilities(OwnedBy.get(fleetId), unitPrototype, unitCount, true);
    }
    UnitCount.set(fleetId, unitPrototype, UnitCount.get(fleetId, unitPrototype) + unitCount);
  }

  function decreaseFleetUnit(bytes32 fleetId, bytes32 unitPrototype, uint256 unitCount, bool updatesUtility) internal {
    if (unitCount == 0) return;
    uint256 fleetUnitCount = UnitCount.get(fleetId, unitPrototype);
    require(fleetUnitCount >= unitCount, "[Fleet] Not enough units to remove from fleet");
    if (updatesUtility) {
      LibUnit.updateStoredUtilities(OwnedBy.get(fleetId), unitPrototype, unitCount, false);
    }
    UnitCount.set(fleetId, unitPrototype, fleetUnitCount - unitCount);
  }

  function getResourceCounts(bytes32 fleetId) internal view returns (uint256[] memory resourceCounts) {
    uint8[] memory transportables = P_Transportables.get();
    resourceCounts = new uint256[](transportables.length);
    for (uint256 i = 0; i < transportables.length; i++) {
      resourceCounts[i] = ResourceCount.get(fleetId, transportables[i]);
    }
    return resourceCounts;
  }

  function getResourceCountsWithAllies(
    bytes32 fleetId
  ) internal view returns (uint256[] memory resourceCounts, uint256 totalResources) {
    bytes32[] memory followerFleetIds = LibFleetStance.getFollowerFleets(fleetId);
    uint8[] memory transportables = P_Transportables.get();
    resourceCounts = new uint256[](transportables.length);
    for (uint256 i = 0; i < transportables.length; i++) {
      resourceCounts[i] = ResourceCount.get(fleetId, transportables[i]);
      for (uint8 j = 0; j < followerFleetIds.length; j++) {
        resourceCounts[i] += ResourceCount.get(followerFleetIds[j], transportables[i]);
      }
      totalResources += resourceCounts[i];
    }
  }

  function increaseFleetResource(bytes32 fleetId, uint8 resource, uint256 amount) internal {
    if (amount == 0) return;
    uint256 freeCargoSpace = LibCombatAttributes.getCargoSpace(fleetId);
    require(freeCargoSpace >= amount, "[Fleet] Not enough storage to add resource");
    ResourceCount.set(fleetId, resource, ResourceCount.get(fleetId, resource) + amount);
  }

  function decreaseFleetResource(bytes32 fleetId, uint8 resource, uint256 amount) internal {
    if (amount == 0) return;
    uint256 currResourceCount = ResourceCount.get(fleetId, resource);
    require(currResourceCount >= amount, "[Fleet] Not enough stored resource to remove");
    ResourceCount.set(fleetId, resource, currResourceCount - amount);
  }

  function landFleet(bytes32 playerEntity, bytes32 fleetId, bytes32 spaceRock) internal {
    bytes32 spaceRockOwner = OwnedBy.get(fleetId);

    bool isOwner = spaceRockOwner == spaceRock;

    uint8[] memory transportables = P_Transportables.get();
    for (uint8 i = 0; i < transportables.length; i++) {
      uint256 fleetResourceCount = ResourceCount.get(fleetId, transportables[i]);
      if (fleetResourceCount == 0) continue;
      LibStorage.increaseStoredResource(spaceRock, transportables[i], fleetResourceCount);
      decreaseFleetResource(fleetId, transportables[i], fleetResourceCount);
    }

    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    for (uint8 i = 0; i < unitPrototypes.length; i++) {
      uint256 fleetUnitCount = UnitCount.get(fleetId, unitPrototypes[i]);
      if (fleetUnitCount == 0) continue;
      decreaseFleetUnit(fleetId, unitPrototypes[i], fleetUnitCount, !isOwner);
      LibUnit.increaseUnitCount(spaceRock, unitPrototypes[i], fleetUnitCount, !isOwner);
    }
    if (!isOwner) {
      resetFleetOrbit(fleetId);
    }
  }

  function mergeFleets(bytes32 playerEntity, bytes32[] calldata fleets) internal {
    require(fleets.length > 1, "[Fleet] Can only merge more than one fleet");
    bytes32 spaceRock = FleetMovement.getDestination(fleets[0]);
    bytes32 spaceRockOwner = OwnedBy.get(fleets[0]);

    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    for (uint256 i = 1; i < fleets.length; i++) {
      for (uint8 j = 0; j < unitPrototypes.length; j++) {
        unitCounts[j] += UnitCount.get(fleets[i], unitPrototypes[j]);
      }
    }

    for (uint8 i = 0; i < unitPrototypes.length; i++) {
      increaseFleetUnit(fleets[0], unitPrototypes[i], unitCounts[i], false);
    }
    uint8[] memory transportables = P_Transportables.get();
    for (uint8 i = 0; i < transportables.length; i++) {
      uint256 totalResourceCount = 0;
      for (uint256 j = 1; j < fleets.length; j++) {
        uint256 resourceCount = ResourceCount.get(fleets[j], transportables[i]);
        if (resourceCount == 0) continue;
        decreaseFleetResource(fleets[j], transportables[i], resourceCount);

        totalResourceCount += resourceCount;
      }
      if (totalResourceCount == 0) continue;
      increaseFleetResource(fleets[0], transportables[i], totalResourceCount);
    }

    for (uint256 i = 1; i < fleets.length; i++) {
      for (uint256 j = 0; j < unitPrototypes.length; j++) {
        uint256 fleetUnitCount = UnitCount.get(fleets[i], unitPrototypes[j]);
        decreaseFleetUnit(fleets[i], unitPrototypes[j], fleetUnitCount, false);
      }

      resetFleetOrbit(fleets[i]);
    }
  }

  function isFleetEmpty(bytes32 fleetId) internal view returns (bool) {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (UnitCount.get(fleetId, unitPrototypes[i]) > 0) return false;
    }

    return true;
  }

  function resetFleetIfNoUnitsLeft(bytes32 fleetId) internal {
    if (!isFleetEmpty(fleetId)) return;

    resetFleetOrbit(fleetId);
  }

  function checkAndSetFleetEmpty(bytes32 fleetId) internal {
    if (isFleetEmpty(fleetId)) {
      IsFleetEmpty.set(fleetId, true);
    } else {
      IsFleetEmpty.set(fleetId, false);
    }
  }

  function resetFleetOrbit(bytes32 fleetId) internal {
    //clears any stance
    LibFleetStance.clearFleetStance(fleetId);
    //clears any following fleets
    LibFleetStance.clearFollowingFleets(fleetId);
    IsFleetEmpty.set(fleetId, true);

    bytes32 spaceRock = FleetMovement.getDestination(fleetId);
    bytes32 spaceRockOwner = OwnedBy.get(fleetId);

    if (spaceRockOwner != spaceRock) {
      //remove fleet from incoming of current space rock
      FleetsMap.remove(spaceRock, FleetIncomingKey, fleetId);
      //set fleet to orbit of owner space rock
      FleetsMap.add(spaceRockOwner, FleetIncomingKey, fleetId);
    }

    FleetMovement.set(
      fleetId,
      FleetMovementData({
        arrivalTime: block.timestamp,
        sendTime: block.timestamp,
        origin: spaceRockOwner,
        destination: spaceRockOwner
      })
    );
  }
}
