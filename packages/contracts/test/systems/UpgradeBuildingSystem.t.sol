// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";

contract UpgradeBuildingSystemTest is PrimodiumTest {
  bytes32 playerEntity;
  bytes32 rock;

  function setUp() public override {
    super.setUp();
    spawn(creator);
    playerEntity = addressToEntity(creator);
    rock = Home.get(playerEntity);
    vm.startPrank(creator);
  }

  function testUpgradeMaxedBuildingFail() public {
    PositionData memory coord = getTilePosition(rock, EBuilding.IronMine);
    bytes32 ironMine = world.build(EBuilding.IronMine, coord);
    uint256 ironMineMaxLevel = P_MaxLevel.get(IronMinePrototypeId);

    Level.set(ironMine, ironMineMaxLevel);

    vm.expectRevert(bytes("[UpgradeBuildingSystem] Building has reached max level"));
    world.upgradeBuilding(coord);
    vm.stopPrank();
  }

  function testUpgradeToMaxLevel() public {
    removeRequiredResources(EBuilding.IronMine);
    removeRequiredMainBase(EBuilding.IronMine);
    uint256 ironMineMaxLevel = P_MaxLevel.get(IronMinePrototypeId);
    PositionData memory coord = getTilePosition(rock, EBuilding.IronMine);
    world.build(EBuilding.IronMine, coord);
    for (uint256 i = 1; i < ironMineMaxLevel; i++) {
      assertEq(Level.get(LibBuilding.getBuildingFromCoord(coord)), i, "building should be level i");
      world.upgradeBuilding(coord);
    }

    vm.stopPrank();
  }

  function testUpgradeBuildingFailRequiredMainBase() public {
    PositionData memory coord = getTilePosition(rock, EBuilding.IronMine);
    bytes32 building = world.build(EBuilding.IronMine, coord);
    upgradeBuilding(creator, building);
    upgradeBuilding(creator, building);
  }

  function testUpgradeBuildingWithRequiredResources() public {
    uint256 initial = 100;
    uint256 l1 = 50;
    uint256 l2 = 33;
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, Iron, initial);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = l1;
    P_RequiredResources.set(IronMinePrototypeId, 1, requiredResourcesData);
    requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = l2;

    P_RequiredResources.set(IronMinePrototypeId, 2, requiredResourcesData);

    switchPrank(creator);
    PositionData memory coord = getTilePosition(rock, EBuilding.IronMine);
    world.build(EBuilding.IronMine, coord);
    world.upgradeBuilding(coord);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), initial - l1 - l2);
  }

  function testUpgradeInactiveBuildingWithRequiredResources() public {
    uint256 initial = 100;
    uint256 l1 = 50;
    uint256 l2 = 33;
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, Iron, initial);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = l1;
    P_RequiredResources.set(IronMinePrototypeId, 1, requiredResourcesData);
    requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = l2;

    P_RequiredResources.set(IronMinePrototypeId, 2, requiredResourcesData);

    switchPrank(creator);
    PositionData memory coord = getTilePosition(rock, EBuilding.IronMine);
    world.build(EBuilding.IronMine, coord);
    world.toggleBuilding(coord);
    world.upgradeBuilding(coord);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), initial - l1 - l2);
  }

  function testUpgradeBuildingWithProductionDependencies() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, Iron, 1000);

    removeRequiredResources(EBuilding.IronMine);

    uint256 originalProduction = 100;
    uint256 l1 = 10;
    uint256 l2 = 12;
    ProductionRate.set(spaceRockEntity, Copper, originalProduction);

    P_RequiredDependencyData memory requiredDependenciesData = P_RequiredDependencyData(uint8(Copper), l1);
    P_RequiredDependency.set(IronMinePrototypeId, 1, requiredDependenciesData);

    requiredDependenciesData = P_RequiredDependencyData(uint8(Copper), l2);
    P_RequiredDependency.set(IronMinePrototypeId, 2, requiredDependenciesData);

    switchPrank(creator);
    PositionData memory coord = getTilePosition(rock, EBuilding.IronMine);
    world.build(EBuilding.IronMine, coord);
    world.upgradeBuilding(coord);

    assertEq(ProductionRate.get(spaceRockEntity, Copper), originalProduction);
    assertEq(ConsumptionRate.get(spaceRockEntity, Copper), l2);
  }

  function testUpgradeInactiveBuildingWithProductionDependencies() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, Iron, 1000);

    removeRequiredResources(EBuilding.IronMine);

    uint256 originalProduction = 100;
    uint256 l1 = 10;
    uint256 l2 = 12;
    ProductionRate.set(spaceRockEntity, Copper, originalProduction);

    P_RequiredDependencyData memory requiredDependenciesData = P_RequiredDependencyData(uint8(Copper), l1);
    P_RequiredDependency.set(IronMinePrototypeId, 1, requiredDependenciesData);

    requiredDependenciesData = P_RequiredDependencyData(uint8(Copper), l2);
    P_RequiredDependency.set(IronMinePrototypeId, 2, requiredDependenciesData);

    switchPrank(creator);
    PositionData memory coord = getTilePosition(rock, EBuilding.IronMine);
    world.build(EBuilding.IronMine, coord);
    world.toggleBuilding(coord);

    world.upgradeBuilding(coord);

    assertEq(ProductionRate.get(spaceRockEntity, Copper), originalProduction);
    assertEq(ConsumptionRate.get(spaceRockEntity, Copper), 0);
  }

  function testUpgradeBuildingWithResourceProductionIncrease() public {
    removeRequiredResources(EBuilding.IronMine);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    uint256 increase = 69;
    uint256 increase2 = 71;
    P_ProductionData memory data1 = P_ProductionData(new uint8[](1), new uint256[](1));
    data1.resources[0] = uint8(EResource.Iron);
    data1.amounts[0] = increase;
    P_Production.set(IronMinePrototypeId, 1, data1);

    data1 = P_ProductionData(new uint8[](1), new uint256[](1));
    data1.resources[0] = uint8(EResource.Iron);
    data1.amounts[0] = increase2;
    P_Production.set(IronMinePrototypeId, 2, data1);

    switchPrank(creator);

    PositionData memory coord = getTilePosition(rock, EBuilding.IronMine);
    world.build(EBuilding.IronMine, coord);
    world.upgradeBuilding(coord);
    assertEq(ProductionRate.get(spaceRockEntity, Iron), increase2);
  }

  function testUpgradeInActiveBuildingWithResourceProductionIncrease() public {
    removeRequiredResources(EBuilding.IronMine);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    uint256 increase = 69;
    uint256 increase2 = 71;
    P_ProductionData memory data1 = P_ProductionData(new uint8[](1), new uint256[](1));
    data1.resources[0] = uint8(EResource.Iron);
    data1.amounts[0] = increase;
    P_Production.set(IronMinePrototypeId, 1, data1);

    data1 = P_ProductionData(new uint8[](1), new uint256[](1));
    data1.resources[0] = uint8(EResource.Iron);
    data1.amounts[0] = increase2;
    P_Production.set(IronMinePrototypeId, 2, data1);

    switchPrank(creator);

    PositionData memory coord = getTilePosition(rock, EBuilding.IronMine);
    world.build(EBuilding.IronMine, coord);
    world.toggleBuilding(coord);

    uint256 gas = gasleft();
    world.upgradeBuilding(coord);
    console.log("used ", gas - gasleft());
    assertEq(ProductionRate.get(spaceRockEntity, Iron), 0);
  }
  function testUpgradeMainBase() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    bytes32 mainBase = Home.get(spaceRockEntity);

    P_RequiredResourcesData memory requiredResources = P_RequiredResources.get(MainBasePrototypeId, 2);
    provideResources(spaceRockEntity, requiredResources);

    vm.startPrank(creator);
    uint256 gas = gasleft();
    world.upgradeBuilding(Position.get(mainBase));
    console.log("after", gas - gasleft());
  }

  function testUpgradeBuildingWithMaxStorageIncrease() public {
    removeRequiredResources(EBuilding.IronMine);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    uint8[] memory data = new uint8[](1);
    data[0] = uint8(Iron);
    P_ListMaxResourceUpgrades.set(IronMinePrototypeId, 1, data);
    P_ListMaxResourceUpgrades.set(IronMinePrototypeId, 2, data);
    P_ByLevelMaxResourceUpgrades.set(IronMinePrototypeId, Iron, 1, 50);
    P_ByLevelMaxResourceUpgrades.set(IronMinePrototypeId, Iron, 2, 100);
    MaxResourceCount.set(spaceRockEntity, Iron, 0);
    switchPrank(creator);
    PositionData memory coord = getTilePosition(rock, EBuilding.IronMine);
    world.build(EBuilding.IronMine, coord);
    uint256 gas = gasleft();
    world.upgradeBuilding(coord);
    console.log("after", gas - gasleft());

    assertEq(MaxResourceCount.get(spaceRockEntity, Iron), 100);
  }

  function testUpgradeInActiveBuildingWithMaxStorageIncrease() public {
    removeRequiredResources(EBuilding.IronMine);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    uint8[] memory data = new uint8[](1);
    data[0] = uint8(Iron);
    P_ListMaxResourceUpgrades.set(IronMinePrototypeId, 1, data);
    P_ListMaxResourceUpgrades.set(IronMinePrototypeId, 2, data);
    P_ByLevelMaxResourceUpgrades.set(IronMinePrototypeId, Iron, 1, 50);
    P_ByLevelMaxResourceUpgrades.set(IronMinePrototypeId, Iron, 2, 100);
    MaxResourceCount.set(spaceRockEntity, Iron, 0);
    switchPrank(creator);
    PositionData memory coord = getTilePosition(rock, EBuilding.IronMine);
    world.build(EBuilding.IronMine, coord);
    world.toggleBuilding(coord);

    world.upgradeBuilding(coord);
    assertEq(MaxResourceCount.get(spaceRockEntity, Iron), 0);
  }
}
