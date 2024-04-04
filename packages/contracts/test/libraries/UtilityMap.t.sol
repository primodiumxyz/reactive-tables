// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";

contract UtilityMapTest is PrimodiumTest {
  bytes32 player1 = "player1";
  uint8 resource1 = uint8(EResource.U_Electricity);
  uint8 resource2 = uint8(EResource.U_Housing);

  function setUp() public override {
    super.setUp();
    vm.startPrank(creator);
  }

  function testHas() public {
    UtilityMap.set(player1, resource1, 50);
    assertTrue(UtilityMap.has(player1, resource1));
    assertFalse(UtilityMap.has(player1, resource2));
  }

  function testGet() public {
    UtilityMap.set(player1, resource1, 50);
    assertEq(UtilityMap.get(player1, resource1), 50);
  }

  function testGetAll() public {
    UtilityMap.set(player1, resource1, 50);
    UtilityMap.set(player1, resource2, 20);
    uint8[] memory allResources = UtilityMap.keys(player1);
    assertEq(allResources.length, 2);
  }

  function testSet() public {
    UtilityMap.set(player1, resource1, 50);
    assertEq(UtilityMap.get(player1, resource1), 50);
  }

  function testRemove() public {
    UtilityMap.set(player1, resource1, 50);
    UtilityMap.remove(player1, resource1);
    assertFalse(UtilityMap.has(player1, resource1));
  }

  function testClear() public {
    UtilityMap.set(player1, resource1, 50);
    UtilityMap.set(player1, resource2, 20);
    UtilityMap.clear(player1);
    uint8[] memory allResources = UtilityMap.keys(player1);
    assertEq(allResources.length, 0);
  }
}
