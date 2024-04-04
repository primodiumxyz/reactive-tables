// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { MapUtilities, MapItemUtilities, MapItemStoredUtilities } from "codegen/index.sol";

library UtilityMap {
  function has(bytes32 player, uint8 utility) internal view returns (bool) {
    return MapItemStoredUtilities.get(player, utility).stored;
  }

  function set(bytes32 player, uint8 utility, uint256 item) internal {
    if (has(player, utility)) {
      MapItemUtilities.set(player, utility, item);
    } else {
      MapUtilities.push(player, utility);
      MapItemUtilities.set(player, utility, item);
      MapItemStoredUtilities.set(player, utility, true, MapUtilities.length(player) - 1);
    }
  }

  function get(bytes32 player, uint8 utility) internal view returns (uint256) {
    return MapItemUtilities.get(player, utility);
  }

  function keys(bytes32 player) internal view returns (uint8[] memory) {
    return MapUtilities.get(player);
  }

  function values(bytes32 player) internal view returns (uint256[] memory items) {
    uint8[] memory _utilities = keys(player);
    items = new uint256[](_utilities.length);
    for (uint256 i = 0; i < _utilities.length; i++) {
      items[i] = MapItemUtilities.get(player, _utilities[i]);
    }
  }

  function remove(bytes32 player, uint8 utility) internal {
    uint256 index = MapItemStoredUtilities.getIndex(player, utility);
    if (MapUtilities.length(player) == 1) {
      clear(player);
      return;
    }

    // update replacement data
    uint8 replacement = MapUtilities.getItem(player, MapUtilities.length(player) - 1);
    MapUtilities.update(player, index, replacement);
    MapItemStoredUtilities.set(player, replacement, true, index);

    // remove utility
    MapUtilities.pop(player);
    MapItemUtilities.deleteRecord(player, utility);
    MapItemStoredUtilities.deleteRecord(player, utility);
  }

  function size(bytes32 player) internal view returns (uint256) {
    return MapUtilities.length(player);
  }

  function clear(bytes32 player) internal {
    for (uint256 i = 0; i < MapUtilities.length(player); i++) {
      uint8 utility = MapUtilities.getItem(player, MapUtilities.length(player) - 1);
      MapItemUtilities.deleteRecord(player, utility);
      MapItemStoredUtilities.deleteRecord(player, utility);
    }
    MapUtilities.deleteRecord(player);
  }
}
