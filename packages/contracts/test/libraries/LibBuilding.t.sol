// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";

contract LibBuildingTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
    spawn(creator);
    vm.startPrank(creator);
  }

  function testGetPlayerBounds(int16 maxX, int16 maxY, int16 currX, int16 currY) public {
    // Bound fuzzy parameters to int16 to eliminate overflow errors when testing
    vm.assume(currX > 0);
    vm.assume(currY > 0);
    vm.assume(maxX >= currX);
    vm.assume(maxY >= currY);

    P_Asteroid.set(maxX, maxY);

    bytes32 playerEntity = addressToEntity(creator);
    uint256 playerLevel = Level.get(Home.get(playerEntity));

    Dimensions.set(ExpansionKey, playerLevel, currX, currY);

    Bounds memory bounds = LibBuilding.getSpaceRockBounds(Home.get(playerEntity));

    assertEq(bounds.minX, (int32(maxX) - int32(currX)) / 2);
    assertEq(bounds.maxX, (int32(maxX) + int32(currX)) / 2 - 1);
    assertEq(bounds.minY, (int32(maxY) - int32(currY)) / 2);
    assertEq(bounds.maxY, (int32(maxY) + int32(currY)) / 2 - 1);

    // Check that the bound size matches with the current player dimensions
    assertEq(currX, bounds.maxX - bounds.minX + 1);
    assertEq(currY, bounds.maxY - bounds.minY + 1);
  }
}
