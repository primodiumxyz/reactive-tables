// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";
import { LibFleetCombat } from "libraries/fleet/LibFleetCombat.sol";

contract LibUnitTest is PrimodiumTest {
  bytes32 player;

  bytes32 unit = "unit";
  bytes32 unitPrototype = "unitPrototype";

  bytes32 unit2 = "unit2";
  bytes32 unitPrototype2 = "unitPrototype2";

  bytes32 building = "building";
  bytes32 buildingPrototype = "buildingPrototype";

  bytes32 building2 = "building2";
  bytes32 rock = "rock";

  function setUp() public override {
    super.setUp();
    vm.startPrank(creator);
    player = addressToEntity(creator);
    world.spawn();

    BuildingType.set(building, buildingPrototype);
    OwnedBy.set(Home.get(player), player);
    OwnedBy.set(building, Home.get(player));
    OwnedBy.set(building2, Home.get(player));
    BuildingType.set(building2, buildingPrototype);
    P_GameConfigData memory config = P_GameConfig.get();
    config.unitProductionRate = 100;
    P_GameConfig.set(config);
  }

  function testCanProduceUnit() public {
    bytes32[] memory unitPrototypes = new bytes32[](1);
    unitPrototypes[0] = unitPrototype;
    P_UnitProdTypes.set(buildingPrototype, 0, unitPrototypes);
    assertTrue(LibUnit.canProduceUnit(buildingPrototype, 0, unitPrototype));
  }

  function testCanProduceUnitInvalidBuilding() public {
    assertFalse(LibUnit.canProduceUnit(bytes32(0), 0, unitPrototype));
  }

  function testCanProduceUnitInvalidUnit() public {
    assertFalse(LibUnit.canProduceUnit(building, 0, bytes32(0)));
  }

  function testClaimUnits() public {
    Level.set(building, 1);
    LastClaimedAt.set(building, block.timestamp);
    P_UnitProdMultiplier.set(buildingPrototype, 1, 100);

    Level.set(building2, 1);
    LastClaimedAt.set(building2, block.timestamp);

    UnitFactorySet.add(Home.get(player), building);
    UnitFactorySet.add(Home.get(player), building2);

    P_Unit.setTrainingTime(unitPrototype, 0, 1);
    QueueItemUnitsData memory item = QueueItemUnitsData(unitPrototype, 100);
    UnitProductionQueue.enqueue(building, item);
    UnitProductionQueue.enqueue(building2, item);

    bytes32[] memory buildings = UnitFactorySet.getAll(Home.get(player));
    console.log("buildings", buildings.length);
    for (uint256 i = 0; i < buildings.length; i++) {
      bytes32 building = buildings[i];
      bytes32 asteroid = OwnedBy.get(building);
      console.log("building owner: %x", uint256(asteroid));
      console.log("is asteroid:", Asteroid.getIsAsteroid(asteroid));
    }
    vm.warp(block.timestamp + 100);
    LibUnit.claimUnits(Home.get(player));
    assertEq(UnitCount.get(Home.get(player), unitPrototype), 200);
  }

  function testClaimUnitsConqueredAsteroid() public {
    PositionData memory position = Position.get(Home.get(player));

    bytes32 secondaryAsteroid = LibAsteroid.createSecondaryAsteroid(findSecondaryAsteroid(player, Home.get(player)));
    conquerAsteroid(creator, Home.get(player), secondaryAsteroid);
    vm.startPrank(creator);
    console.log("here:");
    OwnedBy.set(building, secondaryAsteroid);
    Level.set(building, 1);
    LastClaimedAt.set(building, block.timestamp);
    P_UnitProdMultiplier.set(buildingPrototype, 1, 100);

    UnitFactorySet.add(secondaryAsteroid, building);

    P_Unit.setTrainingTime(unitPrototype, 0, 1);
    QueueItemUnitsData memory item = QueueItemUnitsData(unitPrototype, 100);
    UnitProductionQueue.enqueue(building, item);
    UnitProductionQueue.enqueue(building2, item);

    bytes32[] memory buildings = UnitFactorySet.getAll(secondaryAsteroid);
    console.log("buildings", buildings.length);
    for (uint256 i = 0; i < buildings.length; i++) {
      bytes32 building = buildings[i];
      bytes32 asteroid = OwnedBy.get(building);
      console.log("building owner: %x", uint256(asteroid));
      console.log("is asteroid:", Asteroid.getIsAsteroid(asteroid));
    }
    vm.warp(block.timestamp + 100);
    LibUnit.claimUnits(secondaryAsteroid);
    assertEq(UnitCount.get(secondaryAsteroid, unitPrototype), 100);
  }

  function testClaimBuildingUnitsSingleAll() public {
    Level.set(building, 1);
    LastClaimedAt.set(building, block.timestamp);
    P_UnitProdMultiplier.set(buildingPrototype, 1, 100);
    P_Unit.setTrainingTime(unitPrototype, 0, 1);
    QueueItemUnitsData memory item = QueueItemUnitsData(unitPrototype, 100);
    UnitProductionQueue.enqueue(building, item);
    vm.warp(block.timestamp + 100);
    LibUnit.claimBuildingUnits(building);
    assertEq(UnitCount.get(Home.get(player), unitPrototype), 100);
    assertTrue(UnitProductionQueue.isEmpty(building));
  }

  function testClaimBuildingUnitsSinglePart() public {
    Level.set(building, 1);
    LastClaimedAt.set(building, block.timestamp);
    P_UnitProdMultiplier.set(buildingPrototype, 1, 100);
    P_Unit.setTrainingTime(unitPrototype, 0, 1);
    QueueItemUnitsData memory item = QueueItemUnitsData(unitPrototype, 100);
    UnitProductionQueue.enqueue(building, item);
    vm.warp(block.timestamp + 25);
    LibUnit.claimBuildingUnits(building);
    assertEq(UnitCount.get(Home.get(player), unitPrototype), 25);
    assertEq(UnitProductionQueue.peek(building).quantity, 75);
    assertFalse(UnitProductionQueue.isEmpty(building));
  }

  function testClaimBuildingUnitsDouble() public {
    Level.set(building, 1);
    LastClaimedAt.set(building, block.timestamp);
    P_UnitProdMultiplier.set(buildingPrototype, 1, 100);

    P_Unit.setTrainingTime(unitPrototype, 0, 1);
    QueueItemUnitsData memory item = QueueItemUnitsData(unitPrototype, 100);
    UnitProductionQueue.enqueue(building, item);

    P_Unit.setTrainingTime(unitPrototype2, 0, 1);
    QueueItemUnitsData memory item2 = QueueItemUnitsData(unitPrototype2, 100);
    UnitProductionQueue.enqueue(building, item2);

    vm.warp(block.timestamp + 1000);
    LibUnit.claimBuildingUnits(building);
    assertEq(UnitCount.get(Home.get(player), unitPrototype), 100, "unit count does not match");
    assertEq(UnitCount.get(Home.get(player), unitPrototype2), 100, "unit 2 count does not match");
    assertTrue(UnitProductionQueue.isEmpty(building), "queue should be empty");
  }

  function testClaimBuildingUnitsDoublePart() public {
    Level.set(building, 1);
    LastClaimedAt.set(building, block.timestamp);
    P_UnitProdMultiplier.set(buildingPrototype, 1, 100);

    P_Unit.setTrainingTime(unitPrototype, 0, 1);
    QueueItemUnitsData memory item = QueueItemUnitsData(unitPrototype, 100);
    UnitProductionQueue.enqueue(building, item);

    P_Unit.setTrainingTime(unitPrototype2, 0, 1);
    QueueItemUnitsData memory item2 = QueueItemUnitsData(unitPrototype2, 100);
    UnitProductionQueue.enqueue(building, item2);

    vm.warp(block.timestamp + 25);
    LibUnit.claimBuildingUnits(building);
    assertEq(UnitCount.get(Home.get(player), unitPrototype), 25);
    assertEq(UnitProductionQueue.peek(building).quantity, 75);
    assertFalse(UnitProductionQueue.isEmpty(building));

    vm.warp(block.timestamp + 76);
    LibUnit.claimBuildingUnits(building);
    assertEq(UnitCount.get(Home.get(player), unitPrototype), 100);
    assertEq(UnitCount.get(Home.get(player), unitPrototype2), 1);
    assertEq(toString(UnitProductionQueue.peek(building).unitId), toString(unitPrototype2));
    assertEq(UnitProductionQueue.peek(building).quantity, 99);
    assertFalse(UnitProductionQueue.isEmpty(building));

    vm.warp(block.timestamp + 100);
    LibUnit.claimBuildingUnits(building);
    assertEq(UnitCount.get(Home.get(player), unitPrototype), 100);
    assertEq(UnitCount.get(Home.get(player), unitPrototype2), 100);
    assertTrue(UnitProductionQueue.isEmpty(building));
  }

  function testClaimUnitsOffset() public {
    Level.set(building, 1);
    LastClaimedAt.set(building, block.timestamp);
    P_UnitProdMultiplier.set(buildingPrototype, 1, 100);

    P_Unit.setTrainingTime(unitPrototype, 0, 100);
    QueueItemUnitsData memory item = QueueItemUnitsData(unitPrototype, 100);
    UnitProductionQueue.enqueue(building, item);

    vm.warp(block.timestamp + 25);
    LibUnit.claimBuildingUnits(building);
    assertEq(ClaimOffset.get(building), 25, "offset 1 should be 25");
    assertEq(UnitProductionQueue.peek(building).quantity, 100, "queue should have 100 units");

    vm.warp(block.timestamp + 50);
    LibUnit.claimBuildingUnits(building);
    assertEq(ClaimOffset.get(building), 75, "offset 2 should be 75");
    assertEq(UnitProductionQueue.peek(building).quantity, 100, "queue should have 100 units");

    vm.warp(block.timestamp + 50);
    LibUnit.claimBuildingUnits(building);
    assertEq(ClaimOffset.get(building), 25, "offset 3 should be 25");
    assertEq(UnitProductionQueue.peek(building).quantity, 99, "queue should have 99 units");

    vm.warp(block.timestamp + 174);
    LibUnit.claimBuildingUnits(building);
    assertEq(ClaimOffset.get(building), 99, "offset 3 should be 25");
    assertEq(UnitProductionQueue.peek(building).quantity, 98, "queue should have 98 units");
  }

  function testClaimUnitsClearOffset() public {
    Level.set(building, 1);
    LastClaimedAt.set(building, block.timestamp);
    P_UnitProdMultiplier.set(buildingPrototype, 1, 100);

    P_Unit.setTrainingTime(unitPrototype, 0, 10);
    QueueItemUnitsData memory item = QueueItemUnitsData(unitPrototype, 10);
    UnitProductionQueue.enqueue(building, item);

    vm.warp(block.timestamp + 25);
    LibUnit.claimBuildingUnits(building);
    assertEq(ClaimOffset.get(building), 5, "offset 1 should be 5");
    assertEq(UnitProductionQueue.peek(building).quantity, 8, "queue should have 8 units");

    vm.warp(block.timestamp + 50);
    LibUnit.claimBuildingUnits(building);
    assertEq(ClaimOffset.get(building), 5, "offset 2 should be 5");
    assertEq(UnitProductionQueue.peek(building).quantity, 3, "queue should have 3 units");

    vm.warp(block.timestamp + 135);
    LibUnit.claimBuildingUnits(building);
    assertEq(ClaimOffset.get(building), 0, "offset 3 should be 0");
    assertEq(UnitCount.get(Home.get(player), unitPrototype), 10);
  }

  function testClaimMultipleUnitsClearOffset() public {
    Level.set(building, 1);
    LastClaimedAt.set(building, block.timestamp);
    P_UnitProdMultiplier.set(buildingPrototype, 1, 100);

    P_Unit.setTrainingTime(unitPrototype, 0, 10);
    QueueItemUnitsData memory item = QueueItemUnitsData(unitPrototype, 10);
    UnitProductionQueue.enqueue(building, item);
    UnitProductionQueue.enqueue(building, item);

    vm.warp(block.timestamp + 125);
    LibUnit.claimBuildingUnits(building);
    assertEq(ClaimOffset.get(building), 5, "offset 1 should be 5");
    assertEq(UnitProductionQueue.peek(building).quantity, 8, "queue should have 8 units");
    assertEq(UnitCount.get(Home.get(player), unitPrototype), 12);

    vm.warp(block.timestamp + 135);
    LibUnit.claimBuildingUnits(building);
    assertEq(ClaimOffset.get(building), 0, "offset 2 should be 0");
    assertEq(UnitCount.get(Home.get(player), unitPrototype), 20);

    UnitProductionQueue.enqueue(building, item);
    UnitProductionQueue.enqueue(building, item);

    vm.warp(block.timestamp + 203);
    LibUnit.claimBuildingUnits(building);
    assertEq(ClaimOffset.get(building), 0, "offset 2 should be 0");
    assertEq(UnitCount.get(Home.get(player), unitPrototype), 40);
    assertTrue(UnitProductionQueue.isEmpty(building));
  }

  function testGetUnitBuildTime() public {
    P_UnitProdMultiplier.set(buildingPrototype, 1, 100);
    P_Unit.setTrainingTime(unitPrototype, 0, 100);
    Level.set(building, 1);
    assertEq(LibUnit.getUnitBuildTime(building, unitPrototype), 100);

    P_UnitProdMultiplier.set(buildingPrototype, 1, 50);
    P_Unit.setTrainingTime(unitPrototype, 0, 100);
    Level.set(building, 1);
    assertEq(LibUnit.getUnitBuildTime(building, unitPrototype), 200);

    P_UnitProdMultiplier.set(buildingPrototype, 1, 100);
    P_Unit.setTrainingTime(unitPrototype, 0, 200);
    Level.set(building, 1);
    assertEq(LibUnit.getUnitBuildTime(building, unitPrototype), 200);
  }

  function testincreaseUnitCount() public {
    UnitCount.set(Home.get(player), unit, 50);
    P_GameConfig.setUnitProductionRate(100);
    QueueItemUnitsData memory item = QueueItemUnitsData(unit, 100);
    UnitProductionQueue.enqueue(building, item);
    LibUnit.increaseUnitCount(Home.get(player), unit, 100, false);
    assertEq(UnitCount.get(Home.get(player), unit), 150);
  }

  function testUpdateStoredUtilitiesAdd() public {
    P_IsUtility.set(Iron, true);
    LibProduction.increaseResourceProduction(player, EResource(Iron), 100);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(unit, 0, requiredResourcesData);

    LibUnit.updateStoredUtilities(player, unit, 2, true);
    assertEq(ResourceCount.get(player, Iron), 0);
  }

  function testUpdateStoredUtilitiesNotUtility() public {
    LibProduction.increaseResourceProduction(player, EResource(Iron), 100);
    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(unit, 0, requiredResourcesData);

    LibUnit.updateStoredUtilities(player, unit, 2, true);
    assertEq(ResourceCount.get(player, Iron), 0);
  }

  function testFailUpdateStoredUtilitiesNoSpace() public {
    P_IsUtility.set(Iron, true);
    MaxResourceCount.set(player, Iron, 100);
    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(unit, 0, requiredResourcesData);

    LibUnit.updateStoredUtilities(player, unit, 3, true);
  }

  function testUpdateStoredUtilitiesSubtract() public {
    P_IsUtility.set(Iron, true);

    LibProduction.increaseResourceProduction(player, EResource(Iron), 100);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 33;
    P_RequiredResources.set(unit, 0, requiredResourcesData);
    LibUnit.updateStoredUtilities(player, unit, 3, true);
    LibUnit.updateStoredUtilities(player, unit, 2, false);
    assertEq(ResourceCount.get(player, Iron), 67);
  }

  function testFailUpdateStoredUtilitiesSubtractOverflow() public {
    P_IsUtility.set(Iron, true);
    LibProduction.increaseResourceProduction(player, EResource(Iron), 100);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 33;
    P_RequiredResources.set(unit, 0, requiredResourcesData);

    LibUnit.updateStoredUtilities(player, unit, 10, false);
  }

  function testDecreaseUnitCount() public {
    UnitCount.set(rock, unit, 100);
    LibUnit.decreaseUnitCount(rock, unit, 50, false);
    assertEq(UnitCount.get(rock, unit), 50);

    LibUnit.decreaseUnitCount(rock, unit, 50, false);
    assertEq(UnitCount.get(rock, unit), 0);
  }
}
