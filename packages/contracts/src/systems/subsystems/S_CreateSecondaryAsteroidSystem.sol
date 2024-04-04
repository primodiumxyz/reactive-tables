// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { PrimodiumSystem } from "systems/internal/PrimodiumSystem.sol";
import { LibAsteroid } from "libraries/LibAsteroid.sol";
import { PositionData } from "codegen/index.sol";

contract S_CreateSecondaryAsteroidSystem is PrimodiumSystem {
  function createSecondaryAsteroid(PositionData memory positionData) public returns (bytes32) {
    return LibAsteroid.createSecondaryAsteroid(positionData);
  }
}
