// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { getSystemResourceId } from "src/utils.sol";
import { PrimodiumSystem } from "systems/internal/PrimodiumSystem.sol";
import { BuildSystem } from "systems/BuildSystem.sol";
import { initializeSpaceRockOwnership } from "src/libraries/SubsystemCalls.sol";
import { SystemCall } from "@latticexyz/world/src/SystemCall.sol";
import { OwnedBy, P_GameConfig, GracePeriod, Spawned, P_GracePeriod, Spawned, Position, PositionData, Level, Home } from "codegen/index.sol";
import { ColoniesMap } from "src/libraries/ColoniesMap.sol";
import { LibAsteroid, LibEncode } from "codegen/Libraries.sol";
import { EBuilding } from "src/Types.sol";
import { BuildingKey, AsteroidOwnedByKey } from "src/Keys.sol";
import { MainBasePrototypeId } from "codegen/Prototypes.sol";

/// @title Spawn System for Primodium Game
/// @notice Handles player spawning in the game world
/// @notice Inherits from PrimodiumSystem
contract SpawnSystem is PrimodiumSystem {
  /// @notice Spawns a player into the world
  /// @notice Checks if player is already spawned, sets initial level and associates asteroid
  /// @return bytes32 The entity ID of the spawned asteroid
  function spawn() public returns (bytes32) {
    bytes32 playerEntity = _player();

    require(!Spawned.get(playerEntity), "[SpawnSystem] Already spawned");

    bytes32 asteroid = LibAsteroid.createPrimaryAsteroid(playerEntity);
    Home.set(playerEntity, asteroid);
    Spawned.set(playerEntity, true);
    initializeSpaceRockOwnership(asteroid, playerEntity);
    return asteroid;
  }
}
