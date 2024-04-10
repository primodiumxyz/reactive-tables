// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import {System} from "@latticexyz/world/src/System.sol";
import {Counter, Inventory, Position} from "../codegen/index.sol";

contract TestSystem is System {
    /* ---------------------------------- TEST ---------------------------------- */
    function increment() public {
        Counter.set(Counter.get() + 1);
    }

    function move(int32 x, int32 y) public {
        Position.set(_addressToEntityKey(_msgSender()), x, y);
    }

    function storeItems(uint32[] memory itemIds) public {
        // Let's do it the ugly way
        for (uint256 i = 0; i < itemIds.length; i++) {
            Inventory.push(_addressToEntityKey(_msgSender()), itemIds[i]);
        }
    }

    /* ---------------------------------- UTILS --------------------------------- */
    function _addressToEntityKey(address addr) internal pure returns (bytes32 key) {
        key = bytes32(uint256(uint160(addr)));
    }
}
