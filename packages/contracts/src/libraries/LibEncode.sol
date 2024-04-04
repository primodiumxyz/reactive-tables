// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { PositionData } from "codegen/index.sol";

library LibEncode {
  function getHash(bytes32 entity) internal pure returns (bytes32) {
    return keccak256(abi.encode(entity));
  }

  function getHash(address world, bytes32 entity) internal pure returns (bytes32) {
    return keccak256(abi.encode(address(world), entity));
  }

  function getHash(bytes32 entity1, bytes32 entity2) internal pure returns (bytes32) {
    return keccak256(abi.encode(entity1, entity2));
  }

  function getHash(bytes32 entity1, bytes32 entity2, bytes32 entity3) internal pure returns (bytes32) {
    return keccak256(abi.encode(entity1, entity2, entity3));
  }

  function getHash(bytes32 key, PositionData memory position) internal pure returns (bytes32) {
    return keccak256(abi.encode(key, position.x, position.y, position.parent));
  }

  function getTimedHash(bytes32 entity1) internal view returns (bytes32) {
    return keccak256(abi.encode(entity1, block.timestamp));
  }

  function getTimedHash(bytes32 entity1, bytes32 entity2) internal view returns (bytes32) {
    return keccak256(abi.encode(entity1, entity2, block.timestamp));
  }

  function getTimedHash(bytes32 key, PositionData memory position) internal view returns (bytes32) {
    return keccak256(abi.encode(key, position.x, position.y, position.parent, block.timestamp));
  }

  /**
   * @notice  masks a bit string based on length and shift
   * @param   _b  bit string to mask
   * @param   length  length in bits of return bit string
   * @param   shift  starting position of mask
   * @return  _byteUInt masked bit string
   */
  function getByteUInt(uint256 _b, uint256 length, uint256 shift) internal pure returns (uint256 _byteUInt) {
    uint256 mask = ((1 << length) - 1) << shift;
    _byteUInt = (_b & mask) >> shift;
  }
}
