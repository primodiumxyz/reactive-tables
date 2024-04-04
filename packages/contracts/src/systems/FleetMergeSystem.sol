// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { FleetBaseSystem } from "systems/internal/FleetBaseSystem.sol";
import { LibFleet } from "libraries/fleet/LibFleet.sol";
import { FleetMovement, OwnedBy } from "codegen/index.sol";

contract FleetMergeSystem is FleetBaseSystem {
  modifier _checkRequirements(bytes32[] calldata fleets) {
    require(fleets.length > 1, "[Fleet] Must merge at least 2 fleets");
    bytes32 spaceRockOwner = OwnedBy.get(fleets[0]);
    require(OwnedBy.get(spaceRockOwner) == _player(), "[Fleet] Only fleet owner can call this function");
    require((FleetMovement.getArrivalTime(fleets[0]) <= block.timestamp), "[Fleet] Fleet is not in orbit");
    bytes32 spaceRock = FleetMovement.getDestination(fleets[0]);
    for (uint256 i = 0; i < fleets.length; i++) {
      require(OwnedBy.get(fleets[i]) == spaceRockOwner, "[Fleet] Only fleet owner can call this function");
      require(
        (FleetMovement.getArrivalTime(fleets[i]) <= block.timestamp) &&
          (FleetMovement.getDestination(fleets[i]) == spaceRock),
        "[Fleet] Fleet is not in orbit of space rock"
      );
    }
    _;
  }

  function mergeFleets(bytes32[] calldata fleets) public _checkRequirements(fleets) {
    LibFleet.mergeFleets(_player(), fleets);
  }
}
