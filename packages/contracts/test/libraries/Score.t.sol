// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";

contract ScoreTest is PrimodiumTest {
  bytes32 playerEntity;

  function setUp() public override {
    super.setUp();
    spawn(creator);
    playerEntity = addressToEntity(creator);
    vm.startPrank(creator);
  }

  function testScoreHook() public {
    bytes32 homeRock = Home.get(playerEntity);
    MaxResourceCount.set(homeRock, uint8(Iron), 1000);
    ResourceCount.set(homeRock, uint8(Iron), 0);

    assertEq(Score.get(playerEntity), 0, "score should be 0");
    ResourceCount.set(homeRock, uint8(Iron), 100);
    assertEq(Score.get(homeRock), P_ScoreMultiplier.get(uint8(Iron)) * 100, "rock score does not match");
    assertEq(Score.get(playerEntity), P_ScoreMultiplier.get(uint8(Iron)) * 100, "player score does not match");
  }
}
