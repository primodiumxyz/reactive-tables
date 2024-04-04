// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { MapFleets, MapStoredFleets } from "codegen/index.sol";

library FleetsMap {
  /**
   * @dev Checks if a fleet is stored for a specific entity, and fleetId.
   * @param entity The entity's identifier.
   * @param key defines the type of association the fleet has with the entity.
   * @param fleetId The unique fleetId for the fleet.
   * @return true if the fleet exists, false otherwise.
   */
  function has(bytes32 entity, bytes32 key, bytes32 fleetId) internal view returns (bool) {
    return MapStoredFleets.get(entity, key, fleetId).stored;
  }

  /**
   * @dev Sets a fleet for a specific entity.
   * If the fleet already exists, it updates the existing one.
   * @param entity The entity's identifier.
   * @param key defines the type of association the fleet has with the entity.
   * @param fleetId the unique fleetId for the fleet.
   */
  function add(bytes32 entity, bytes32 key, bytes32 fleetId) internal {
    if (has(entity, key, fleetId)) return;
    MapFleets.push(entity, key, fleetId);
    MapStoredFleets.set(entity, key, fleetId, true, MapFleets.length(entity, key) - 1);
  }

  /**
   * @dev Retrieves all fleetIds associated with an entity.
   * @param entity The entity's identifier.
   * @param key defines the type of association the fleet has with the entity.
   * @return fleetIds array of fleetIds for the fleets.
   */
  function getFleetIds(bytes32 entity, bytes32 key) internal view returns (bytes32[] memory fleetIds) {
    return MapFleets.get(entity, key);
  }

  /**
   * @dev Removes an fleet for a specific entity
   * @param entity The entity's identifier.
   * @param key defines the type of association the fleet has with the entity.
   * @param fleetId The unique fleetId for the fleet to remove.
   */
  function remove(bytes32 entity, bytes32 key, bytes32 fleetId) internal {
    // if (!has(entity, key, fleetId)) return;
    if (MapFleets.length(entity, key) == 1) {
      clear(entity, key);
      return;
    }
    uint256 index = MapStoredFleets.getIndex(entity, key, fleetId);
    bytes32 replacement = MapFleets.getItem(entity, key, MapFleets.length(entity, key) - 1);

    // update replacement data
    MapFleets.update(entity, key, index, replacement);
    MapStoredFleets.set(entity, key, replacement, true, index);

    // remove associated fleet
    MapFleets.pop(entity, key);
    MapStoredFleets.deleteRecord(entity, key, fleetId);
  }

  /**
   * @dev Retrieves the number of fleets stored for a specific entity .
   * @param entity The entity's identifier.
   * @param key defines the type of association the fleet has with the entity.
   * @return The number of fleets.
   */
  function size(bytes32 entity, bytes32 key) internal view returns (uint256) {
    return MapFleets.length(entity, key);
  }

  /**
   * @dev Clears all fleets for a specific entity .
   * @param entity The entity's identifier.
   * @param key defines the type of association the fleet has with the entity.
   */
  function clear(bytes32 entity, bytes32 key) internal {
    for (uint256 i = 0; i < MapFleets.length(entity, key); i++) {
      bytes32 fleetId = MapFleets.getItem(entity, key, i);
      MapStoredFleets.deleteRecord(entity, key, fleetId);
    }
    MapFleets.deleteRecord(entity, key);
  }
}
