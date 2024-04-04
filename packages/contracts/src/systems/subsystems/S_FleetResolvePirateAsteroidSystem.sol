// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { PrimodiumSystem } from "systems/internal/PrimodiumSystem.sol";
import { LibFleetCombat } from "libraries/fleet/LibFleetCombat.sol";

contract S_FleetResolvePirateAsteroidSystem is PrimodiumSystem {
  function resolvePirateAsteroid(bytes32 playerEntity, bytes32 pirateAsteroid) public {
    LibFleetCombat.resolvePirateAsteroid(playerEntity, pirateAsteroid);
  }
}
