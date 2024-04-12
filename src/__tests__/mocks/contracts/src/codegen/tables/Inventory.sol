// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

/* Autogenerated file. Do not edit manually. */

// Import store internals
import { IStore } from "@latticexyz/store/src/IStore.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { StoreCore } from "@latticexyz/store/src/StoreCore.sol";
import { Bytes } from "@latticexyz/store/src/Bytes.sol";
import { Memory } from "@latticexyz/store/src/Memory.sol";
import { SliceLib } from "@latticexyz/store/src/Slice.sol";
import { EncodeArray } from "@latticexyz/store/src/tightcoder/EncodeArray.sol";
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import { Schema } from "@latticexyz/store/src/Schema.sol";
import { EncodedLengths, EncodedLengthsLib } from "@latticexyz/store/src/EncodedLengths.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";

struct InventoryData {
  uint256 totalWeight;
  uint32[] items;
  uint32[] weights;
}

library Inventory {
  // Hex below is the result of `WorldResourceIdLib.encode({ namespace: "", name: "Inventory", typeId: RESOURCE_TABLE });`
  ResourceId constant _tableId = ResourceId.wrap(0x74620000000000000000000000000000496e76656e746f727900000000000000);

  FieldLayout constant _fieldLayout =
    FieldLayout.wrap(0x0020010220000000000000000000000000000000000000000000000000000000);

  // Hex-encoded key schema of (bytes32)
  Schema constant _keySchema = Schema.wrap(0x002001005f000000000000000000000000000000000000000000000000000000);
  // Hex-encoded value schema of (uint256, uint32[], uint32[])
  Schema constant _valueSchema = Schema.wrap(0x002001021f656500000000000000000000000000000000000000000000000000);

  /**
   * @notice Get the table's key field names.
   * @return keyNames An array of strings with the names of key fields.
   */
  function getKeyNames() internal pure returns (string[] memory keyNames) {
    keyNames = new string[](1);
    keyNames[0] = "id";
  }

  /**
   * @notice Get the table's value field names.
   * @return fieldNames An array of strings with the names of value fields.
   */
  function getFieldNames() internal pure returns (string[] memory fieldNames) {
    fieldNames = new string[](3);
    fieldNames[0] = "totalWeight";
    fieldNames[1] = "items";
    fieldNames[2] = "weights";
  }

  /**
   * @notice Register the table with its config.
   */
  function register() internal {
    StoreSwitch.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  /**
   * @notice Register the table with its config.
   */
  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  /**
   * @notice Get totalWeight.
   */
  function getTotalWeight(bytes32 id) internal view returns (uint256 totalWeight) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    bytes32 _blob = StoreSwitch.getStaticField(_tableId, _keyTuple, 0, _fieldLayout);
    return (uint256(bytes32(_blob)));
  }

  /**
   * @notice Get totalWeight.
   */
  function _getTotalWeight(bytes32 id) internal view returns (uint256 totalWeight) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    bytes32 _blob = StoreCore.getStaticField(_tableId, _keyTuple, 0, _fieldLayout);
    return (uint256(bytes32(_blob)));
  }

  /**
   * @notice Set totalWeight.
   */
  function setTotalWeight(bytes32 id, uint256 totalWeight) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreSwitch.setStaticField(_tableId, _keyTuple, 0, abi.encodePacked((totalWeight)), _fieldLayout);
  }

  /**
   * @notice Set totalWeight.
   */
  function _setTotalWeight(bytes32 id, uint256 totalWeight) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreCore.setStaticField(_tableId, _keyTuple, 0, abi.encodePacked((totalWeight)), _fieldLayout);
  }

  /**
   * @notice Get items.
   */
  function getItems(bytes32 id) internal view returns (uint32[] memory items) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    bytes memory _blob = StoreSwitch.getDynamicField(_tableId, _keyTuple, 0);
    return (SliceLib.getSubslice(_blob, 0, _blob.length).decodeArray_uint32());
  }

  /**
   * @notice Get items.
   */
  function _getItems(bytes32 id) internal view returns (uint32[] memory items) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    bytes memory _blob = StoreCore.getDynamicField(_tableId, _keyTuple, 0);
    return (SliceLib.getSubslice(_blob, 0, _blob.length).decodeArray_uint32());
  }

  /**
   * @notice Set items.
   */
  function setItems(bytes32 id, uint32[] memory items) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreSwitch.setDynamicField(_tableId, _keyTuple, 0, EncodeArray.encode((items)));
  }

  /**
   * @notice Set items.
   */
  function _setItems(bytes32 id, uint32[] memory items) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreCore.setDynamicField(_tableId, _keyTuple, 0, EncodeArray.encode((items)));
  }

  /**
   * @notice Get the length of items.
   */
  function lengthItems(bytes32 id) internal view returns (uint256) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    uint256 _byteLength = StoreSwitch.getDynamicFieldLength(_tableId, _keyTuple, 0);
    unchecked {
      return _byteLength / 4;
    }
  }

  /**
   * @notice Get the length of items.
   */
  function _lengthItems(bytes32 id) internal view returns (uint256) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    uint256 _byteLength = StoreCore.getDynamicFieldLength(_tableId, _keyTuple, 0);
    unchecked {
      return _byteLength / 4;
    }
  }

  /**
   * @notice Get an item of items.
   * @dev Reverts with Store_IndexOutOfBounds if `_index` is out of bounds for the array.
   */
  function getItemItems(bytes32 id, uint256 _index) internal view returns (uint32) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    unchecked {
      bytes memory _blob = StoreSwitch.getDynamicFieldSlice(_tableId, _keyTuple, 0, _index * 4, (_index + 1) * 4);
      return (uint32(bytes4(_blob)));
    }
  }

  /**
   * @notice Get an item of items.
   * @dev Reverts with Store_IndexOutOfBounds if `_index` is out of bounds for the array.
   */
  function _getItemItems(bytes32 id, uint256 _index) internal view returns (uint32) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    unchecked {
      bytes memory _blob = StoreCore.getDynamicFieldSlice(_tableId, _keyTuple, 0, _index * 4, (_index + 1) * 4);
      return (uint32(bytes4(_blob)));
    }
  }

  /**
   * @notice Push an element to items.
   */
  function pushItems(bytes32 id, uint32 _element) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreSwitch.pushToDynamicField(_tableId, _keyTuple, 0, abi.encodePacked((_element)));
  }

  /**
   * @notice Push an element to items.
   */
  function _pushItems(bytes32 id, uint32 _element) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreCore.pushToDynamicField(_tableId, _keyTuple, 0, abi.encodePacked((_element)));
  }

  /**
   * @notice Pop an element from items.
   */
  function popItems(bytes32 id) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreSwitch.popFromDynamicField(_tableId, _keyTuple, 0, 4);
  }

  /**
   * @notice Pop an element from items.
   */
  function _popItems(bytes32 id) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreCore.popFromDynamicField(_tableId, _keyTuple, 0, 4);
  }

  /**
   * @notice Update an element of items at `_index`.
   */
  function updateItems(bytes32 id, uint256 _index, uint32 _element) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    unchecked {
      bytes memory _encoded = abi.encodePacked((_element));
      StoreSwitch.spliceDynamicData(_tableId, _keyTuple, 0, uint40(_index * 4), uint40(_encoded.length), _encoded);
    }
  }

  /**
   * @notice Update an element of items at `_index`.
   */
  function _updateItems(bytes32 id, uint256 _index, uint32 _element) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    unchecked {
      bytes memory _encoded = abi.encodePacked((_element));
      StoreCore.spliceDynamicData(_tableId, _keyTuple, 0, uint40(_index * 4), uint40(_encoded.length), _encoded);
    }
  }

  /**
   * @notice Get weights.
   */
  function getWeights(bytes32 id) internal view returns (uint32[] memory weights) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    bytes memory _blob = StoreSwitch.getDynamicField(_tableId, _keyTuple, 1);
    return (SliceLib.getSubslice(_blob, 0, _blob.length).decodeArray_uint32());
  }

  /**
   * @notice Get weights.
   */
  function _getWeights(bytes32 id) internal view returns (uint32[] memory weights) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    bytes memory _blob = StoreCore.getDynamicField(_tableId, _keyTuple, 1);
    return (SliceLib.getSubslice(_blob, 0, _blob.length).decodeArray_uint32());
  }

  /**
   * @notice Set weights.
   */
  function setWeights(bytes32 id, uint32[] memory weights) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreSwitch.setDynamicField(_tableId, _keyTuple, 1, EncodeArray.encode((weights)));
  }

  /**
   * @notice Set weights.
   */
  function _setWeights(bytes32 id, uint32[] memory weights) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreCore.setDynamicField(_tableId, _keyTuple, 1, EncodeArray.encode((weights)));
  }

  /**
   * @notice Get the length of weights.
   */
  function lengthWeights(bytes32 id) internal view returns (uint256) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    uint256 _byteLength = StoreSwitch.getDynamicFieldLength(_tableId, _keyTuple, 1);
    unchecked {
      return _byteLength / 4;
    }
  }

  /**
   * @notice Get the length of weights.
   */
  function _lengthWeights(bytes32 id) internal view returns (uint256) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    uint256 _byteLength = StoreCore.getDynamicFieldLength(_tableId, _keyTuple, 1);
    unchecked {
      return _byteLength / 4;
    }
  }

  /**
   * @notice Get an item of weights.
   * @dev Reverts with Store_IndexOutOfBounds if `_index` is out of bounds for the array.
   */
  function getItemWeights(bytes32 id, uint256 _index) internal view returns (uint32) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    unchecked {
      bytes memory _blob = StoreSwitch.getDynamicFieldSlice(_tableId, _keyTuple, 1, _index * 4, (_index + 1) * 4);
      return (uint32(bytes4(_blob)));
    }
  }

  /**
   * @notice Get an item of weights.
   * @dev Reverts with Store_IndexOutOfBounds if `_index` is out of bounds for the array.
   */
  function _getItemWeights(bytes32 id, uint256 _index) internal view returns (uint32) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    unchecked {
      bytes memory _blob = StoreCore.getDynamicFieldSlice(_tableId, _keyTuple, 1, _index * 4, (_index + 1) * 4);
      return (uint32(bytes4(_blob)));
    }
  }

  /**
   * @notice Push an element to weights.
   */
  function pushWeights(bytes32 id, uint32 _element) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreSwitch.pushToDynamicField(_tableId, _keyTuple, 1, abi.encodePacked((_element)));
  }

  /**
   * @notice Push an element to weights.
   */
  function _pushWeights(bytes32 id, uint32 _element) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreCore.pushToDynamicField(_tableId, _keyTuple, 1, abi.encodePacked((_element)));
  }

  /**
   * @notice Pop an element from weights.
   */
  function popWeights(bytes32 id) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreSwitch.popFromDynamicField(_tableId, _keyTuple, 1, 4);
  }

  /**
   * @notice Pop an element from weights.
   */
  function _popWeights(bytes32 id) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreCore.popFromDynamicField(_tableId, _keyTuple, 1, 4);
  }

  /**
   * @notice Update an element of weights at `_index`.
   */
  function updateWeights(bytes32 id, uint256 _index, uint32 _element) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    unchecked {
      bytes memory _encoded = abi.encodePacked((_element));
      StoreSwitch.spliceDynamicData(_tableId, _keyTuple, 1, uint40(_index * 4), uint40(_encoded.length), _encoded);
    }
  }

  /**
   * @notice Update an element of weights at `_index`.
   */
  function _updateWeights(bytes32 id, uint256 _index, uint32 _element) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    unchecked {
      bytes memory _encoded = abi.encodePacked((_element));
      StoreCore.spliceDynamicData(_tableId, _keyTuple, 1, uint40(_index * 4), uint40(_encoded.length), _encoded);
    }
  }

  /**
   * @notice Get the full data.
   */
  function get(bytes32 id) internal view returns (InventoryData memory _table) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    (bytes memory _staticData, EncodedLengths _encodedLengths, bytes memory _dynamicData) = StoreSwitch.getRecord(
      _tableId,
      _keyTuple,
      _fieldLayout
    );
    return decode(_staticData, _encodedLengths, _dynamicData);
  }

  /**
   * @notice Get the full data.
   */
  function _get(bytes32 id) internal view returns (InventoryData memory _table) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    (bytes memory _staticData, EncodedLengths _encodedLengths, bytes memory _dynamicData) = StoreCore.getRecord(
      _tableId,
      _keyTuple,
      _fieldLayout
    );
    return decode(_staticData, _encodedLengths, _dynamicData);
  }

  /**
   * @notice Set the full data using individual values.
   */
  function set(bytes32 id, uint256 totalWeight, uint32[] memory items, uint32[] memory weights) internal {
    bytes memory _staticData = encodeStatic(totalWeight);

    EncodedLengths _encodedLengths = encodeLengths(items, weights);
    bytes memory _dynamicData = encodeDynamic(items, weights);

    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreSwitch.setRecord(_tableId, _keyTuple, _staticData, _encodedLengths, _dynamicData);
  }

  /**
   * @notice Set the full data using individual values.
   */
  function _set(bytes32 id, uint256 totalWeight, uint32[] memory items, uint32[] memory weights) internal {
    bytes memory _staticData = encodeStatic(totalWeight);

    EncodedLengths _encodedLengths = encodeLengths(items, weights);
    bytes memory _dynamicData = encodeDynamic(items, weights);

    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreCore.setRecord(_tableId, _keyTuple, _staticData, _encodedLengths, _dynamicData, _fieldLayout);
  }

  /**
   * @notice Set the full data using the data struct.
   */
  function set(bytes32 id, InventoryData memory _table) internal {
    bytes memory _staticData = encodeStatic(_table.totalWeight);

    EncodedLengths _encodedLengths = encodeLengths(_table.items, _table.weights);
    bytes memory _dynamicData = encodeDynamic(_table.items, _table.weights);

    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreSwitch.setRecord(_tableId, _keyTuple, _staticData, _encodedLengths, _dynamicData);
  }

  /**
   * @notice Set the full data using the data struct.
   */
  function _set(bytes32 id, InventoryData memory _table) internal {
    bytes memory _staticData = encodeStatic(_table.totalWeight);

    EncodedLengths _encodedLengths = encodeLengths(_table.items, _table.weights);
    bytes memory _dynamicData = encodeDynamic(_table.items, _table.weights);

    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreCore.setRecord(_tableId, _keyTuple, _staticData, _encodedLengths, _dynamicData, _fieldLayout);
  }

  /**
   * @notice Decode the tightly packed blob of static data using this table's field layout.
   */
  function decodeStatic(bytes memory _blob) internal pure returns (uint256 totalWeight) {
    totalWeight = (uint256(Bytes.getBytes32(_blob, 0)));
  }

  /**
   * @notice Decode the tightly packed blob of dynamic data using the encoded lengths.
   */
  function decodeDynamic(
    EncodedLengths _encodedLengths,
    bytes memory _blob
  ) internal pure returns (uint32[] memory items, uint32[] memory weights) {
    uint256 _start;
    uint256 _end;
    unchecked {
      _end = _encodedLengths.atIndex(0);
    }
    items = (SliceLib.getSubslice(_blob, _start, _end).decodeArray_uint32());

    _start = _end;
    unchecked {
      _end += _encodedLengths.atIndex(1);
    }
    weights = (SliceLib.getSubslice(_blob, _start, _end).decodeArray_uint32());
  }

  /**
   * @notice Decode the tightly packed blobs using this table's field layout.
   * @param _staticData Tightly packed static fields.
   * @param _encodedLengths Encoded lengths of dynamic fields.
   * @param _dynamicData Tightly packed dynamic fields.
   */
  function decode(
    bytes memory _staticData,
    EncodedLengths _encodedLengths,
    bytes memory _dynamicData
  ) internal pure returns (InventoryData memory _table) {
    (_table.totalWeight) = decodeStatic(_staticData);

    (_table.items, _table.weights) = decodeDynamic(_encodedLengths, _dynamicData);
  }

  /**
   * @notice Delete all data for given keys.
   */
  function deleteRecord(bytes32 id) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreSwitch.deleteRecord(_tableId, _keyTuple);
  }

  /**
   * @notice Delete all data for given keys.
   */
  function _deleteRecord(bytes32 id) internal {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    StoreCore.deleteRecord(_tableId, _keyTuple, _fieldLayout);
  }

  /**
   * @notice Tightly pack static (fixed length) data using this table's schema.
   * @return The static data, encoded into a sequence of bytes.
   */
  function encodeStatic(uint256 totalWeight) internal pure returns (bytes memory) {
    return abi.encodePacked(totalWeight);
  }

  /**
   * @notice Tightly pack dynamic data lengths using this table's schema.
   * @return _encodedLengths The lengths of the dynamic fields (packed into a single bytes32 value).
   */
  function encodeLengths(
    uint32[] memory items,
    uint32[] memory weights
  ) internal pure returns (EncodedLengths _encodedLengths) {
    // Lengths are effectively checked during copy by 2**40 bytes exceeding gas limits
    unchecked {
      _encodedLengths = EncodedLengthsLib.pack(items.length * 4, weights.length * 4);
    }
  }

  /**
   * @notice Tightly pack dynamic (variable length) data using this table's schema.
   * @return The dynamic data, encoded into a sequence of bytes.
   */
  function encodeDynamic(uint32[] memory items, uint32[] memory weights) internal pure returns (bytes memory) {
    return abi.encodePacked(EncodeArray.encode((items)), EncodeArray.encode((weights)));
  }

  /**
   * @notice Encode all of a record's fields.
   * @return The static (fixed length) data, encoded into a sequence of bytes.
   * @return The lengths of the dynamic fields (packed into a single bytes32 value).
   * @return The dynamic (variable length) data, encoded into a sequence of bytes.
   */
  function encode(
    uint256 totalWeight,
    uint32[] memory items,
    uint32[] memory weights
  ) internal pure returns (bytes memory, EncodedLengths, bytes memory) {
    bytes memory _staticData = encodeStatic(totalWeight);

    EncodedLengths _encodedLengths = encodeLengths(items, weights);
    bytes memory _dynamicData = encodeDynamic(items, weights);

    return (_staticData, _encodedLengths, _dynamicData);
  }

  /**
   * @notice Encode keys as a bytes32 array using this table's field layout.
   */
  function encodeKeyTuple(bytes32 id) internal pure returns (bytes32[] memory) {
    bytes32[] memory _keyTuple = new bytes32[](1);
    _keyTuple[0] = id;

    return _keyTuple;
  }
}
