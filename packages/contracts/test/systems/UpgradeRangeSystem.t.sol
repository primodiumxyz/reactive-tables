// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "../PrimodiumTest.t.sol";

contract UpgradeRangeSystemTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
    spawn(creator);
    vm.startPrank(creator);
  }

  function testOutOfBounds() public {
    bytes32 creatorEntity = addressToEntity(creator);
    bytes32 asteroid = Home.get(creatorEntity);

    Bounds memory bounds = LibBuilding.getSpaceRockBounds(asteroid);

    removeRequirements(EBuilding.IronMine);

    vm.expectRevert(bytes("[BuildSystem] Building out of bounds"));
    world.build(EBuilding.IronMine, PositionData(bounds.maxX + 1, bounds.maxY, asteroid));
  }

  function testFailUpgradeRangeWrongBaseLevel() public {
    bytes32 creatorEntity = addressToEntity(creator);
    Level.set(Home.get(creatorEntity), 5);

    assertTrue(P_RequiredBaseLevel.get(ExpansionKey, 5) != 0, "should have expansion level 5");
    P_RequiredUpgradeResources.deleteRecord(ExpansionKey, 5);
    //vm.expectRevert(bytes("[UpgradeRangeSystem] MainBase level requirement not met"));
    world.upgradeRange(Home.get(creatorEntity));
  }

  function testFailUpgradeRangeMaxLevel() public {
    bytes32 creatorEntity = addressToEntity(creator);
    bytes32 home = Home.get(creatorEntity);
    // set player level to max level

    uint256 maxLevel = Asteroid.getMaxLevel(home);

    Level.set(Home.get(creatorEntity), maxLevel);
    assertEq(Level.get(Home.get(creatorEntity)), maxLevel);
    P_RequiredUpgradeResources.deleteRecord(ExpansionKey, maxLevel);
    //vm.expectRevert(bytes("[UpgradeRangeSystem] Max level reached"));
    world.upgradeRange(Home.get(creatorEntity));
  }

  function testUpgradeRange() public {
    bytes32 creatorEntity = addressToEntity(creator);
    bytes32 asteroid = Home.get(creatorEntity);
    uint256 level = Level.get(asteroid);

    // increment creator's main base level by 1
    bytes32 mainBase = Home.get(asteroid);

    Level.set(mainBase, level + 1);
    P_RequiredUpgradeResources.deleteRecord(ExpansionKey, level + 1);

    world.upgradeRange(asteroid);
    assertEq(Level.get(asteroid), level + 1);
  }
}
