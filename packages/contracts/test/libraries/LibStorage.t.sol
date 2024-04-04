// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";

contract TestLibStorage is PrimodiumTest {
  bytes32 playerEntity = "playerEntity";
  uint8 mockResource = Iron;
  bytes32 buildingPrototype = "buildingPrototype";
  bytes32 buildingEntity = "building";
  uint256 level = 2;

  function setUp() public override {
    super.setUp();
    vm.startPrank(creator);
    BuildingType.set(buildingEntity, buildingPrototype);
    Level.set(buildingEntity, level);
  }

  function testIncreaseMaxStorage() public {
    uint8[] memory data = new uint8[](1);
    data[0] = uint8(mockResource);
    P_ListMaxResourceUpgrades.set(buildingPrototype, level, data);
    P_ByLevelMaxResourceUpgrades.set(buildingPrototype, mockResource, level, 100);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    LibStorage.increaseMaxStorage(buildingEntity, level);
    assertEq(MaxResourceCount.get(spaceRockEntity, mockResource), 100);
  }

  function testClearMaxStorageIncrease() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, mockResource, 100);

    uint8[] memory data = new uint8[](1);
    data[0] = uint8(mockResource);
    P_ListMaxResourceUpgrades.set(buildingPrototype, level, data);
    P_ByLevelMaxResourceUpgrades.set(buildingPrototype, mockResource, level, 50);

    LibStorage.clearMaxStorageIncrease(buildingEntity);
    assertEq(MaxResourceCount.get(spaceRockEntity, mockResource), 50);
  }

  function testFailClearMaxStorageIncreaseTooBig() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, mockResource, 50);

    uint8[] memory data = new uint8[](1);
    data[0] = uint8(mockResource);
    P_ListMaxResourceUpgrades.set(buildingPrototype, level, data);
    P_ByLevelMaxResourceUpgrades.set(buildingPrototype, mockResource, level, 100);

    LibStorage.clearMaxStorageIncrease(buildingEntity);
  }

  function testDecreaseStoredResourceEnoughResources() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, mockResource, 100);
    LibStorage.decreaseStoredResource(spaceRockEntity, mockResource, 50);
    assertEq(ResourceCount.get(spaceRockEntity, mockResource), 50);
  }

  function testDecreaseStoredResourceNotEnoughResources() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    LibStorage.decreaseStoredResource(spaceRockEntity, mockResource, 50);
    assertEq(ResourceCount.get(spaceRockEntity, mockResource), 0);
  }

  function testIncreaseStoredResourceBelowMaxCap() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, mockResource, 100);
    LibStorage.increaseStoredResource(spaceRockEntity, mockResource, 50);
    assertEq(ResourceCount.get(spaceRockEntity, mockResource), 50);
  }

  function testIncreaseStoredResourceAtMaxCap() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, mockResource, 100);
    ResourceCount.set(spaceRockEntity, mockResource, 100);
    LibStorage.increaseStoredResource(spaceRockEntity, mockResource, 50);
    assertEq(ResourceCount.get(spaceRockEntity, mockResource), 100);
  }

  function testIncreaseMaxUtility() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    LibStorage.increaseMaxUtility(spaceRockEntity, mockResource, 20);
    assertEq(MaxResourceCount.get(spaceRockEntity, mockResource), 20);
  }

  function testDecreaseMaxUtilityEnoughUtility() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, mockResource, 50);
    LibStorage.decreaseMaxUtility(spaceRockEntity, mockResource, 20);
    assertEq(MaxResourceCount.get(spaceRockEntity, mockResource), 30);
  }

  function testDecreaseMaxUtilityNotEnoughUtility() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    LibStorage.decreaseMaxUtility(spaceRockEntity, mockResource, 20);
    assertEq(MaxResourceCount.get(spaceRockEntity, mockResource), 0);
  }

  function testDecreaseResourceUpdateScore() public {}
}
