// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;
import "test/PrimodiumTest.t.sol";

contract FleetCreateLandSystemTest is PrimodiumTest {
  bytes32 aliceHomeSpaceRock;
  bytes32 aliceEntity;

  function setUp() public override {
    super.setUp();
    aliceEntity = addressToEntity(alice);
    aliceHomeSpaceRock = spawn(alice);
  }

  function testCreateFleet() public {
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
    assertEq(UnitCount.get(fleetId, unitPrototype), 1, "fleet unit count doesn't match");
    assertEq(UnitCount.get(aliceHomeSpaceRock, unitPrototype), 0, "space rock unit count doesn't match");
    assertEq(ResourceCount.get(fleetId, uint8(EResource.Iron)), 1, "fleet resource count doesn't match");
    assertEq(
      ResourceCount.get(aliceHomeSpaceRock, uint8(EResource.Iron)),
      0,
      "space rock resource count doesn't match"
    );
    assertEq(IsFleet.get(fleetId), true, "fleet is not a fleet");
    assertEq(OwnedBy.get(fleetId), aliceHomeSpaceRock, "fleet owned by doesn't match");
    assertEq(FleetMovement.getDestination(fleetId), aliceHomeSpaceRock, "fleet destination doesn't match");
    assertEq(FleetMovement.getArrivalTime(fleetId), block.timestamp, "fleet arrival time doesn't match");
    assertEq(FleetStance.getStance(fleetId), uint8(EFleetStance.NULL), "fleet stance doesn't match");
    assertEq(FleetMovement.getOrigin(fleetId), aliceHomeSpaceRock, "fleet origin doesn't match");
  }

  function testCreateFleetScore() public {
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
    uint256 aliceScore = Score.get(aliceEntity);
    assertEq(aliceScore, P_ScoreMultiplier.get(uint8(EResource.Iron)), "score should be one iron");
    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    assertEq(Score.get(aliceEntity), 0, "score should be 0");
  }
  function testLandFleet() public {
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
    world.landFleet(fleetId, aliceHomeSpaceRock);
    vm.stopPrank();
    assertEq(UnitCount.get(fleetId, unitPrototype), 0, "fleet unit count doesn't match");
    assertEq(UnitCount.get(aliceHomeSpaceRock, unitPrototype), 1, "space rock unit count doesn't match");
    assertEq(ResourceCount.get(fleetId, uint8(EResource.Iron)), 0, "fleet resource count doesn't match");
    assertEq(
      ResourceCount.get(aliceHomeSpaceRock, uint8(EResource.Iron)),
      1,
      "space rock resource count doesn't match"
    );
    assertEq(OwnedBy.get(fleetId), aliceHomeSpaceRock, "fleet owned by doesn't match");
    assertEq(FleetMovement.getOrigin(fleetId), aliceHomeSpaceRock, "fleet origin doesn't match");
    assertEq(FleetMovement.getDestination(fleetId), aliceHomeSpaceRock, "fleet destination doesn't match");
    assertEq(FleetMovement.getArrivalTime(fleetId), block.timestamp, "fleet arrival time doesn't match");
    assertEq(FleetStance.getStance(fleetId), uint8(EFleetStance.NULL), "fleet stance doesn't match");
  }

  function testFailCreateFleetNotEnoughUnits() public {
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
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) {
        resourceCounts[i] = 1;
        increaseResource(aliceHomeSpaceRock, EResource.Iron, 1);
      }
    }

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();
  }

  function testFailCreateFleetNotEnoughResources() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) {
        unitCounts[i] = 1;
        trainUnits(alice, unitPrototypes[i], 1, true);
      }
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    for (uint256 i = 0; i < resourceCounts.length; i++) {
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron)) {
        resourceCounts[i] = 1;
      }
    }

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();
  }

  function testFailCreateFleetNotOwner() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    //create fleet with 1 minuteman marine
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = 1;
    }

    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    //try to create fleet by other player
    vm.startPrank(bob);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();
  }

  function testFailCreateFleetNoFleetMovementsLeft() public {
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
    setupCreateFleetNoMaxMovesGranted(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    setupCreateFleetNoMaxMovesGranted(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 secondFleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();
  }

  function testFailCreateFleetNotEnoughCargo() public {
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
      if (P_Transportables.getItemValue(i) == uint8(EResource.Iron))
        resourceCounts[i] = P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeSpaceRock, unitPrototype)) + 1;
    }

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();
  }
}
