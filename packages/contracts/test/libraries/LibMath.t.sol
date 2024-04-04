// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";
import { ABDKMath64x64 as Math } from "abdk/ABDKMath64x64.sol";

contract LibMathTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
  }

  function testFuzzPositionByVector(uint256 distance, uint256 direction) public {
    distance = distance % 100_000;
    direction = direction % 720;
    PositionData memory destination = LibMath.getPositionByVector(distance, direction);
    uint256 reverseDirection = direction + 180;
    PositionData memory origin = LibMath.getPositionByVector(distance, reverseDirection);
    origin = PositionData(origin.x + destination.x, origin.y + destination.y, 0);
    assertEq(origin, PositionData(0, 0, 0));
  }

  function testPositionByVector() public {
    uint256 distance = 100;
    uint256 direction = 85;
    PositionData memory destination = LibMath.getPositionByVector(distance, direction);
    uint256 reverseDirection = direction + 180;
    PositionData memory origin = LibMath.getPositionByVector(distance, reverseDirection);
    origin = PositionData(origin.x + destination.x, origin.y + destination.y, 0);
    assertEq(origin, PositionData(0, 0, 0));
  }

  function testPrintPositions() public view {
    uint256 distance = 100;
    uint256 max = 13;
    for (uint256 i = 0; i < max; i++) {
      PositionData memory coord = LibMath.getPositionByVector(distance, (i * 360) / max);
      logPosition(coord);
    }
  }

  function testDistance() public {
    PositionData memory a = PositionData(0, 0, 0);
    PositionData memory b = PositionData(0, 0, 0);
    assertEq(LibMath.distance(a, b), 0);
    b.y = 10;
    assertEq(LibMath.distance(a, b), 10);
    b.y = 100;
    assertEq(LibMath.distance(a, b), 100);
  }
}
