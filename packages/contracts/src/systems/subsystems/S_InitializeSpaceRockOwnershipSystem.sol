// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { PrimodiumSystem } from "systems/internal/PrimodiumSystem.sol";
import { MainBasePrototypeId } from "codegen/Prototypes.sol";
import { Position, PositionData } from "codegen/index.sol";
import { buildMainBase } from "libraries/SubsystemCalls.sol";
import { LibAsteroid } from "libraries/LibAsteroid.sol";
import { LibFleetCombat } from "libraries/fleet/LibFleetCombat.sol";

contract S_InitializeSpaceRockOwnershipSystem is PrimodiumSystem {
  function initializeSpaceRockOwnership(bytes32 spaceRock, bytes32 owner) public {
    LibAsteroid.initializeSpaceRockOwnership(spaceRock, owner);
    buildMainBase(owner, spaceRock);
  }
}
