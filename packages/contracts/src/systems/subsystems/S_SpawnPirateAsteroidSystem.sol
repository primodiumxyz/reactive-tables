// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { System } from "@latticexyz/world/src/System.sol";

import { BattleResultData } from "codegen/index.sol";
import { LibPirate } from "libraries/LibPirate.sol";

contract S_SpawnPirateAsteroidSystem is System {
  /**
   * @dev Initiates a battle between two entities using the LibBattle library.
   * @param prototypeEntity The prototype which the pirate is spawned by.
   * @return asteroidEntity the spawned asteroid entity.
   */
  function spawnPirateAsteroid(bytes32 playerEntity, bytes32 prototypeEntity) public returns (bytes32 asteroidEntity) {
    asteroidEntity = LibPirate.createPirateAsteroid(playerEntity, prototypeEntity);
  }
}
