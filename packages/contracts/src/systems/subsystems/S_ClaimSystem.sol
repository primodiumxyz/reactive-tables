// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { System } from "@latticexyz/world/src/System.sol";

import { LibUnit } from "libraries/LibUnit.sol";
import { LibResource } from "libraries/LibResource.sol";

contract S_ClaimSystem is System {
  function claimUnits(bytes32 spaceRockEntity) public {
    LibUnit.claimUnits(spaceRockEntity);
  }

  function claimResources(bytes32 spaceRockEntity) public {
    LibResource.claimAllResources(spaceRockEntity);
  }
}
