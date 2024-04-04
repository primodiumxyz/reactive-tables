// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { System } from "@latticexyz/world/src/System.sol";
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { Schema } from "@latticexyz/store/src/Schema.sol";
import { PackedCounter } from "@latticexyz/store/src/PackedCounter.sol";
import { ResourceId } from "@latticexyz/world/src/WorldResourceId.sol";
import { StoreCore } from "@latticexyz/store/src/StoreCore.sol";

contract DevSystem is System {
  /**
   * Write a record in the table at the given tableId.
   */
  function devSetRecord(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    bytes calldata staticData,
    PackedCounter encodedLengths,
    bytes calldata dynamicData
  ) public {
    // Set the record
    StoreCore.setRecord(tableId, keyTuple, staticData, encodedLengths, dynamicData);
  }

  function devSpliceStaticData(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint48 start,
    bytes calldata data
  ) public {
    // Splice the static data
    StoreCore.spliceStaticData(tableId, keyTuple, start, data);
  }

  function devSpliceDynamicData(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 dynamicFieldIndex,
    uint40 startWithinField,
    uint40 deleteCount,
    bytes calldata data
  ) public {
    // Splice the dynamic data
    StoreCore.spliceDynamicData(tableId, keyTuple, dynamicFieldIndex, startWithinField, deleteCount, data);
  }

  /**
   * Write a field in the table at the given tableId.
   */
  function devSetField(ResourceId tableId, bytes32[] calldata keyTuple, uint8 fieldIndex, bytes calldata data) public {
    // Set the field
    StoreCore.setField(tableId, keyTuple, fieldIndex, data);
  }

  /**
   * Write a field in the table at the given tableId.
   */
  function devSetField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 fieldIndex,
    bytes calldata data,
    FieldLayout fieldLayout
  ) public {
    // Set the field
    StoreCore.setField(tableId, keyTuple, fieldIndex, data, fieldLayout);
  }

  /**
   * Write a static field in the table at the given tableId.
   */
  function devSetStaticField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 fieldIndex,
    bytes calldata data,
    FieldLayout fieldLayout
  ) public {
    // Set the field
    StoreCore.setStaticField(tableId, keyTuple, fieldIndex, data, fieldLayout);
  }

  /**
   * Write a dynamic field in the table at the given tableId.
   */
  function devSetDynamicField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 dynamicFieldIndex,
    bytes calldata data
  ) public {
    // Set the field
    StoreCore.setDynamicField(tableId, keyTuple, dynamicFieldIndex, data);
  }

  /**
   * Push data to the end of a field in the table at the given tableId.
   */
  function devPushToDynamicField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 dynamicFieldIndex,
    bytes calldata dataToPush
  ) public {
    // Push to the field
    StoreCore.pushToDynamicField(tableId, keyTuple, dynamicFieldIndex, dataToPush);
  }

  /**
   * Pop data from the end of a field in the table at the given tableId.
   */
  function devPopFromDynamicField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 dynamicFieldIndex,
    uint256 byteLengthToPop
  ) public {
    // Push to the field
    StoreCore.popFromDynamicField(tableId, keyTuple, dynamicFieldIndex, byteLengthToPop);
  }

  /**
   * Delete a record in the table at the given tableId.
   */
  function devDeleteRecord(ResourceId tableId, bytes32[] calldata keyTuple) public {
    // Delete the record
    StoreCore.deleteRecord(tableId, keyTuple);
  }
}
