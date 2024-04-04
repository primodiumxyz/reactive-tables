// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { FleetBaseSystem } from "systems/internal/FleetBaseSystem.sol";
import { LibFleetStance } from "libraries/fleet/LibFleetStance.sol";
import { FleetStance, FleetMovement } from "src/codegen/index.sol";
import { EFleetStance } from "src/codegen/common.sol";

contract FleetStanceSystem is FleetBaseSystem {
  function clearFleetStance(bytes32 fleetId) public _onlyFleetOwner(fleetId) _onlyWhenFleetIsInOrbit(fleetId) {
    LibFleetStance.clearFleetStance(fleetId);
  }

  function setFleetStance(
    bytes32 fleetId,
    uint8 stance,
    bytes32 target
  ) public _onlyFleetOwner(fleetId) _onlyWhenFleetIsInOrbit(fleetId) _onlyWhenNotPirateAsteroid(target) {
    require(
      FleetStance.getStance(target) == uint8(EFleetStance.NULL),
      "[Fleet] Can not target a fleet that is taking a stance"
    );
    if (stance == uint8(EFleetStance.Defend) || stance == uint8(EFleetStance.Block)) {
      require(FleetMovement.getDestination(fleetId) == target, "[Fleet] Fleet must be in orbit of target space rock");
    }
    LibFleetStance.setFleetStance(fleetId, stance, target);
  }
}
