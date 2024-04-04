// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { ResourceId } from "@latticexyz/world/src/SystemCall.sol";
import { OwnedBy } from "codegen/index.sol";

function getSystemResourceId(string memory rawName) pure returns (ResourceId) {
  return WorldResourceIdLib.encode(RESOURCE_SYSTEM, "", bytes16(bytes32(bytes(rawName))));
}

function addressToEntity(address a) pure returns (bytes32) {
  return bytes32(uint256(uint160((a))));
}

function entityToAddress(bytes32 a) pure returns (address) {
  return address(uint160(uint256((a))));
}

function bytes32ToString(bytes32 data) pure returns (string memory) {
  bytes memory bytesString = new bytes(32);
  for (uint256 i = 0; i < 32; i++) {
    bytesString[i] = data[i];
  }
  return string(bytesString);
}

/// @dev get the player or delegator entity
/// @return the player or delegator entity
function _player(address msgSender) view returns (bytes32) {
  return addressToEntity(msgSender);
}
