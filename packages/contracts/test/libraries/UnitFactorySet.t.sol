// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";

contract UnitFactorySetTest is PrimodiumTest {
  bytes32 player = "player";
  bytes32 building = "building";

  function setUp() public override {
    super.setUp();
    vm.startPrank(creator);
  }

  function testAdd() public {
    UnitFactorySet.add(player, building);
    assertTrue(UnitFactorySet.has(player, building));
    assertFalse(UnitFactorySet.has(player, bytes32("other")));
  }

  function testAddDuplicate() public {
    UnitFactorySet.add(player, building);
    UnitFactorySet.add(player, building);
    assertTrue(UnitFactorySet.has(player, building));
    assertFalse(UnitFactorySet.has(player, bytes32("other")));
  }

  function testGetAll() public {
    UnitFactorySet.add(player, building);
    UnitFactorySet.add(player, bytes32("other"));
    bytes32[] memory all = UnitFactorySet.getAll(player);
    assertEq(all.length, 2);
    assertEq(all[0], building);
    assertEq(all[1], bytes32("other"));
  }

  function testGetAllEmpty() public {
    bytes32[] memory all = UnitFactorySet.getAll(player);
    assertEq(all.length, 0);
  }

  function testRemove() public {
    UnitFactorySet.add(player, building);
    UnitFactorySet.remove(player, building);
    assertFalse(UnitFactorySet.has(player, building));
  }

  function testRemovePlayerDoesntExist() public {
    UnitFactorySet.remove(player, building);
    assertFalse(UnitFactorySet.has(player, building));
  }

  function testRemoveBuildingDoesntExist() public {
    UnitFactorySet.add(player, building);
    UnitFactorySet.remove(player, bytes32("other"));
    assertTrue(UnitFactorySet.has(player, building));
  }

  function testRemoveOnlyOneBuilding() public {
    UnitFactorySet.add(player, building);
    UnitFactorySet.remove(player, building);
    assertFalse(UnitFactorySet.has(player, building));
  }

  function testClear() public {
    UnitFactorySet.add(player, building);
    UnitFactorySet.add(player, bytes32("other"));
    UnitFactorySet.clear(player);
    assertFalse(UnitFactorySet.has(player, building));
    assertFalse(UnitFactorySet.has(player, bytes32("other")));
  }
}
