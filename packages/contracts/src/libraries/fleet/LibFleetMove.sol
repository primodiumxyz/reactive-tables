// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { EResource } from "src/Types.sol";
import { P_EnumToPrototype, FleetStance, FleetStanceData, Position, FleetMovementData, FleetMovement, Spawned, PirateAsteroid, DefeatedPirate, UnitCount, ReversePosition, PositionData, P_Unit, P_UnitData, UnitLevel, P_GameConfig, P_GameConfigData, ResourceCount, OwnedBy, P_UnitPrototypes } from "codegen/index.sol";

import { LibMath } from "libraries/LibMath.sol";
import { LibEncode } from "libraries/LibEncode.sol";
import { LibUnit } from "libraries/LibUnit.sol";
import { LibStorage } from "libraries/LibStorage.sol";
import { LibFleet } from "libraries/fleet/LibFleet.sol";
import { LibFleetStance } from "libraries/fleet/LibFleetStance.sol";
import { FleetsMap } from "libraries/fleet/FleetsMap.sol";
import { FleetKey, FleetOwnedByKey, FleetIncomingKey, FleetStanceKey } from "src/Keys.sol";

import { WORLD_SPEED_SCALE, UNIT_SPEED_SCALE } from "src/constants.sol";
import { EResource, EFleetStance } from "src/Types.sol";

library LibFleetMove {
  function sendFleet(bytes32 fleetId, bytes32 destination) internal {
    bytes32 origin = FleetMovement.getDestination(fleetId);
    require(!isSpaceRockBlocked(origin), "[Fleet] Space rock is blocked");

    uint256 speed = getSpeedWithFollowers(fleetId);
    require(speed > 0, "[Fleet] Fleet has no speed");

    uint256 arrivalTime = getArrivalTime(origin, Position.get(destination), speed);
    _sendFleet(fleetId, destination, arrivalTime);
    bytes32[] memory followingFleets = LibFleetStance.getFollowerFleets(fleetId);
    for (uint256 i = 0; i < followingFleets.length; i++) {
      _sendFleet(followingFleets[i], destination, arrivalTime);
    }
  }

  function _sendFleet(bytes32 fleetId, bytes32 destination, uint256 arrivalTime) private {
    _sendFleet(fleetId, destination, block.timestamp, arrivalTime);
  }

  function _sendFleet(bytes32 fleetId, bytes32 destination, uint256 sendTime, uint256 arrivalTime) private {
    FleetsMap.remove(FleetMovement.getDestination(fleetId), FleetIncomingKey, fleetId);
    FleetsMap.add(destination, FleetIncomingKey, fleetId);

    FleetMovement.set(
      fleetId,
      FleetMovementData({
        arrivalTime: arrivalTime,
        sendTime: sendTime,
        origin: FleetMovement.getDestination(fleetId),
        destination: destination
      })
    );
  }

  function recallFleet(bytes32 fleetId) internal {
    FleetMovementData memory fleetMovement = FleetMovement.get(fleetId);
    require(fleetMovement.origin != fleetMovement.destination, "[Fleet] Fleet is already at origin");
    if (block.timestamp >= fleetMovement.arrivalTime) {
      //if fleet has already reached its destination, send it back
      sendFleet(fleetId, fleetMovement.origin);
      return;
    }
    bytes32 destination = fleetMovement.origin;

    uint256 travelTime = fleetMovement.arrivalTime - block.timestamp;
    uint256 timePassedSinceSend = block.timestamp - fleetMovement.sendTime;

    uint256 arrivalTime = block.timestamp + timePassedSinceSend;
    uint256 sendTime = block.timestamp - travelTime;
    _sendFleet(fleetId, destination, sendTime, arrivalTime);

    bytes32 followingFleetsKey = P_EnumToPrototype.get(FleetStanceKey, uint8(EFleetStance.Follow));
    bytes32[] memory followingFleets = FleetsMap.getFleetIds(fleetId, followingFleetsKey);

    for (uint256 i = 0; i < followingFleets.length; i++) {
      _sendFleet(followingFleets[i], destination, sendTime, arrivalTime);
    }
  }

  /// @notice Computes the block number an arrival will occur.
  /// @param origin origin space rock.
  /// @param destination Destination position.
  /// @param speed speed of movement.
  /// @return Block number of arrival.
  function getArrivalTime(
    bytes32 origin,
    PositionData memory destination,
    uint256 speed
  ) internal view returns (uint256) {
    P_GameConfigData memory config = P_GameConfig.get();

    return
      block.timestamp +
      ((LibMath.distance(Position.get(origin), destination) *
        config.travelTime *
        WORLD_SPEED_SCALE *
        UNIT_SPEED_SCALE) / (config.worldSpeed * speed));
  }

  function isSpaceRockBlocked(bytes32 spaceRock) private returns (bool) {
    bytes32 fleetBlockKey = P_EnumToPrototype.get(FleetStanceKey, uint8(EFleetStance.Block));
    return FleetsMap.size(spaceRock, fleetBlockKey) > 0;
  }

  function getSpeed(bytes32 fleetId) internal view returns (uint256 speed) {
    bytes32 ownerSpaceRock = OwnedBy.get(fleetId);
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    for (uint8 i = 0; i < unitPrototypes.length; i++) {
      uint256 unitCount = UnitCount.get(fleetId, unitPrototypes[i]);
      if (unitCount == 0) continue;
      uint256 unitLevel = UnitLevel.get(ownerSpaceRock, unitPrototypes[i]);
      uint256 unitSpeed = P_Unit.getSpeed(unitPrototypes[i], unitLevel);
      if (speed == 0) speed = unitSpeed;
      else if (speed > unitSpeed) speed = unitSpeed;
    }
  }

  function getSpeedWithFollowers(bytes32 fleetId) internal view returns (uint256 speed) {
    speed = getSpeed(fleetId);
    bytes32[] memory followerFleetIds = LibFleetStance.getFollowerFleets(fleetId);
    for (uint8 i = 0; i < followerFleetIds.length; i++) {
      uint256 followerSpeed = getSpeed(followerFleetIds[i]);
      if (followerSpeed < speed) speed = followerSpeed;
    }
  }
}
