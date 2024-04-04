// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { SetUnitFactories, SetItemUnitFactories } from "codegen/index.sol";

library UnitFactorySet {
  /// @notice Check if a player has a building in UnitFactories set
  /// @param player Player's entity ID
  /// @param building Building's entity ID
  /// @return True if player has building, false otherwise
  function has(bytes32 player, bytes32 building) internal view returns (bool) {
    return SetItemUnitFactories.get(player, building).stored;
  }

  /// @notice Add building to a player's UnitFactories set
  /// @param player Player's entity ID
  /// @param building Building's entity ID
  function add(bytes32 player, bytes32 building) internal {
    if (has(player, building)) return;
    SetUnitFactories.push(player, building);
    SetItemUnitFactories.set(player, building, true, SetUnitFactories.length(player) - 1);
  }

  /// @notice Get all buildings in a player's UnitFactories set
  /// @param player Player's entity ID
  /// @return Array of building entity IDs
  function getAll(bytes32 player) internal view returns (bytes32[] memory) {
    return SetUnitFactories.get(player);
  }

  /// @notice Remove building from a player's UnitFactories set
  /// @param player Player's entity ID
  /// @param building Building's entity ID
  function remove(bytes32 player, bytes32 building) internal {
    if (!has(player, building)) return;
    if (SetUnitFactories.length(player) == 1) {
      clear(player);
      return;
    }

    bytes32 replacementId = SetUnitFactories.getItem(player, SetUnitFactories.length(player) - 1);
    uint256 index = SetItemUnitFactories.get(player, building).index;

    SetUnitFactories.update(player, index, replacementId);
    SetItemUnitFactories.setIndex(player, replacementId, index);
    SetUnitFactories.pop(player);
    SetItemUnitFactories.deleteRecord(player, building);
  }

  /// @notice Clear all buildings from a player's UnitFactories set
  /// @param player Player's entity ID
  function clear(bytes32 player) internal {
    for (uint256 i = 0; i < SetUnitFactories.length(player); i++) {
      bytes32 item = SetUnitFactories.getItem(player, i);
      SetItemUnitFactories.deleteRecord(player, item);
    }
    SetUnitFactories.deleteRecord(player);
  }
}
