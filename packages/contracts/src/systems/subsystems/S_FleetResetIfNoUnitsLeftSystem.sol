// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { PrimodiumSystem } from "systems/internal/PrimodiumSystem.sol";
import { FleetBaseSystem } from "systems/internal/FleetBaseSystem.sol";
import { LibFleetCombat } from "libraries/fleet/LibFleetCombat.sol";
import { LibFleet } from "libraries/fleet/LibFleet.sol";

contract S_FleetResetIfNoUnitsLeftSystem is PrimodiumSystem {
  function resetFleetIfNoUnitsLeft(bytes32 fleetId) public {
    LibFleet.resetFleetIfNoUnitsLeft(fleetId);
  }
}
