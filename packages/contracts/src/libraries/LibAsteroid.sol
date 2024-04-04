// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import { entityToAddress, getSystemResourceId } from "src/utils.sol";
import { buildMainBase } from "src/libraries/SubsystemCalls.sol";
import { AsteroidOwnedByKey } from "src/Keys.sol";
import { WORLD_SPEED_SCALE } from "src/constants.sol";
import { DroidPrototypeId } from "codegen/Prototypes.sol";

// tables
import { Spawned, GracePeriod, P_GracePeriod, ReversePosition, Level, OwnedBy, Asteroid, UnitCount, AsteroidData, Position, PositionData, AsteroidCount, Asteroid, PositionData, P_GameConfigData, P_GameConfig } from "codegen/index.sol";

// libraries
import { ColoniesMap } from "src/libraries/ColoniesMap.sol";
import { EResource } from "src/Types.sol";
import { LibMath } from "libraries/LibMath.sol";
import { LibEncode } from "libraries/LibEncode.sol";
import { LibBuilding } from "libraries/LibBuilding.sol";
import { LibStorage } from "libraries/LibStorage.sol";
import { LibProduction } from "libraries/LibProduction.sol";
import { LibResource } from "libraries/LibResource.sol";
import { EBuilding } from "src/Types.sol";

library LibAsteroid {
  /// @notice Creates new asteroid for player in world
  /// @notice Checks if asteroid already exists, sets position and other properties
  /// @param ownerEntity Owner's entity ID
  /// @return asteroidEntity Created asteroid's entity ID
  function createPrimaryAsteroid(bytes32 ownerEntity) internal returns (bytes32 asteroidEntity) {
    asteroidEntity = LibEncode.getHash(ownerEntity);
    require(!Asteroid.getIsAsteroid(asteroidEntity), "[LibAsteroid] asteroid already exists");

    uint256 asteroidCount = AsteroidCount.get() + 1;
    PositionData memory coord = getUniqueAsteroidPosition(asteroidCount);

    uint256 gracePeriodLength = (P_GracePeriod.getSpaceRock() * WORLD_SPEED_SCALE) / P_GameConfig.getWorldSpeed();
    GracePeriod.set(asteroidEntity, block.timestamp + gracePeriodLength);

    Level.set(asteroidEntity, 1);
    Position.set(asteroidEntity, coord);
    Asteroid.set(asteroidEntity, AsteroidData({ isAsteroid: true, maxLevel: 5, mapId: 1, spawnsSecondary: true }));
    ReversePosition.set(coord.x, coord.y, asteroidEntity);
    OwnedBy.set(asteroidEntity, ownerEntity);
    LibProduction.increaseResourceProduction(asteroidEntity, EResource.U_MaxFleets, 1);
    AsteroidCount.set(asteroidCount);
  }

  /// @notice Generates unique asteroid coord
  /// @notice Ensures asteroid coords do not overlap
  /// @return coord Generated unique coord
  function getUniqueAsteroidPosition(uint256 asteroidCount) internal view returns (PositionData memory coord) {
    coord = LibMath.getPositionByVector(
      LibMath.getSpawnDistance(asteroidCount),
      LibMath.getSpawnDirection(asteroidCount)
    );
    while (ReversePosition.get(coord.x, coord.y) != 0) {
      coord.y += 5;
    }
  }

  /// @notice Create a new asteroid at a position
  /// @param position Position to place the asteroid
  /// @return asteroidSeed Hash of the newly created asteroid
  function createSecondaryAsteroid(PositionData memory position) internal returns (bytes32) {
    P_GameConfigData memory config = P_GameConfig.get();
    for (uint256 i = 0; i < config.maxAsteroidsPerPlayer; i++) {
      PositionData memory sourcePosition = getPosition(i, config.asteroidDistance, config.maxAsteroidsPerPlayer);
      sourcePosition.x += position.x;
      sourcePosition.y += position.y;
      bytes32 sourceAsteroid = ReversePosition.get(sourcePosition.x, sourcePosition.y);
      if (sourceAsteroid == 0) continue;
      if (!Asteroid.getSpawnsSecondary(sourceAsteroid)) continue;
      bytes32 asteroidSeed = keccak256(abi.encode(sourceAsteroid, bytes32("asteroid"), position.x, position.y));
      if (!isAsteroid(asteroidSeed, config.asteroidChanceInv)) continue;
      initSecondaryAsteroid(position, asteroidSeed);

      return asteroidSeed;
    }
    revert("no asteroid found");
  }

  function getAsteroidData(bytes32 asteroidEntity, bool spawnsSecondary) internal view returns (AsteroidData memory) {
    uint256 distributionVal = (LibEncode.getByteUInt(uint256(asteroidEntity), 7, 12) % 100);

    uint256 maxLevel;
    //micro
    if (distributionVal <= 50) {
      maxLevel = 1;
      //small
    } else if (distributionVal <= 75) {
      maxLevel = 3;
      //medium
    } else if (distributionVal <= 90) {
      maxLevel = 5;
      //large
    } else {
      maxLevel = 8;
    }

    // number between 2 and 5
    uint8 mapId = uint8((LibEncode.getByteUInt(uint256(asteroidEntity), 3, 20) % 4) + 2);
    return AsteroidData({ isAsteroid: true, maxLevel: maxLevel, mapId: mapId, spawnsSecondary: spawnsSecondary });
  }

  function getSecondaryAsteroidUnitsAndEncryption(
    bytes32 asteroidEntity,
    uint256 level
  ) internal view returns (uint256, uint256) {
    uint256 droidCount = 4 ** level + 100;
    uint256 encryption = (level * 10 + 10) * 1e18;
    return (droidCount, encryption);
  }

  function isAsteroid(bytes32 entity, uint256 chanceInv) internal pure returns (bool) {
    uint256 motherlodeKey = LibEncode.getByteUInt(uint256(entity), 6, 128);
    return motherlodeKey % chanceInv == 1;
  }

  /// @dev Initialize a motherlode
  /// @param position Position to place the motherlode
  /// @param asteroidEntity Hash of the asteroid to be initialized
  function initSecondaryAsteroid(PositionData memory position, bytes32 asteroidEntity) internal {
    AsteroidData memory data = getAsteroidData(asteroidEntity, false);
    Asteroid.set(asteroidEntity, data);
    Position.set(asteroidEntity, position);
    ReversePosition.set(position.x, position.y, asteroidEntity);
    Level.set(asteroidEntity, 1);

    (uint256 droidCount, uint256 encryption) = getSecondaryAsteroidUnitsAndEncryption(asteroidEntity, data.maxLevel);
    UnitCount.set(asteroidEntity, DroidPrototypeId, droidCount);
    LibStorage.increaseMaxStorage(asteroidEntity, uint8(EResource.R_Encryption), encryption);
  }

  function initializeSpaceRockOwnership(bytes32 spaceRock, bytes32 owner) internal {
    OwnedBy.set(spaceRock, owner);
    ColoniesMap.add(owner, AsteroidOwnedByKey, spaceRock);
  }

  /// @dev Calculates position based on distance and max index
  /// @param i Index
  /// @param distance Distance
  /// @param max Max index
  /// @return position
  function getPosition(uint256 i, uint256 distance, uint256 max) internal pure returns (PositionData memory) {
    return LibMath.getPositionByVector(distance, (i * 360) / max);
  }
}
