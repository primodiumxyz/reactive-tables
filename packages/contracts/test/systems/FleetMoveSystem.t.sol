// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;
import "test/PrimodiumTest.t.sol";
import { LibFleetMove } from "libraries/fleet/LibFleetMove.sol";

contract FleetMoveSystemTest is PrimodiumTest {
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

  function testSendFleet() public {
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

    uint256 speed = P_Unit.getSpeed(unitPrototype, UnitLevel.get(aliceHomeSpaceRock, unitPrototype));
    uint256 arrivalTime = LibFleetMove.getArrivalTime(aliceHomeSpaceRock, Position.get(bobHomeSpaceRock), speed);

    uint256 correctArrivalTime = block.timestamp +
      ((LibMath.distance(Position.get(aliceHomeSpaceRock), Position.get(bobHomeSpaceRock)) *
        P_GameConfig.getTravelTime() *
        WORLD_SPEED_SCALE *
        UNIT_SPEED_SCALE) / (P_GameConfig.getWorldSpeed() * speed));

    require(arrivalTime == correctArrivalTime, "arrival time doesn't match");
    vm.startPrank(alice);
    world.sendFleet(fleetId, bobHomeSpaceRock);
    vm.stopPrank();
    assertEq(FleetMovement.getDestination(fleetId), bobHomeSpaceRock, "fleet destination doesn't match");
    assertEq(FleetMovement.getOrigin(fleetId), aliceHomeSpaceRock, "fleet origin doesn't match");
    assertEq(FleetMovement.getArrivalTime(fleetId), correctArrivalTime, "fleet arrival time doesn't match");
    assertEq(FleetMovement.getSendTime(fleetId), block.timestamp, "fleet send time doesn't match");
  }

  function testFailSendFleetToOrigin() public {
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
    world.sendFleet(fleetId, aliceHomeSpaceRock);
    vm.stopPrank();
  }

  function testRecallFleet() public {
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

    uint256 speed = P_Unit.getSpeed(unitPrototype, UnitLevel.get(aliceHomeSpaceRock, unitPrototype));
    uint256 arrivalTime = LibFleetMove.getArrivalTime(aliceHomeSpaceRock, Position.get(bobHomeSpaceRock), speed);

    //move some time forward so recall doesn't get negative send time
    vm.warp(arrivalTime);

    uint256 sendTime = block.timestamp;
    arrivalTime = LibFleetMove.getArrivalTime(aliceHomeSpaceRock, Position.get(bobHomeSpaceRock), speed);

    vm.startPrank(alice);
    world.sendFleet(fleetId, bobHomeSpaceRock);
    vm.stopPrank();

    uint256 someTimeAmount = ((arrivalTime - block.timestamp) / 2);
    vm.warp(block.timestamp + someTimeAmount);

    vm.startPrank(alice);
    world.recallFleet(fleetId);
    vm.stopPrank();

    assertEq(FleetMovement.getDestination(fleetId), aliceHomeSpaceRock, "fleet destination doesn't match");
    assertEq(FleetMovement.getOrigin(fleetId), bobHomeSpaceRock, "fleet origin doesn't match");
    assertEq(
      FleetMovement.getArrivalTime(fleetId),
      block.timestamp + someTimeAmount,
      "fleet arrival time doesn't match"
    );
    assertEq(
      FleetMovement.getSendTime(fleetId),
      block.timestamp + someTimeAmount - (arrivalTime - sendTime),
      "fleet send time doesn't match"
    );
  }

  function testSendFleetFromPirateAsteroidToOrigin() public {
    console.log("start");
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();

    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    uint256 numberOfUnits = 10;

    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    bytes32 capitalShipPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.CapitalShip));
    uint256 cargo = P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeSpaceRock, unitPrototype));

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = numberOfUnits;
      if (unitPrototypes[i] == capitalShipPrototype) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    P_SpawnPirateAsteroidData memory spawnPirateAsteroid;

    spawnPirateAsteroid.x = 5;
    spawnPirateAsteroid.y = 5;
    spawnPirateAsteroid.resources = new uint8[](1);
    spawnPirateAsteroid.resources[0] = uint8(EResource.Iron);
    spawnPirateAsteroid.resourceAmounts = new uint256[](1);
    spawnPirateAsteroid.resourceAmounts[0] =
      cargo *
      numberOfUnits +
      (P_Unit.getCargo(capitalShipPrototype, UnitLevel.get(aliceHomeSpaceRock, capitalShipPrototype)) * 2);
    spawnPirateAsteroid.units = new bytes32[](1);
    spawnPirateAsteroid.units[0] = unitPrototype;
    spawnPirateAsteroid.unitAmounts = new uint256[](1);
    spawnPirateAsteroid.unitAmounts[0] = 5;

    vm.startPrank(creator);
    bytes32 objectivePrototype = bytes32("someObjective");
    P_SpawnPirateAsteroid.set(objectivePrototype, spawnPirateAsteroid);
    bytes32 pirateAsteroid = world.spawnPirateAsteroid(aliceEntity, objectivePrototype);
    vm.stopPrank();

    vm.startPrank(alice);

    world.sendFleet(fleetId, pirateAsteroid);
    vm.warp(FleetMovement.getArrivalTime(fleetId));
    vm.stopPrank();

    vm.startPrank(alice);
    world.sendFleet(fleetId, aliceHomeSpaceRock);
    vm.stopPrank();
  }

  function testFailSendFleetFromPirateAsteroidToSpaceRockOtherThanOrigin() public {
    console.log("start");
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();

    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    uint256 numberOfUnits = 10;

    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    bytes32 capitalShipPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.CapitalShip));
    uint256 cargo = P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeSpaceRock, unitPrototype));

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = numberOfUnits;
      if (unitPrototypes[i] == capitalShipPrototype) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    P_SpawnPirateAsteroidData memory spawnPirateAsteroid;

    spawnPirateAsteroid.x = 5;
    spawnPirateAsteroid.y = 5;
    spawnPirateAsteroid.resources = new uint8[](1);
    spawnPirateAsteroid.resources[0] = uint8(EResource.Iron);
    spawnPirateAsteroid.resourceAmounts = new uint256[](1);
    spawnPirateAsteroid.resourceAmounts[0] =
      cargo *
      numberOfUnits +
      (P_Unit.getCargo(capitalShipPrototype, UnitLevel.get(aliceHomeSpaceRock, capitalShipPrototype)) * 2);
    spawnPirateAsteroid.units = new bytes32[](1);
    spawnPirateAsteroid.units[0] = unitPrototype;
    spawnPirateAsteroid.unitAmounts = new uint256[](1);
    spawnPirateAsteroid.unitAmounts[0] = 5;

    vm.startPrank(creator);
    bytes32 objectivePrototype = bytes32("someObjective");
    P_SpawnPirateAsteroid.set(objectivePrototype, spawnPirateAsteroid);
    bytes32 pirateAsteroid = world.spawnPirateAsteroid(aliceEntity, objectivePrototype);
    vm.stopPrank();

    vm.startPrank(alice);

    world.sendFleet(fleetId, pirateAsteroid);
    vm.warp(FleetMovement.getArrivalTime(fleetId));

    vm.stopPrank();

    vm.startPrank(alice);
    world.sendFleet(fleetId, bobHomeSpaceRock);
    vm.stopPrank();
  }

  function testFailRecallFleetFromPirateAsteroid() public {
    console.log("start");
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();

    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    uint256 numberOfUnits = 10;

    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    bytes32 capitalShipPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.CapitalShip));
    uint256 cargo = P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeSpaceRock, unitPrototype));

    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = numberOfUnits;
      if (unitPrototypes[i] == capitalShipPrototype) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
    vm.stopPrank();

    P_SpawnPirateAsteroidData memory spawnPirateAsteroid;

    spawnPirateAsteroid.x = 5;
    spawnPirateAsteroid.y = 5;
    spawnPirateAsteroid.resources = new uint8[](1);
    spawnPirateAsteroid.resources[0] = uint8(EResource.Iron);
    spawnPirateAsteroid.resourceAmounts = new uint256[](1);
    spawnPirateAsteroid.resourceAmounts[0] =
      cargo *
      numberOfUnits +
      (P_Unit.getCargo(capitalShipPrototype, UnitLevel.get(aliceHomeSpaceRock, capitalShipPrototype)) * 2);
    spawnPirateAsteroid.units = new bytes32[](1);
    spawnPirateAsteroid.units[0] = unitPrototype;
    spawnPirateAsteroid.unitAmounts = new uint256[](1);
    spawnPirateAsteroid.unitAmounts[0] = 5;

    vm.startPrank(creator);
    bytes32 objectivePrototype = bytes32("someObjective");
    P_SpawnPirateAsteroid.set(objectivePrototype, spawnPirateAsteroid);
    bytes32 pirateAsteroid = world.spawnPirateAsteroid(aliceEntity, objectivePrototype);
    vm.stopPrank();

    vm.startPrank(alice);

    world.sendFleet(fleetId, pirateAsteroid);
    vm.warp(FleetMovement.getArrivalTime(fleetId));
    vm.stopPrank();

    vm.startPrank(alice);
    world.sendFleet(fleetId, aliceHomeSpaceRock);
    world.recallFleet(fleetId);
    vm.stopPrank();
  }
}
