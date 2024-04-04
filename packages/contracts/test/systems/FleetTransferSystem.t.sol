// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;
import "test/PrimodiumTest.t.sol";

contract FleetTransferSystemTest is PrimodiumTest {
  bytes32 aliceHomeSpaceRock;
  bytes32 aliceEntity;

  bytes32 bobHomeSpaceRock;
  bytes32 bobEntity;

  function setUp() public override {
    super.setUp();
    aliceEntity = addressToEntity(alice);
    aliceHomeSpaceRock = spawn(alice);

    bobEntity = addressToEntity(bob);
    bobHomeSpaceRock = spawn(bob);
  }

  function testTransferResourcesAndUnitsFleetToFleet() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 2;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    increaseResource(aliceHomeSpaceRock, EResource.U_MaxFleets, 1);
    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 secondFleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 1;
    }

    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 1;
    }

    vm.startPrank(alice);
    world.transferUnitsAndResourcesFromFleetToFleet(fleetId, secondFleetId, unitCounts, resourceCounts);
    vm.stopPrank();

    assertEq(UnitCount.get(fleetId, unitPrototype), 1, "fleet unit count doesn't match");
    assertEq(UnitCount.get(secondFleetId, unitPrototype), 3, "space rock unit count doesn't match");
    assertEq(ResourceCount.get(fleetId, uint8(EResource.Iron)), 1, "fleet resource count doesn't match");
    assertEq(ResourceCount.get(secondFleetId, uint8(EResource.Iron)), 3, "fleet resource count doesn't match");

    P_RequiredResourcesData memory requiredResources = P_RequiredResources.get(
      unitPrototype,
      UnitLevel.get(aliceHomeSpaceRock, unitPrototype)
    );
    for (uint256 i = 0; i < requiredResources.resources.length; i++) {
      if (P_IsUtility.get(requiredResources.resources[i]))
        assertEq(
          ResourceCount.get(aliceHomeSpaceRock, requiredResources.resources[i]),
          0,
          "no utility should be refunded when transfer is between same owner fleets"
        );
    }
    assertEq(
      ResourceCount.get(aliceHomeSpaceRock, uint8(EResource.Iron)),
      0,
      "space rock resource count doesn't match"
    );
  }

  function createCapitalShipFleet(address player) private returns (bytes32 fleetId) {
    bytes32 playerEntity = addressToEntity(player);

    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    uint256 numberOfUnits = 10;

    bytes32 capitalShipPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.CapitalShip));

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == CapitalShipPrototypeId) unitCounts[i] = 1;
    }

    bytes32 homeRock = Home.get(playerEntity);
    //provide resource and unit requirements to create fleet
    setupCreateFleet(player, homeRock, unitCounts, resourceCounts);

    vm.prank(player);
    fleetId = world.createFleet(homeRock, unitCounts, resourceCounts);
  }

  function testTransferCapitalShipBetweenPlayers() public {
    bytes32 aliceFleet = createCapitalShipFleet(alice);
    bytes32 bobFleet = createCapitalShipFleet(bob);

    vm.prank(creator);
    P_GameConfig.setWorldSpeed(100);
    vm.prank(alice);
    world.sendFleet(aliceFleet, bobHomeSpaceRock);
    console.log("aliceFleet arrival time", FleetMovement.getArrivalTime(aliceFleet));
    vm.warp(block.timestamp + 10000000);

    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == CapitalShipPrototypeId) unitCounts[i] = 1;
    }

    vm.startPrank(alice);
    vm.expectRevert("[Fleet] Cannot transfer capital ships to other players");
    world.transferUnitsFromFleetToFleet(aliceFleet, bobFleet, unitCounts);

    vm.expectRevert("[Fleet] Cannot transfer capital ships to other players");
    world.transferUnitsFromFleetToSpaceRock(aliceFleet, bobHomeSpaceRock, unitCounts);

    vm.expectRevert("[Fleet] Cannot transfer capital ships to other players");
    world.transferUnitsAndResourcesFromFleetToSpaceRock(aliceFleet, bobHomeSpaceRock, unitCounts, resourceCounts);

    vm.expectRevert("[Fleet] Cannot transfer capital ships to other players");
    world.transferUnitsAndResourcesFromFleetToFleet(aliceFleet, bobFleet, unitCounts, resourceCounts);
  }

  function testFailTransferResourcesAndUnitsFleetToFleetNotInSameOrbit() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 2;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    increaseResource(aliceHomeSpaceRock, EResource.U_MaxFleets, 1);
    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 secondFleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    world.sendFleet(secondFleetId, bobHomeSpaceRock);
    vm.stopPrank();

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 1;
    }

    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 1;
    }

    vm.startPrank(alice);
    world.transferUnitsAndResourcesFromFleetToFleet(fleetId, secondFleetId, unitCounts, resourceCounts);
    vm.stopPrank();
  }

  function testTransferResourcesFleetToFleet() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 2;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    increaseResource(aliceHomeSpaceRock, EResource.U_MaxFleets, 1);
    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 secondFleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 1;
    }

    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 1;
    }

    vm.startPrank(alice);
    world.transferResourcesFromFleetToFleet(fleetId, secondFleetId, resourceCounts);
    vm.stopPrank();

    assertEq(UnitCount.get(fleetId, unitPrototype), 2, "fleet unit count doesn't match");
    assertEq(UnitCount.get(secondFleetId, unitPrototype), 2, "space rock unit count doesn't match");
    assertEq(ResourceCount.get(fleetId, uint8(EResource.Iron)), 1, "fleet resource count doesn't match");
    assertEq(ResourceCount.get(secondFleetId, uint8(EResource.Iron)), 3, "fleet resource count doesn't match");

    P_RequiredResourcesData memory requiredResources = P_RequiredResources.get(
      unitPrototype,
      UnitLevel.get(aliceHomeSpaceRock, unitPrototype)
    );
    for (uint256 i = 0; i < requiredResources.resources.length; i++) {
      if (P_IsUtility.get(requiredResources.resources[i]))
        assertEq(
          ResourceCount.get(aliceHomeSpaceRock, requiredResources.resources[i]),
          0,
          "no utility should be refunded when transfer is between same owner fleets"
        );
    }
    assertEq(
      ResourceCount.get(aliceHomeSpaceRock, uint8(EResource.Iron)),
      0,
      "space rock resource count doesn't match"
    );
  }

  function testFailTransferResourcesFleetToFleetNotInSameOrbit() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 2;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    increaseResource(aliceHomeSpaceRock, EResource.U_MaxFleets, 1);
    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 secondFleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    world.sendFleet(secondFleetId, bobHomeSpaceRock);
    vm.stopPrank();

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 0;
    }

    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 1;
    }

    vm.startPrank(alice);
    world.transferResourcesFromFleetToFleet(fleetId, secondFleetId, resourceCounts);
    vm.stopPrank();
  }

  function testFailTransferUnitsFleetToFleetNotInSameOrbit() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 2;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    increaseResource(aliceHomeSpaceRock, EResource.U_MaxFleets, 1);
    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 secondFleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    world.sendFleet(secondFleetId, bobHomeSpaceRock);
    vm.stopPrank();

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 1;
    }

    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 0;
    }

    vm.startPrank(alice);
    world.transferUnitsFromFleetToFleet(fleetId, secondFleetId, unitCounts);
    vm.stopPrank();
  }

  function testTransferResourcesAndUnitsFleetToSpaceRock() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 2;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 1;
    }

    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 1;
    }

    vm.startPrank(alice);
    world.transferUnitsAndResourcesFromFleetToSpaceRock(fleetId, aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    assertEq(UnitCount.get(fleetId, unitPrototype), 1, "fleet unit count doesn't match");
    assertEq(UnitCount.get(aliceHomeSpaceRock, unitPrototype), 1, "space rock unit count doesn't match");
    assertEq(ResourceCount.get(fleetId, uint8(EResource.Iron)), 1, "fleet resource count doesn't match");
    assertEq(ResourceCount.get(aliceHomeSpaceRock, uint8(EResource.Iron)), 1, "fleet resource count doesn't match");

    P_RequiredResourcesData memory requiredResources = P_RequiredResources.get(
      unitPrototype,
      UnitLevel.get(aliceHomeSpaceRock, unitPrototype)
    );
    for (uint256 i = 0; i < requiredResources.resources.length; i++) {
      if (P_IsUtility.get(requiredResources.resources[i]))
        assertEq(
          ResourceCount.get(aliceHomeSpaceRock, requiredResources.resources[i]),
          0,
          "no utility should be refunded when transfer is between same owner fleets"
        );
    }
  }

  function testTransferResourcesAndUnitsSpaceRockToFleet() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 2;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 1;
    }

    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 1;
    }

    trainUnits(alice, EUnit.MinutemanMarine, 1, true);
    increaseResource(aliceHomeSpaceRock, EResource.Iron, 1);

    vm.startPrank(alice);
    world.transferUnitsAndResourcesFromSpaceRockToFleet(aliceHomeSpaceRock, fleetId, unitCounts, resourceCounts);
    vm.stopPrank();

    assertEq(UnitCount.get(fleetId, unitPrototype), 3, "fleet unit count doesn't match");
    assertEq(UnitCount.get(aliceHomeSpaceRock, unitPrototype), 0, "space rock unit count doesn't match");
    assertEq(ResourceCount.get(fleetId, uint8(EResource.Iron)), 3, "fleet resource count doesn't match");
    assertEq(ResourceCount.get(aliceHomeSpaceRock, uint8(EResource.Iron)), 0, "fleet resource count doesn't match");

    P_RequiredResourcesData memory requiredResources = P_RequiredResources.get(
      unitPrototype,
      UnitLevel.get(aliceHomeSpaceRock, unitPrototype)
    );
    for (uint256 i = 0; i < requiredResources.resources.length; i++) {
      if (P_IsUtility.get(requiredResources.resources[i]))
        assertEq(
          ResourceCount.get(aliceHomeSpaceRock, requiredResources.resources[i]),
          0,
          "no utility should be refunded when transfer is between same owner fleets"
        );
    }
  }

  function testTransferFailInCooldown() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 2;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    increaseResource(aliceHomeSpaceRock, EResource.U_MaxFleets, 1);
    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 secondFleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 1;
    }

    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 1;
    }

    vm.prank(creator);
    CooldownEnd.set(fleetId, block.timestamp + 1);
    vm.startPrank(alice);

    vm.expectRevert("[Fleet] Fleet is in cooldown");
    world.transferResourcesFromFleetToFleet(fleetId, secondFleetId, resourceCounts);

    vm.expectRevert("[Fleet] Fleet is in cooldown");
    world.transferUnitsFromFleetToFleet(fleetId, secondFleetId, unitCounts);

    vm.expectRevert("[Fleet] Fleet is in cooldown");
    world.transferUnitsAndResourcesFromFleetToFleet(fleetId, secondFleetId, unitCounts, resourceCounts);

    vm.expectRevert("[Fleet] Fleet is in cooldown");
    world.transferUnitsFromFleetToSpaceRock(fleetId, aliceHomeSpaceRock, unitCounts);

    vm.expectRevert("[Fleet] Fleet is in cooldown");
    world.transferUnitsAndResourcesFromFleetToSpaceRock(fleetId, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.expectRevert("[Fleet] Fleet is in cooldown");
    world.transferResourcesFromFleetToSpaceRock(fleetId, aliceHomeSpaceRock, resourceCounts);
  }
}
