// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import {System} from "@latticexyz/world/src/System.sol";
import {Counter, Inventory, Position} from "../codegen/index.sol";

contract TestSystem is System {
    /* ---------------------------------- TEST ---------------------------------- */
    error ITEMS_LENGTH_MISMATCH();

    function increment() public {
        Counter.set(Counter.get() + 1);
    }

    function move(int32 x, int32 y) public {
        Position.set(_addressToEntityKey(_msgSender()), x, y);
    }

    function storeItems(uint32[] memory ids, uint32[] memory weights) public {
        if (ids.length != weights.length) {
            revert ITEMS_LENGTH_MISMATCH();
        }

        bytes32 entityKey = _addressToEntityKey(_msgSender());
        uint256 totalWeight = Inventory.getTotalWeight(entityKey);

        // Let's do it the ugly way
        for (uint256 i = 0; i < ids.length; i++) {
            Inventory.pushItems(entityKey, ids[i]);
            Inventory.pushWeights(entityKey, weights[i]);
            totalWeight += weights[i];
        }

        Inventory.setTotalWeight(entityKey, totalWeight);
    }

    function setItems(uint32[] memory ids, uint32[] memory weights, uint256 totalWeight) public {
        if (ids.length != weights.length) {
            revert ITEMS_LENGTH_MISMATCH();
        }

        bytes32 entityKey = _addressToEntityKey(_msgSender());
        Inventory.setItems(entityKey, ids);
        Inventory.setWeights(entityKey, weights);
        Inventory.setTotalWeight(entityKey, totalWeight);
    }

    /* ---------------------------------- UTILS --------------------------------- */
    function _addressToEntityKey(address addr) internal pure returns (bytes32 key) {
        key = bytes32(uint256(uint160(addr)));
    }
}
