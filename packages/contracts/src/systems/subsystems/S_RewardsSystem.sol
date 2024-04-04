// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { System } from "@latticexyz/world/src/System.sol";

import { LibReward } from "libraries/LibReward.sol";

contract S_RewardsSystem is System {
  function receiveRewards(bytes32 playerEntity, bytes32 spaceRockEntity, bytes32 objectivePrototype) public {
    LibReward.receiveRewards(playerEntity, spaceRockEntity, objectivePrototype);
  }
}
