// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";

contract LibProductionTest is PrimodiumTest {
  bytes32 playerEntity = "playerEntity";
  bytes32 buildingEntity = "buildingEntity";
  bytes32 buildingPrototype = "buildingPrototype";
  uint256 level = 1;

  function setUp() public override {
    super.setUp();
    vm.startPrank(creator);
    BuildingType.set(buildingEntity, buildingPrototype);
    Level.set(buildingEntity, level);
  }

  function testUpgradeResourceProductionNonUtility() public {
    uint256 amount1 = 20;
    uint256 amount2 = 40;
    uint256 amount3 = 57;
    P_ProductionData memory data1 = P_ProductionData(new uint8[](1), new uint256[](1));
    data1.resources[0] = uint8(EResource.Iron);
    data1.amounts[0] = amount1;
    P_ProductionData memory data2 = P_ProductionData(new uint8[](1), new uint256[](1));
    data2.resources[0] = uint8(EResource.Iron);
    data2.amounts[0] = amount2;
    P_ProductionData memory data3 = P_ProductionData(new uint8[](1), new uint256[](1));
    data3.resources[0] = uint8(EResource.Iron);
    data3.amounts[0] = amount3;

    P_Production.set(buildingPrototype, 1, data1);
    P_Production.set(buildingPrototype, 2, data2);
    P_Production.set(buildingPrototype, 3, data3);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    LibProduction.upgradeResourceProduction(buildingEntity, 1);
    assertEq(ProductionRate.get(spaceRockEntity, uint8(EResource.Iron)), amount1);
    LibProduction.upgradeResourceProduction(buildingEntity, 2);
    assertEq(ProductionRate.get(spaceRockEntity, uint8(EResource.Iron)), amount2);
    LibProduction.upgradeResourceProduction(buildingEntity, 3);
    assertEq(ProductionRate.get(spaceRockEntity, uint8(EResource.Iron)), amount3);
  }

  function testUpgradeUtilityProductionNoEarlyLevel() public {
    P_IsUtility.set(uint8(EResource.Iron), true);
    uint256 amount2 = 40;
    uint256 amount3 = 57;
    P_ProductionData memory data1 = P_ProductionData(new uint8[](0), new uint256[](0));
    P_ProductionData memory data2 = P_ProductionData(new uint8[](1), new uint256[](1));
    data2.resources[0] = uint8(EResource.Iron);
    data2.amounts[0] = amount2;
    P_ProductionData memory data3 = P_ProductionData(new uint8[](1), new uint256[](1));
    data3.resources[0] = uint8(EResource.Iron);
    data3.amounts[0] = amount3;

    P_Production.set(buildingPrototype, 1, data1);
    P_Production.set(buildingPrototype, 2, data2);
    P_Production.set(buildingPrototype, 3, data3);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    LibProduction.upgradeResourceProduction(buildingEntity, 1);
    assertEq(MaxResourceCount.get(spaceRockEntity, uint8(EResource.Iron)), 0);
    LibProduction.upgradeResourceProduction(buildingEntity, 2);
    assertEq(MaxResourceCount.get(spaceRockEntity, uint8(EResource.Iron)), amount2);
    LibProduction.upgradeResourceProduction(buildingEntity, 3);
    assertEq(MaxResourceCount.get(spaceRockEntity, uint8(EResource.Iron)), amount3);

    assertEq(ProductionRate.get(buildingEntity, uint8(EResource.Iron)), 0);
  }

  function testUpgradeMultipleResourceProductionNonUtility() public {
    uint256 amount1 = 20;
    uint256 amount2 = 40;
    uint256 amount3 = 57;
    P_ProductionData memory data1 = P_ProductionData(new uint8[](1), new uint256[](1));
    data1.resources[0] = uint8(EResource.Iron);
    data1.amounts[0] = amount1;

    P_ProductionData memory data2 = P_ProductionData(new uint8[](2), new uint256[](2));
    data2.resources[0] = uint8(EResource.Iron);
    data2.amounts[0] = amount2;
    data2.resources[1] = uint8(EResource.Copper);
    data2.amounts[1] = amount1;

    P_ProductionData memory data3 = P_ProductionData(new uint8[](2), new uint256[](2));
    data3.resources[0] = uint8(EResource.Iron);
    data3.amounts[0] = amount3;
    data3.resources[1] = uint8(EResource.Copper);
    data3.amounts[1] = amount2;

    P_Production.set(buildingPrototype, 1, data1);
    P_Production.set(buildingPrototype, 2, data2);
    P_Production.set(buildingPrototype, 3, data3);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    LibProduction.upgradeResourceProduction(buildingEntity, 1);
    assertEq(ProductionRate.get(spaceRockEntity, uint8(EResource.Iron)), amount1);
    assertEq(ProductionRate.get(spaceRockEntity, uint8(EResource.Copper)), 0);
    LibProduction.upgradeResourceProduction(buildingEntity, 2);
    assertEq(ProductionRate.get(spaceRockEntity, uint8(EResource.Iron)), amount2);
    assertEq(ProductionRate.get(spaceRockEntity, uint8(EResource.Copper)), amount1);
    LibProduction.upgradeResourceProduction(buildingEntity, 3);
    assertEq(ProductionRate.get(spaceRockEntity, uint8(EResource.Iron)), amount3);
    assertEq(ProductionRate.get(spaceRockEntity, uint8(EResource.Copper)), amount2);
  }

  function testUpgradeResourceProductionUtility() public {
    P_IsUtility.set(uint8(EResource.Iron), true);

    uint256 amount1 = 20;
    uint256 amount2 = 40;
    uint256 amount3 = 57;
    P_ProductionData memory data1 = P_ProductionData(new uint8[](1), new uint256[](1));
    data1.resources[0] = uint8(EResource.Iron);
    data1.amounts[0] = amount1;
    P_ProductionData memory data2 = P_ProductionData(new uint8[](1), new uint256[](1));
    data2.resources[0] = uint8(EResource.Iron);
    data2.amounts[0] = amount2;
    P_ProductionData memory data3 = P_ProductionData(new uint8[](1), new uint256[](1));
    data3.resources[0] = uint8(EResource.Iron);
    data3.amounts[0] = amount3;

    P_Production.set(buildingPrototype, 1, data1);
    P_Production.set(buildingPrototype, 2, data2);
    P_Production.set(buildingPrototype, 3, data3);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    LibProduction.upgradeResourceProduction(buildingEntity, 1);
    assertEq(MaxResourceCount.get(spaceRockEntity, uint8(EResource.Iron)), amount1);
    LibProduction.upgradeResourceProduction(buildingEntity, 2);
    assertEq(MaxResourceCount.get(spaceRockEntity, uint8(EResource.Iron)), amount2);
    LibProduction.upgradeResourceProduction(buildingEntity, 3);
    assertEq(MaxResourceCount.get(spaceRockEntity, uint8(EResource.Iron)), amount3);

    assertEq(ProductionRate.get(buildingEntity, uint8(EResource.Iron)), 0);
  }

  function testClearResourceProductionUtility() public {
    P_IsUtility.set(uint8(EResource.Iron), true);
    LibProduction.clearResourceProduction(buildingEntity);
    uint256 startingAmount = 50;
    uint256 amountCleared = 20;
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Iron), startingAmount);
    ResourceCount.set(spaceRockEntity, uint8(EResource.Iron), startingAmount);
    P_ProductionData memory data1 = P_ProductionData(new uint8[](1), new uint256[](1));
    data1.resources[0] = uint8(EResource.Iron);
    data1.amounts[0] = amountCleared;

    P_Production.set(buildingPrototype, level, data1);

    LibProduction.clearResourceProduction(buildingEntity);
    assertEq(
      MaxResourceCount.get(spaceRockEntity, uint8(EResource.Iron)),
      startingAmount - amountCleared,
      "max resource count not as expected"
    );
    assertEq(
      ResourceCount.get(spaceRockEntity, uint8(EResource.Iron)),
      startingAmount - amountCleared,
      "resource count not as expected"
    );
  }

  function testClearResourceProductionNonUtility() public {
    uint256 startingAmount = 50;
    uint256 amountCleared = 20;
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ProductionRate.set(spaceRockEntity, uint8(EResource.Iron), 50);

    P_ProductionData memory data1 = P_ProductionData(new uint8[](1), new uint256[](1));
    data1.resources[0] = uint8(EResource.Iron);
    data1.amounts[0] = amountCleared;
    P_Production.set(buildingPrototype, level, data1);

    LibProduction.clearResourceProduction(buildingEntity);
    assertEq(ProductionRate.get(spaceRockEntity, uint8(EResource.Iron)), startingAmount - amountCleared);
  }
}
