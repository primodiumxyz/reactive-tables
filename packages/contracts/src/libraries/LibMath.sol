// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { PositionData } from "codegen/index.sol";
import { Trigonometry as Trig } from "trig/src/Trigonometry.sol";
import { ABDKMath64x64 as Math } from "abdk/ABDKMath64x64.sol";

library LibMath {
  /// @notice Calculates the absolute value of an int32 input
  /// @notice Returns the non-negative integer counterpart of the input
  /// @param input The integer whose absolute value is to be calculated
  /// @return int32 The absolute value of the input integer
  function abs(int32 input) internal pure returns (int32) {
    return input < 0 ? -input : input;
  }

  /// @notice Finds the minimum value between two uint256 numbers
  /// @notice Compares num1 and num2 and returns the smaller number
  /// @param num1 The first number to be compared
  /// @param num2 The second number to be compared
  /// @return uint256 The smaller of num1 and num2
  function min(uint256 num1, uint256 num2) internal pure returns (uint256) {
    return num1 < num2 ? num1 : num2;
  }

  /// @notice Finds the maximum value between two uint256 numbers
  /// @notice Compares num1 and num2 and returns the larger number
  /// @param num1 The first number to be compared
  /// @param num2 The second number to be compared
  /// @return uint256 The larger of num1 and num2
  function max(uint256 num1, uint256 num2) internal pure returns (uint256) {
    return num1 > num2 ? num1 : num2;
  }

  /// @notice Finds the division of num1 by num2 rounded to the nearest integer
  /// @param num1 The first number to be divided
  /// @param num2 The second number to be divided by
  /// @return uint256 The result of division rounded to the nearest integer
  function divideRound(uint256 num1, uint256 num2) internal pure returns (uint256) {
    return (num1 / num2) + (((num1 % num2) * 2 >= num2) ? 1 : 0);
  }

  function divideCeil(uint256 num1, uint256 num2) internal pure returns (uint256) {
    return (num1 / num2) + ((num1 % num2) != 0 ? 1 : 0);
  }

  /// @notice Calculates position based on distance and direction
  /// @notice Converts angle to radians and calculates x, y coords
  /// @param _distance Distance to asteroid
  /// @param direction Direction angle in degrees
  /// @return position Calculated position
  function getPositionByVector(uint256 _distance, uint256 direction) internal pure returns (PositionData memory) {
    direction = direction % 360;
    bool flip = direction >= 180;
    direction = direction % 180;
    uint256 angleDegsTimes10000 = direction * 1745;

    uint256 angleRads = angleDegsTimes10000 * 1e13 + Trig.TWO_PI;

    int256 newX = Trig.cos(angleRads) * int256(_distance);
    int256 newY = Trig.sin(angleRads) * int256(_distance);
    int32 x = int32((newX / 1e18));
    int32 y = int32((newY / 1e18));
    return PositionData({ x: flip ? -x : x, y: flip ? -y : y, parent: 0 });
  }

  /// @notice Calculates distance for asteroid based on asteroid count
  /// @notice Uses the formula 260 * ln((asteroidCount + 105) / 10) - 580
  /// @param asteroidCount Number of asteroids
  /// @return uint256 Calculated distance
  function getSpawnDistance(uint256 asteroidCount) internal pure returns (uint256) {
    int128 value = Math.add(Math.fromUInt(asteroidCount), Math.fromUInt(105));
    value = Math.div(value, Math.fromUInt(10));
    value = Math.ln(value);
    uint256 integer = Math.mulu(value, 260);
    return integer - 580;
  }

  /// @notice Determines asteroid's direction based on asteroid count
  /// @notice Uses the asteroid count to find direction angle
  /// @param asteroidCount Number of asteroids
  /// @return uint256 Calculated direction
  function getSpawnDirection(uint256 asteroidCount) internal pure returns (uint256) {
    uint256 countMod27 = asteroidCount % 27;
    uint256 countMod3 = asteroidCount % 3;
    uint256 generalDirection = asteroidCount % 4;
    return generalDirection * 90 + countMod3 * 30 + countMod27;
  }

  function distance(PositionData memory a, PositionData memory b) internal pure returns (uint32) {
    int128 distanceSquared = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    return uint32(Math.toUInt(Math.sqrt(Math.fromInt(distanceSquared))));
  }
}
