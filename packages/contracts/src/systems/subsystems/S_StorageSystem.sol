// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { System } from "@latticexyz/world/src/System.sol";
import { LibStorage } from "libraries/LibStorage.sol";
import { IsActive, Level } from "codegen/index.sol";

contract S_StorageSystem is System {
  function increaseMaxStorage(bytes32 buildingEntity, uint256 level) public {
    if (IsActive.get(buildingEntity)) LibStorage.increaseMaxStorage(buildingEntity, level);
  }

  function clearMaxStorageIncrease(bytes32 buildingEntity) public {
    if (IsActive.get(buildingEntity)) LibStorage.clearMaxStorageIncrease(buildingEntity);
  }

  function toggleMaxStorage(bytes32 buildingEntity) public {
    if (IsActive.get(buildingEntity)) {
      LibStorage.activateMaxStorage(buildingEntity, Level.get(buildingEntity));
    } else {
      LibStorage.clearMaxStorageIncrease(buildingEntity);
    }
  }
}
