// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import {System} from "@latticexyz/world/src/System.sol";
import {Position} from "../codegen/index.sol";

contract MoveSystem is System {
    function move(int32 x, int32 y) public {
        Position.set(_addressToEntityKey(_msgSender()), x, y);
    }

    function _addressToEntityKey(address addr) internal pure returns (bytes32 key) {
        key = bytes32(uint256(uint160(addr)));
    }
}
