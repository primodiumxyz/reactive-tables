// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";
import { LibFleetMove } from "libraries/fleet/LibFleetMove.sol";
import { LibCombatAttributes } from "libraries/LibCombatAttributes.sol";

import { LibFleetMove } from "libraries/fleet/LibFleetMove.sol";
import { FleetsMap } from "libraries/fleet/FleetsMap.sol";
import { FleetIncomingKey } from "src/Keys.sol";

contract FleetCombatSystemTest is PrimodiumTest {
  bytes32 aliceHomeSpaceRock;
  bytes32 aliceEntity;

  bytes32 bobHomeSpaceRock;
  bytes32 bobEntity;

  bytes32 eveHomeSpaceRock;
  bytes32 eveEntity;

  function setUp() public override {
    super.setUp();
    aliceEntity = addressToEntity(alice);
    aliceHomeSpaceRock = spawn(alice);
    bobEntity = addressToEntity(bob);
    bobHomeSpaceRock = spawn(bob);
    eveEntity = addressToEntity(eve);
    eveHomeSpaceRock = spawn(eve);
  }

  function testAttackPirateAsteroid() public {
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

    setupCreateFleet(alice, aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 secondFlleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);
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

    assertEq(PirateAsteroid.getIsPirateAsteroid(pirateAsteroid), true, "pirate asteroid should have been created");
    assertEq(PirateAsteroid.getIsDefeated(pirateAsteroid), false, "pirate asteroid should not have been defeated");
    assertEq(
      PirateAsteroid.getPlayerEntity(pirateAsteroid),
      aliceEntity,
      "pirate asteroid should be personal to alice"
    );
    assertEq(
      PirateAsteroid.getPrototype(pirateAsteroid),
      objectivePrototype,
      "pirate asteroid should be associated with spawning objective"
    );

    vm.startPrank(alice);

    world.sendFleet(fleetId, bobHomeSpaceRock);
    vm.warp(FleetMovement.getArrivalTime(fleetId));

    world.sendFleet(fleetId, pirateAsteroid);
    vm.warp(FleetMovement.getArrivalTime(fleetId));

    world.sendFleet(secondFlleetId, pirateAsteroid);
    uint256 halfWayAmount = (FleetMovement.getArrivalTime(secondFlleetId) - FleetMovement.getSendTime(secondFlleetId)) /
      2;
    vm.warp(block.timestamp + halfWayAmount);
    assertEq(block.timestamp, FleetMovement.getSendTime(secondFlleetId) + halfWayAmount, "time passed should match");

    vm.stopPrank();

    vm.startPrank(alice);
    world.attack(fleetId, pirateAsteroid);
    vm.stopPrank();

    assertEq(
      LibCombatAttributes.getCargo(fleetId),
      LibCombatAttributes.getCargoCapacity(fleetId),
      "fleet should have raided max cargo"
    );

    assertEq(
      LibCombatAttributes.getCargoCapacity(fleetId) + ResourceCount.get(pirateAsteroid, uint8(EResource.Iron)),
      spawnPirateAsteroid.resourceAmounts[0],
      "sum of un raided and raided should be initial amount"
    );

    assertEq(
      FleetMovement.getDestination(secondFlleetId),
      aliceHomeSpaceRock,
      "fleet should be moving back to home space rock through recall"
    );
    assertEq(
      FleetMovement.getOrigin(secondFlleetId),
      pirateAsteroid,
      "fleet should be moving back from pirate asteroid through recall"
    );
    //todo don't understand why this is failing will test with client
    assertEq(
      FleetMovement.getArrivalTime(secondFlleetId),
      block.timestamp + halfWayAmount,
      "fleet should take same amount to get back that has moved up to that point"
    );

    assertEq(
      FleetMovement.getDestination(fleetId),
      aliceHomeSpaceRock,
      "fleet should be moving back to home space rock"
    );
    assertEq(FleetMovement.getOrigin(fleetId), pirateAsteroid, "fleet should be moving back from pirate asteroid");
    assertTrue(FleetMovement.getArrivalTime(fleetId) > block.timestamp, "fleet should take time to go back");

    assertEq(PirateAsteroid.getIsDefeated(pirateAsteroid), true, "pirate asteroid should have been defeated");
    assertEq(
      FleetsMap.size(pirateAsteroid, FleetIncomingKey),
      0,
      "pirate asteroid should not have any incoming fleets"
    );
    assertTrue(
      DefeatedPirate.get(aliceEntity, objectivePrototype),
      "pirate asteroid should be marked as defeated for alice"
    );
  }

  function testFailAttackPirateAsteroidAfterDefeated() public {
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
    world.attack(fleetId, pirateAsteroid);
    vm.stopPrank();

    vm.warp(FleetMovement.getArrivalTime(fleetId));

    vm.startPrank(alice);
    world.sendFleet(fleetId, pirateAsteroid);
    vm.stopPrank();
  }
}
