// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { FleetBaseSystem } from "systems/internal/FleetBaseSystem.sol";
import { LibFleet } from "libraries/fleet/LibFleet.sol";

contract FleetCreateSystem is FleetBaseSystem {
  function createFleet(
    bytes32 spaceRock,
    uint256[] calldata unitCounts,
    uint256[] calldata resourceCounts
  )
    public
    _claimResources(spaceRock)
    _claimUnits(spaceRock)
    _onlySpaceRockOwner(spaceRock)
    _unitCountIsValid(unitCounts)
    _resourceCountIsValid(resourceCounts)
    returns (bytes32 fleetId)
  {
    fleetId = LibFleet.createFleet(_player(), spaceRock, unitCounts, resourceCounts);
  }
}
