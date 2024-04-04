// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { console } from "forge-std/console.sol";
import "test/PrimodiumTest.t.sol";
import { LibFleetMove } from "libraries/fleet/LibFleetMove.sol";
import { LibFleetCombat } from "libraries/fleet/LibFleetCombat.sol";
import { LibFleetStance } from "libraries/fleet/LibFleetStance.sol";
import { FleetsMap } from "libraries/fleet/FleetsMap.sol";
import { FleetIncomingKey } from "src/Keys.sol";

/* 
  Tests to write
  - Fight fleet vs spacerock and defenders 
*/
contract CombatDefenderTest is PrimodiumTest {
  bytes32 aliceHomeAsteroid;
  bytes32 aliceEntity;

  bytes32 bobHomeAsteroid;
  bytes32 bobEntity;

  bytes32 eveHomeAsteroid;
  bytes32 eveEntity;

  function setUp() public override {
    super.setUp();
    aliceEntity = addressToEntity(alice);
    aliceHomeAsteroid = spawn(alice);
    bobEntity = addressToEntity(bob);
    bobHomeAsteroid = spawn(bob);
    eveEntity = addressToEntity(eve);
    eveHomeAsteroid = spawn(eve);
  }
  //test fleet attack space rock and win raid
  function testFleetAttackAsteroidWithDefender() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 minutemanEntity = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 100;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    world.sendFleet(fleetId, bobHomeAsteroid);

    switchPrank(creator);
    GracePeriod.set(bobHomeAsteroid, block.timestamp);

    // create bob fleet
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 1;
    }
    setupCreateFleet(bob, bobHomeAsteroid, unitCounts, resourceCounts);
    switchPrank(bob);
    bytes32 bobFleetEntity = world.createFleet(bobHomeAsteroid, unitCounts, resourceCounts);
    world.setFleetStance(bobFleetEntity, uint8(EFleetStance.Defend), bobHomeAsteroid);

    console.log("is fleet:", IsFleet.get(bobHomeAsteroid));
    assertEq(LibFleetStance.getAllies(bobHomeAsteroid).length, 1, "bob should have 1 ally fleet");
    assertEq(LibFleetStance.getDefendingFleets(bobHomeAsteroid).length, 1, "bob should have 1 defending fleet");

    vm.warp(FleetMovement.getArrivalTime(fleetId));

    uint256 unitCargo = P_Unit.getCargo(minutemanEntity, UnitLevel.get(aliceHomeAsteroid, minutemanEntity));
    assertTrue(unitCargo > 0, "unit cargo should more than 0");
    increaseResource(bobHomeAsteroid, EResource.Iron, unitCargo);
    assertGt(GracePeriod.get(fleetId), 0, "fleet should be in grace period");
    assertGt(GracePeriod.get(aliceHomeAsteroid), 0, "home rock should be in grace period");

    switchPrank(alice);
    world.attack(fleetId, bobHomeAsteroid);
    vm.stopPrank();

    assertEq(GracePeriod.get(fleetId), 0, "fleet should not be in grace period");
    assertEq(GracePeriod.get(aliceHomeAsteroid), 0, "home rock should not be in grace period");
    assertEq(ResourceCount.get(bobHomeAsteroid, uint8(EResource.Iron)), 0, "space rock iron count should be 0");
    assertEq(ResourceCount.get(fleetId, uint8(EResource.Iron)), unitCargo, "fleet should have raided iron");
    assertEq(
      ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_Encryption)),
      MaxResourceCount.get(bobHomeAsteroid, uint8(EResource.R_Encryption)),
      "fleet should have full encryption"
    );

    uint256 unitAttack = P_Unit.getAttack(minutemanEntity, UnitLevel.get(aliceHomeAsteroid, minutemanEntity));
    assertTrue(unitAttack > 0, "unit attack should more than 0");

    assertEq(ResourceCount.get(bobHomeAsteroid, uint8(EResource.Iron)), 0, "space rock iron count should be 0");
  }
}
