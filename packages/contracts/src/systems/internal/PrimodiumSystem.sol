// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { System } from "@latticexyz/world/src/System.sol";
import { _player as player } from "src/utils.sol";

import { IWorld } from "codegen/world/IWorld.sol";
import { getSystemResourceId } from "src/utils.sol";
import { SystemCall } from "@latticexyz/world/src/SystemCall.sol";
import { DUMMY_ADDRESS } from "src/constants.sol";

import { S_ClaimSystem } from "systems/subsystems/S_ClaimSystem.sol";

contract PrimodiumSystem is System {
  modifier onlyAdmin() {
    require(IWorld(_world()).creator() == _msgSender(), "[Primodium] Only admin");
    _;
  }

  modifier _claimResources(bytes32 spaceRockEntity) {
    SystemCall.callWithHooksOrRevert(
      DUMMY_ADDRESS,
      getSystemResourceId("S_ClaimSystem"),
      abi.encodeCall(S_ClaimSystem.claimResources, (spaceRockEntity)),
      0
    );
    _;
  }

  modifier _claimUnits(bytes32 spaceRockEntity) {
    SystemCall.callWithHooksOrRevert(
      DUMMY_ADDRESS,
      getSystemResourceId("S_ClaimSystem"),
      abi.encodeCall(S_ClaimSystem.claimUnits, (spaceRockEntity)),
      0
    );
    _;
  }

  function addressToEntity(address a) internal pure returns (bytes32) {
    return bytes32(uint256(uint160((a))));
  }

  function entityToAddress(bytes32 a) internal pure returns (address) {
    return address(uint160(uint256((a))));
  }

  function _player() internal view returns (bytes32) {
    return player(_msgSender());
  }
}
