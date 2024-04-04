// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { MapColonies, MapStoredColonies } from "codegen/index.sol";

library ColoniesMap {
  /**
   * @dev Checks if a asteroid is stored for a specific entity, and asteroidId.
   * @param entity The entity's identifier.
   * @param key defines the type of association the asteroid has with the entity.
   * @param asteroidId The unique asteroidId for the asteroid.
   * @return true if the asteroid exists, false otherwise.
   */
  function has(bytes32 entity, bytes32 key, bytes32 asteroidId) internal view returns (bool) {
    return MapStoredColonies.get(entity, key, asteroidId).stored;
  }

  /**
   * @dev Sets a asteroid for a specific entity.
   * If the asteroid already exists, it updates the existing one.
   * @param entity The entity's identifier.
   * @param key defines the type of association the asteroid has with the entity.
   * @param asteroidId the unique asteroidId for the asteroid.
   */
  function add(bytes32 entity, bytes32 key, bytes32 asteroidId) internal {
    require(!has(entity, key, asteroidId), "[ColoniesMap] asteroid is alread associated with entity");
    MapColonies.push(entity, key, asteroidId);
    MapStoredColonies.set(entity, key, asteroidId, true, MapColonies.length(entity, key) - 1);
  }

  /**
   * @dev Retrieves all asteroidIds associated with an entity.
   * @param entity The entity's identifier.
   * @param key defines the type of association the asteroid has with the entity.
   * @return asteroidIds array of asteroidIds for the Colonies.
   */
  function getAsteroidIds(bytes32 entity, bytes32 key) internal view returns (bytes32[] memory asteroidIds) {
    return MapColonies.get(entity, key);
  }

  /**
   * @dev Removes an asteroid for a specific entity
   * @param entity The entity's identifier.
   * @param key defines the type of association the asteroid has with the entity.
   * @param asteroidId The unique asteroidId for the asteroid to remove.
   */
  function remove(bytes32 entity, bytes32 key, bytes32 asteroidId) internal {
    if (MapColonies.length(entity, key) == 1) {
      clear(entity, key);
      return;
    }
    uint256 index = MapStoredColonies.getIndex(entity, key, asteroidId);
    bytes32 replacement = MapColonies.getItem(entity, key, MapColonies.length(entity, key) - 1);

    // update replacement data
    MapColonies.update(entity, key, index, replacement);
    MapStoredColonies.set(entity, key, replacement, true, index);

    // remove associated asteroid
    MapColonies.pop(entity, key);
    MapStoredColonies.deleteRecord(entity, key, asteroidId);
  }

  /**
   * @dev Retrieves the number of Colonies stored for a specific entity .
   * @param entity The entity's identifier.
   * @param key defines the type of association the asteroid has with the entity.
   * @return The number of Colonies.
   */
  function size(bytes32 entity, bytes32 key) internal view returns (uint256) {
    return MapColonies.length(entity, key);
  }

  /**
   * @dev Clears all Colonies for a specific entity .
   * @param entity The entity's identifier.
   * @param key defines the type of association the asteroid has with the entity.
   */
  function clear(bytes32 entity, bytes32 key) internal {
    for (uint256 i = 0; i < MapColonies.length(entity, key); i++) {
      bytes32 asteroidId = MapColonies.getItem(entity, key, i);
      MapStoredColonies.deleteRecord(entity, key, asteroidId);
    }
    MapColonies.deleteRecord(entity, key);
  }
}
