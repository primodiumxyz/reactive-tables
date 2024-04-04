// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;
import "test/PrimodiumTest.t.sol";

contract FleetDisbandSystemTest is PrimodiumTest {
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

  function testDisbandFleet() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 1;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 1;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    vm.startPrank(alice);
    world.sendFleet(fleetId, bobHomeSpaceRock);
    vm.stopPrank();

    vm.warp(block.timestamp + 1);

    vm.startPrank(alice);
    world.disbandFleet(fleetId);
    vm.stopPrank();
    assertEq(UnitCount.get(fleetId, unitPrototype), 0, "fleet unit count doesn't match");
    assertEq(UnitCount.get(aliceHomeSpaceRock, unitPrototype), 0, "space rock unit count doesn't match");
    assertEq(ResourceCount.get(fleetId, uint8(EResource.Iron)), 0, "fleet resource count doesn't match");

    P_RequiredResourcesData memory requiredResources = P_RequiredResources.get(
      unitPrototype,
      UnitLevel.get(aliceHomeSpaceRock, unitPrototype)
    );
    for (uint256 i = 0; i < requiredResources.resources.length; i++) {
      if (P_IsUtility.get(requiredResources.resources[i]))
        assertEq(
          ResourceCount.get(aliceHomeSpaceRock, requiredResources.resources[i]),
          requiredResources.amounts[i],
          "space rock resource utility was not refunded correctly after disband"
        );
    }
    assertEq(
      ResourceCount.get(aliceHomeSpaceRock, uint8(EResource.Iron)),
      0,
      "space rock resource count doesn't match"
    );
    assertEq(OwnedBy.get(fleetId), aliceHomeSpaceRock, "fleet owned by doesn't match");
    assertEq(FleetMovement.getOrigin(fleetId), aliceHomeSpaceRock, "fleet origin doesn't match");
    assertEq(FleetMovement.getDestination(fleetId), aliceHomeSpaceRock, "fleet destination doesn't match");
    assertEq(FleetMovement.getArrivalTime(fleetId), block.timestamp, "fleet arrival time doesn't match");
    assertEq(FleetStance.getStance(fleetId), uint8(EFleetStance.NULL), "fleet stance doesn't match");
  }

  function testDisbandResourcesFleet() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 1;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 1;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    vm.startPrank(alice);
    world.sendFleet(fleetId, bobHomeSpaceRock);
    vm.stopPrank();

    vm.warp(block.timestamp + 1);

    vm.startPrank(alice);
    world.disbandResources(fleetId, resourceCounts);
    vm.stopPrank();

    assertEq(UnitCount.get(fleetId, unitPrototype), 1, "fleet unit count doesn't match");
    assertEq(UnitCount.get(aliceHomeSpaceRock, unitPrototype), 0, "space rock unit count doesn't match");
    assertEq(ResourceCount.get(fleetId, uint8(EResource.Iron)), 0, "fleet resource count doesn't match");
    assertEq(
      ResourceCount.get(aliceHomeSpaceRock, uint8(EResource.Iron)),
      0,
      "space rock resource count doesn't match"
    );
  }

  function testFailDisbandUnitsCargo() public {
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
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron))
        resourceCounts[i] = P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeSpaceRock, unitPrototype)) + 1;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 1;
    }

    vm.startPrank(alice);
    world.disbandUnits(fleetId, unitCounts);
    vm.stopPrank();
  }

  function testFailDisbandUnitsNotInOrbit() public {
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
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) resourceCounts[i] = 1;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    vm.startPrank(alice);
    world.sendFleet(fleetId, bobHomeSpaceRock);
    vm.stopPrank();

    vm.warp(block.timestamp + 1);

    vm.startPrank(alice);
    world.disbandUnits(fleetId, unitCounts);
    vm.stopPrank();
  }

  function testDisbandUnitsNoUnitsLeftReset() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 1;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    vm.startPrank(alice);
    world.sendFleet(fleetId, bobHomeSpaceRock);
    vm.stopPrank();

    vm.warp(FleetMovement.getArrivalTime(fleetId));

    vm.startPrank(alice);
    world.disbandUnits(fleetId, unitCounts);
    vm.stopPrank();

    P_RequiredResourcesData memory requiredResources = P_RequiredResources.get(
      unitPrototype,
      UnitLevel.get(aliceHomeSpaceRock, unitPrototype)
    );
    for (uint256 i = 0; i < requiredResources.resources.length; i++) {
      if (P_IsUtility.get(requiredResources.resources[i]))
        assertEq(
          ResourceCount.get(aliceHomeSpaceRock, requiredResources.resources[i]),
          requiredResources.amounts[i],
          "space rock resource utility was not refunded correctly after disband"
        );
    }
    assertEq(
      ResourceCount.get(aliceHomeSpaceRock, uint8(EResource.Iron)),
      0,
      "space rock resource count doesn't match"
    );
    assertEq(OwnedBy.get(fleetId), aliceHomeSpaceRock, "fleet owned by doesn't match");
    assertEq(FleetMovement.getOrigin(fleetId), aliceHomeSpaceRock, "fleet origin doesn't match");
    assertEq(FleetMovement.getDestination(fleetId), aliceHomeSpaceRock, "fleet destination doesn't match");
    assertEq(FleetMovement.getArrivalTime(fleetId), block.timestamp, "fleet arrival time doesn't match");
    assertEq(FleetStance.getStance(fleetId), uint8(EFleetStance.NULL), "fleet stance doesn't match");
  }
}
