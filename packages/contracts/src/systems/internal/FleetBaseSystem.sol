// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { PrimodiumSystem } from "systems/internal/PrimodiumSystem.sol";
import { LibFleet } from "libraries/fleet/LibFleet.sol";
import { EFleetStance } from "src/Types.sol";
import { CooldownEnd, FleetStance, OwnedBy, FleetMovement, P_UnitPrototypes, P_Transportables, PirateAsteroid } from "src/codegen/index.sol";

contract FleetBaseSystem is PrimodiumSystem {
  modifier _onlyFleetOwner(bytes32 fleetId) {
    require(OwnedBy.get(OwnedBy.get(fleetId)) == _player(), "[Fleet] Not fleet owner");
    _;
  }

  modifier _onlyWhenFleetIsInOrbit(bytes32 fleetId) {
    require(FleetMovement.getArrivalTime(fleetId) <= block.timestamp, "[Fleet] Fleet is not in orbit");
    _;
  }

  modifier _onlyWhenNotInCooldown(bytes32 fleetId) {
    require(block.timestamp >= CooldownEnd.get(fleetId), "[Fleet] Fleet is in cooldown");
    _;
  }

  modifier _onlyWhenFleetIsInOrbitOfSpaceRock(bytes32 fleetId, bytes32 spaceRock) {
    require(
      (FleetMovement.getArrivalTime(fleetId) <= block.timestamp) &&
        (FleetMovement.getDestination(fleetId) == spaceRock),
      "[Fleet] Fleet is not in orbit"
    );
    _;
  }

  modifier _onlyWhenFleetsAreIsInSameOrbit(bytes32 fleetId, bytes32 fleetId2) {
    require(
      (FleetMovement.getArrivalTime(fleetId) <= block.timestamp) &&
        (FleetMovement.getArrivalTime(fleetId2) <= block.timestamp) &&
        (FleetMovement.getDestination(fleetId) == FleetMovement.getDestination(fleetId2)),
      "[Fleet] Fleets are not in orbit"
    );
    _;
  }

  modifier _onlySpaceRockOwner(bytes32 spaceRock) {
    require(OwnedBy.get(spaceRock) == _player(), "[Fleet] Not asteroid owner");
    _;
  }

  modifier _unitCountIsValid(uint256[] memory unitCounts) {
    require(unitCounts.length == P_UnitPrototypes.length(), "[Fleet] Incorrect unit array length");
    _;
  }

  modifier _resourceCountIsValid(uint256[] memory resourceCounts) {
    require(resourceCounts.length == P_Transportables.length(), "[Fleet] Incorrect resource array length");
    _;
  }
  modifier _onlyWhenNotPirateAsteroid(bytes32 spaceRock) {
    require(!PirateAsteroid.getIsPirateAsteroid(spaceRock), "[Fleet] Target cannot be pirate asteroid");
    _;
  }

  modifier _onlyWhenNotPirateAsteroidOrHasNotBeenDefeated(bytes32 spaceRock) {
    require(!PirateAsteroid.getIsDefeated(spaceRock), "[Fleet] Target pirate asteroid has been defeated");
    require(
      !PirateAsteroid.getIsPirateAsteroid(spaceRock) || PirateAsteroid.getPlayerEntity(spaceRock) == _player(),
      "[Fleet] Can only attack personal pirate asteroid"
    );
    _;
  }

  modifier _onlyWhenNotInStance(bytes32 fleetId) {
    require(FleetStance.getStance(fleetId) == uint8(EFleetStance.NULL), "[Fleet] Fleet cannot be in stance");
    _;
  }
}
