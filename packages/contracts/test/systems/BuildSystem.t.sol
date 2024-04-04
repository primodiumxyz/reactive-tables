// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";
import { WorldResourceIdInstance, WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { AccessControl } from "@latticexyz/world/src/AccessControl.sol";

contract BuildSystemTest is PrimodiumTest {
  bytes32 playerEntity;

  function setUp() public override {
    super.setUp();
    // init other
    spawn(creator);
    spawn(bob);
    playerEntity = addressToEntity(creator);
    vm.startPrank(creator);
  }

  // todo: sort these tests. the first test should be a vanilla build system call

  function testBuildLargeBuilding() public {
    ResourceAccess.set(ROOT_NAMESPACE_ID, creator, true);

    Level.set(Home.get(playerEntity), 2);
    int32[] memory blueprint = get2x2Blueprint();
    bytes32[] memory keys = new bytes32[](1);
    keys[0] = IronMinePrototypeId;

    P_Blueprint.set(IronMinePrototypeId, blueprint);

    bytes32 buildingEntity = world.build(
      EBuilding.IronMine,
      getTilePosition(Home.get(playerEntity), EBuilding.IronMine)
    );

    PositionData memory buildingPosition = Position.get(buildingEntity);
    logPosition(buildingPosition);
    bytes32[] memory children = Children.get(buildingEntity);
    assertEq(blueprint.length, children.length * 2);

    for (uint256 i = 0; i < children.length; i++) {
      PositionData memory tilePosition = Position.get(children[i]);
      assertEq(
        tilePosition,
        PositionData(
          blueprint[i * 2] + buildingPosition.x,
          blueprint[i * 2 + 1] + buildingPosition.y,
          buildingPosition.parent
        )
      );
      assertEq(buildingEntity, OwnedBy.get(children[i]));
    }
  }

  function testInvalidIndexFail() public {
    PositionData memory ironPositionData = getTilePosition(Home.get(playerEntity), EBuilding.IronMine);

    vm.expectRevert(bytes("[BuildSystem] Invalid building type"));
    world.build(EBuilding.LENGTH, ironPositionData);
  }

  function testFailIronMineOnNonIron() public {
    PositionData memory ironPositionData = getTilePosition(Home.get(playerEntity), EBuilding.IronPlateFactory);

    world.build(EBuilding.IronMine, ironPositionData);
  }

  function testSameXYCanCollide() public {
    PositionData memory ironPositionData = getTilePosition(Home.get(playerEntity), EBuilding.IronMine);
    world.build(EBuilding.IronMine, ironPositionData);
    vm.stopPrank();

    vm.startPrank(bob);
    ironPositionData.parent = Home.get(addressToEntity(bob));
    world.build(EBuilding.IronMine, ironPositionData);
  }

  function testSameXYZCannotCollideFail() public {
    PositionData memory ironPositionData = getTilePosition(Home.get(playerEntity), EBuilding.IronMine);
    removeRequirements(EBuilding.IronMine);
    world.build(EBuilding.IronMine, ironPositionData);

    vm.expectRevert(bytes("[BuildSystem] Building already exists"));
    world.build(EBuilding.IronMine, ironPositionData);
  }

  function testBuiltOnWrongAsteroid() public {
    PositionData memory coord = getTilePosition(Home.get(addressToEntity(bob)), EBuilding.IronMine);

    vm.expectRevert(bytes("[BuildSystem] You can only build on an asteroid you control"));
    world.build(EBuilding.IronMine, coord);
  }

  function testBuildTwiceMainBaseFail() public {
    PositionData memory coord = getTilePosition(Home.get(playerEntity), EBuilding.MainBase);
    vm.expectRevert(bytes("[BuildSystem] Cannot build more than one main base per space rock"));
    world.build(EBuilding.MainBase, coord);
  }

  function testBuildMainBaseLevelNotMetFail() public {
    EBuilding building = EBuilding.AlloyFactory;
    P_RequiredResourcesData memory requiredResources = getBuildCost(building);
    provideResources(Home.get(playerEntity), requiredResources);

    PositionData memory position = getTilePosition(Home.get(playerEntity), building);
    vm.expectRevert(bytes("[BuildSystem] MainBase level requirement not met"));
    vm.prank(creator);
    world.build(building, position);
  }

  function testBuildMainBaseLevelMet() public {
    PositionData memory coord = getTilePosition(Home.get(playerEntity), EBuilding.IronMine);

    P_RequiredBaseLevel.set(IronMinePrototypeId, 0, 2);
    removeRequirements(EBuilding.IronMine);
    world.build(EBuilding.IronMine, coord);
  }

  function testIronMineOnNonIronFail() public {
    PositionData memory nonIronCoord = getTilePosition(Home.get(playerEntity), EBuilding.IronPlateFactory);

    vm.expectRevert(bytes("[BuildSystem] Cannot build on this tile"));
    world.build(EBuilding.IronMine, nonIronCoord);
  }

  function testBuildWithResourceReqs() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    world.build(EBuilding.IronMine, getTilePosition(spaceRockEntity, EBuilding.IronMine));
    bytes32 ironMinePrototype = P_EnumToPrototype.get(BuildingKey, uint8(EBuilding.IronMine));
    assertGe(
      P_RequiredResources.lengthResources(ironMinePrototype, 2),
      0,
      "Iron Mine Level 2 should have resource requirements"
    );
  }

  function testBuildWithRequiredResources() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, Iron, 100);
    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(IronMinePrototypeId, 1, requiredResourcesData);

    world.build(EBuilding.IronMine, getTilePosition(spaceRockEntity, EBuilding.IronMine));

    assertEq(ResourceCount.get(spaceRockEntity, Iron), 50);
  }

  function testBuildWithProductionDependencies() public {
    uint256 originalProduction = 100;
    uint256 productionReduction = 10;
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ProductionRate.set(spaceRockEntity, Iron, originalProduction);
    ConsumptionRate.set(spaceRockEntity, Iron, 0);
    P_RequiredDependencyData memory requiredDependenciesData = P_RequiredDependencyData(
      uint8(Iron),
      productionReduction
    );

    P_RequiredDependency.set(IronMinePrototypeId, 1, requiredDependenciesData);

    world.build(EBuilding.IronMine, getTilePosition(spaceRockEntity, EBuilding.IronMine));
    uint256 productionIncrease = P_Production.getAmounts(IronMinePrototypeId, 1)[0];
    assertEq(ProductionRate.get(spaceRockEntity, Iron), originalProduction + productionIncrease);
    assertEq(ConsumptionRate.get(spaceRockEntity, Iron), productionReduction);
  }

  function testBuildWithResourceProductionIncrease() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    uint256 increase = 69;
    P_ProductionData memory data1 = P_ProductionData(new uint8[](1), new uint256[](1));
    data1.resources[0] = uint8(EResource.Iron);
    data1.amounts[0] = increase;
    P_Production.set(IronMinePrototypeId, 1, data1);

    world.build(EBuilding.IronMine, getTilePosition(spaceRockEntity, EBuilding.IronMine));
    assertEq(ProductionRate.get(spaceRockEntity, Iron), increase);
  }

  function testBuildWithMaxStorageIncrease() public {
    uint8[] memory data = new uint8[](1);
    data[0] = uint8(Iron);
    P_ListMaxResourceUpgrades.set(IronMinePrototypeId, 1, data);
    P_ByLevelMaxResourceUpgrades.set(IronMinePrototypeId, Iron, 1, 50);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, Iron, 0);
    world.build(EBuilding.IronMine, getTilePosition(spaceRockEntity, EBuilding.IronMine));
    assertEq(MaxResourceCount.get(spaceRockEntity, Iron), 50);
  }
}
