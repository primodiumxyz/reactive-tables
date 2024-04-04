// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { EResource } from "src/Types.sol";
import { IsFleet, P_EnumToPrototype, FleetStance, FleetStanceData, Position, Spawned, GracePeriod, PirateAsteroid, DefeatedPirate, UnitCount, ReversePosition, PositionData, P_Unit, P_UnitData, UnitLevel, P_GameConfig, P_GameConfigData, ResourceCount, OwnedBy, P_UnitPrototypes } from "codegen/index.sol";

import { LibMath } from "libraries/LibMath.sol";
import { LibEncode } from "libraries/LibEncode.sol";
import { LibUnit } from "libraries/LibUnit.sol";
import { LibStorage } from "libraries/LibStorage.sol";
import { FleetsMap } from "libraries/fleet/FleetsMap.sol";
import { FleetKey, FleetOwnedByKey, FleetIncomingKey, FleetStanceKey } from "src/Keys.sol";

import { WORLD_SPEED_SCALE, UNIT_SPEED_SCALE } from "src/constants.sol";
import { EResource, EFleetStance } from "src/Types.sol";

library LibFleetStance {
  function setFleetStance(bytes32 fleetId, uint8 stance, bytes32 target) internal {
    clearFleetStance(fleetId);
    clearFollowingFleets(fleetId);
    FleetStance.set(fleetId, stance, target);
    if (target != bytes32(0)) {
      FleetsMap.add(target, P_EnumToPrototype.get(FleetStanceKey, stance), fleetId);
    }
  }

  function clearFleetStance(bytes32 fleetId) internal {
    FleetStanceData memory fleetStance = FleetStance.get(fleetId);

    if (fleetStance.stance == uint8(EFleetStance.NULL)) return;
    FleetsMap.remove(fleetStance.target, P_EnumToPrototype.get(FleetStanceKey, fleetStance.stance), fleetId);
    FleetStance.deleteRecord(fleetId);
  }

  function removeFollower(bytes32 fleetId, bytes32 followerFleetId) internal {
    bytes32 fleetFollowKey = P_EnumToPrototype.get(FleetStanceKey, uint8(EFleetStance.Follow));
    require(FleetsMap.has(fleetId, fleetFollowKey, followerFleetId), "[Fleet] Target fleet is not following");
    FleetStance.deleteRecord(followerFleetId);
    FleetsMap.remove(fleetId, fleetFollowKey, followerFleetId);
  }

  function clearFollowingFleets(bytes32 fleetId) internal {
    bytes32 fleetFollowKey = P_EnumToPrototype.get(FleetStanceKey, uint8(EFleetStance.Follow));
    bytes32[] memory followingFleets = FleetsMap.getFleetIds(fleetId, fleetFollowKey);
    for (uint256 i = 0; i < followingFleets.length; i++) {
      FleetStance.deleteRecord(followingFleets[i]);
    }
    FleetsMap.clear(fleetId, fleetFollowKey);
  }

  function clearDefendingFleets(bytes32 spaceRock) internal {
    bytes32 fleetDefendKey = P_EnumToPrototype.get(FleetStanceKey, uint8(EFleetStance.Defend));
    bytes32[] memory defendingFleets = FleetsMap.getFleetIds(spaceRock, fleetDefendKey);
    for (uint256 i = 0; i < defendingFleets.length; i++) {
      FleetStance.set(defendingFleets[i], uint8(EFleetStance.NULL), bytes32(0));
    }
    FleetsMap.clear(spaceRock, fleetDefendKey);
  }

  function getFollowerFleets(bytes32 fleetId) internal view returns (bytes32[] memory) {
    bytes32 fleetFollowKey = P_EnumToPrototype.get(FleetStanceKey, uint8(EFleetStance.Follow));
    return FleetsMap.getFleetIds(fleetId, fleetFollowKey);
  }

  function getDefendingFleets(bytes32 spaceRock) internal view returns (bytes32[] memory) {
    bytes32 fleetDefendKey = P_EnumToPrototype.get(FleetStanceKey, uint8(EFleetStance.Defend));
    return FleetsMap.getFleetIds(spaceRock, fleetDefendKey);
  }

  function getAllies(bytes32 entity) internal view returns (bytes32[] memory) {
    return IsFleet.get(entity) ? getFollowerFleets(entity) : getDefendingFleets(entity);
  }
}
