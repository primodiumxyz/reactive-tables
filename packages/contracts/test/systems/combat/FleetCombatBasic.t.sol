// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";
import { LibFleetMove } from "libraries/fleet/LibFleetMove.sol";
import { LibFleetStance } from "libraries/fleet/LibFleetStance.sol";
import { LibFleetCombat } from "libraries/fleet/LibFleetCombat.sol";
import { LibFleetRaid } from "libraries/fleet/LibFleetRaid.sol";
import { LibMath } from "libraries/LibMath.sol";
import { LibCombatAttributes } from "libraries/LibCombatAttributes.sol";
import { FleetsMap } from "libraries/fleet/FleetsMap.sol";
import { FleetIncomingKey } from "src/Keys.sol";

/* 
  More tests to write
  - fleets in same orbit
  - fleet vs fleet
  - 
*/
contract FleetCombatSystemTest is PrimodiumTest {
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

  /* --------------------------------- SUCCEED -------------------------------- */
  //test fleet attack space rock and win raid
  function testFleetAttackAsteroidu() public {
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
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    world.sendFleet(fleetId, bobHomeAsteroid);

    switchPrank(creator);

    vm.warp(LibMath.max(FleetMovement.getArrivalTime(fleetId), GracePeriod.get(bobHomeAsteroid)));

    uint256 unitCargo = P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype));
    assertGt(unitCargo, 0, "unit cargo should more than 0");
    increaseResource(bobHomeAsteroid, EResource.Iron, unitCargo);
    assertGt(GracePeriod.get(fleetId), 0, "fleet should be in grace period");
    assertGt(GracePeriod.get(aliceHomeAsteroid), 0, "home rock should be in grace period");

    assertEq(LibFleetStance.getAllies(fleetId).length, 0, "alice ally fleet");
    assertEq(LibFleetStance.getAllies(bobHomeAsteroid).length, 0, "bob ally fleet");
    switchPrank(alice);
    world.attack(fleetId, bobHomeAsteroid);

    assertEq(GracePeriod.get(fleetId), 0, "fleet should not be in grace period");
    assertEq(GracePeriod.get(aliceHomeAsteroid), 0, "home rock should not be in grace period");
    assertEq(ResourceCount.get(bobHomeAsteroid, uint8(EResource.Iron)), 0, "space rock iron count should be 0");
    assertEq(ResourceCount.get(fleetId, uint8(EResource.Iron)), unitCargo, "fleet should have raided iron");
    assertEq(
      ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_Encryption)),
      MaxResourceCount.get(bobHomeAsteroid, uint8(EResource.R_Encryption)),
      "fleet should have full encryption"
    );

    uint256 unitAttack = P_Unit.getAttack(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype));
    assertTrue(unitAttack > 0, "unit attack should more than 0");
    assertEq(ResourceCount.get(bobHomeAsteroid, uint8(EResource.Iron)), 0, "space rock iron count should be 0");
  }

  function testFleetAttackAsteroidDefenderWins() public {
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
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);

    vm.prank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);

    vm.prank(alice);
    world.sendFleet(fleetId, bobHomeAsteroid);

    vm.prank(creator);
    GracePeriod.set(bobHomeAsteroid, block.timestamp);

    //todo the same build has some prototype config issues realted to storage increase when fixed the following lines which initialize
    uint256 defense = 1000 * 1e18;
    uint256 hpProductionIncrease = 1 * 1e18;
    uint256 hp = 1000 * 1e18;
    increaseProduction(bobHomeAsteroid, EResource.U_Defense, defense);
    increaseResource(bobHomeAsteroid, EResource.R_HP, hp);
    increaseProduction(bobHomeAsteroid, EResource.R_HP, hpProductionIncrease);
    uint256 hpProduction = ProductionRate.get(bobHomeAsteroid, uint8(EResource.R_HP));

    //for testing raiding
    increaseResource(bobHomeAsteroid, EResource.Iron, 10);

    assertEq(ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_HP)), hp, "space rock hp should have match SAM");
    assertEq(hp, defense, "space rock hp and defense should be the same when full hp");

    vm.warp(LibMath.max(FleetMovement.getArrivalTime(fleetId), GracePeriod.get(bobHomeAsteroid)));

    vm.prank(alice);
    world.attack(fleetId, bobHomeAsteroid);

    assertEq(
      ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_Encryption)),
      MaxResourceCount.get(bobHomeAsteroid, uint8(EResource.R_Encryption)),
      "fleet should have full encryption"
    );

    uint256 unitAttack = P_Unit.getAttack(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype));
    assertGt(unitAttack, 0, "unit attack should more than 0");

    assertEq(
      ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_HP)),
      hp - unitAttack,
      "space rock hp should have been reduced by unit attack"
    );

    assertEq(ResourceCount.get(bobHomeAsteroid, uint8(EResource.Iron)), 10, "space rock should not have been raided");
    assertEq(ResourceCount.get(fleetId, uint8(EResource.Iron)), 0, "fleet should have lost its resources");
    assertEq(UnitCount.get(fleetId, unitPrototype), 0, "fleet should have lost its units");

    assertEq(
      FleetMovement.getDestination(fleetId),
      aliceHomeAsteroid,
      "fleet destination doesn't match, should have reset to home space rock"
    );
    assertEq(FleetMovement.getOrigin(fleetId), aliceHomeAsteroid, "fleet origin doesn't match");
    assertEq(FleetMovement.getArrivalTime(fleetId), block.timestamp, "fleet arrival time doesn't match");
    assertEq(FleetMovement.getSendTime(fleetId), block.timestamp, "fleet send time doesn't match");

    vm.warp(block.timestamp + 5);
    claimResources(bobHomeAsteroid);
    assertEq(
      ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_HP)),
      hp - unitAttack + (hpProduction * 5),
      "space rock hp should have recovered by production"
    );

    vm.warp(block.timestamp + (unitAttack / hpProduction));

    claimResources(bobHomeAsteroid);
    assertEq(
      ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_HP)),
      hp,
      "space rock hp should have recovered completely"
    );
  }

  function testFleetAttackAsteroidAttackerWins() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    uint256 numberOfUnits = 10;
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = numberOfUnits;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);

    vm.prank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    vm.prank(alice);
    world.sendFleet(fleetId, bobHomeAsteroid);

    vm.prank(creator);
    GracePeriod.set(bobHomeAsteroid, block.timestamp);

    uint256 defense = (numberOfUnits *
      P_Unit.getAttack(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype))) / 2;
    uint256 hpProduction = 1;
    uint256 hp = defense;
    increaseResource(bobHomeAsteroid, EResource.U_Defense, defense);
    increaseResource(bobHomeAsteroid, EResource.R_HP, hp);
    increaseProduction(bobHomeAsteroid, EResource.R_HP, hpProduction);
    assertEq(
      LibCombatAttributes.getDefense(bobHomeAsteroid),
      defense,
      "space rock defense should match increased defense"
    );

    uint256 ironAmount = numberOfUnits *
      P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype));
    uint256 copperAmount = numberOfUnits *
      P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype));
    increaseResource(bobHomeAsteroid, EResource.Iron, ironAmount);
    increaseResource(bobHomeAsteroid, EResource.Copper, copperAmount);

    vm.warp(LibMath.max(FleetMovement.getArrivalTime(fleetId), GracePeriod.get(bobHomeAsteroid)));
    vm.prank(alice);
    world.attack(fleetId, bobHomeAsteroid);

    assertEq(
      ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_HP)),
      0,
      "space rock hp should have been reduced by unit attack"
    );

    assertEq(
      LibCombatAttributes.getCargo(fleetId),
      LibCombatAttributes.getCargoCapacity(fleetId),
      "fleet should have maxed out their cargo"
    );

    assertEq(
      ResourceCount.get(fleetId, uint8(EResource.Iron)) + ResourceCount.get(bobHomeAsteroid, uint8(EResource.Iron)),
      ironAmount,
      "sum of unraided and raided should equal initial amount"
    );
    assertEq(
      ResourceCount.get(fleetId, uint8(EResource.Copper)) + ResourceCount.get(bobHomeAsteroid, uint8(EResource.Copper)),
      copperAmount,
      "sum of unraided and raided should equal initial amount"
    );
    assertEq(
      ResourceCount.get(fleetId, uint8(EResource.Copper)),
      ResourceCount.get(fleetId, uint8(EResource.Iron)),
      "fleet should have raided equal amounts of iron and copper"
    );
    uint256 casualtyCount = LibMath.divideRound(
      defense,
      P_Unit.getHp(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype))
    );
    if (casualtyCount > numberOfUnits) casualtyCount = numberOfUnits;

    P_RequiredResourcesData memory requiredResources = P_RequiredResources.get(
      unitPrototype,
      UnitLevel.get(aliceHomeAsteroid, unitPrototype)
    );
    for (uint8 i = 0; i < requiredResources.resources.length; i++) {
      if (P_IsUtility.get(requiredResources.resources[i])) {
        assertEq(
          ResourceCount.get(aliceHomeAsteroid, requiredResources.resources[i]),
          requiredResources.amounts[i] * casualtyCount,
          "utility should have been refunded to owner soace rock when fleet took casualties"
        );
      }
    }

    assertEq(UnitCount.get(fleetId, unitPrototype), numberOfUnits - casualtyCount, "fleet should have lost units");
    assertEq(
      LibCombatAttributes.getCargoCapacity(fleetId),
      (numberOfUnits - casualtyCount) * P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype)),
      "fleet cargo should map units"
    );
  }

  // alice (attacker) has 2 minuteman marines, bob (defender) has 1 minuteman marine
  function testtrainingTimeFleetAttackFleetAttackerWins() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 minutemanEntity = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    // create and send alice fleet
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);
    vm.startPrank(alice);
    bytes32 aliceFleetEntity = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    world.sendFleet(aliceFleetEntity, bobHomeAsteroid);

    switchPrank(creator);
    GracePeriod.set(bobHomeAsteroid, block.timestamp);

    // create bob fleet
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 1;
    }
    setupCreateFleet(bob, bobHomeAsteroid, unitCounts, resourceCounts);
    switchPrank(bob);
    bytes32 bobFleetEntity = world.createFleet(bobHomeAsteroid, unitCounts, resourceCounts);

    vm.warp(LibMath.max(FleetMovement.getArrivalTime(aliceFleetEntity), GracePeriod.get(bobFleetEntity)));

    uint256 aliceAttack = LibCombatAttributes.getAttack(aliceFleetEntity);
    uint256 bobDefense = LibCombatAttributes.getDefense(bobFleetEntity);
    uint256 bobHp = LibCombatAttributes.getHp(bobFleetEntity);
    uint256 aliceHp = LibCombatAttributes.getHp(aliceFleetEntity);

    assertGt(GracePeriod.get(aliceFleetEntity), 0, "alice fleet should be in grace period");
    assertGt(GracePeriod.get(aliceHomeAsteroid), 0, "alice home rock should be in grace period");
    assertGt(GracePeriod.get(bobHomeAsteroid), 0, "bob home rock should be in grace period");
    assertGt(GracePeriod.get(bobFleetEntity), 0, "bob fleet should be in grace period");

    switchPrank(alice);
    world.attack(aliceFleetEntity, bobFleetEntity);

    assertEq(GracePeriod.get(aliceFleetEntity), 0, "alice fleet should not be in grace period");
    assertEq(GracePeriod.get(aliceHomeAsteroid), 0, "alice home rock should not be in grace period");
    assertGt(GracePeriod.get(bobHomeAsteroid), 0, "bob home rock should be in grace period");
    assertGt(GracePeriod.get(bobFleetEntity), 0, "bob fleet should be in grace period");

    uint256 bobRemainingUnits = UnitCount.get(bobFleetEntity, minutemanEntity);
    assertEq(bobRemainingUnits, 0, "bob units should have been reduced");
  }

  function testFleetAttackCooldown() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 minutemanEntity = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 100;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    // create and send alice fleet
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);
    vm.startPrank(alice);
    bytes32 aliceFleetEntity = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    world.sendFleet(aliceFleetEntity, bobHomeAsteroid);

    switchPrank(creator);
    GracePeriod.set(bobHomeAsteroid, block.timestamp);

    // create bob fleet
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 1;
    }
    setupCreateFleet(bob, bobHomeAsteroid, unitCounts, resourceCounts);
    switchPrank(bob);
    bytes32 bobFleetEntity = world.createFleet(bobHomeAsteroid, unitCounts, resourceCounts);

    vm.warp(LibMath.max(FleetMovement.getArrivalTime(aliceFleetEntity), GracePeriod.get(bobFleetEntity)));

    uint256 aliceAttack = LibCombatAttributes.getAttack(aliceFleetEntity);
    (uint256 aggressorDamage, uint256[] memory aggressorDamages, uint256 totalAggressorDamage) = LibCombatAttributes
      .getAttacksWithAllies(aliceFleetEntity);

    switchPrank(alice);
    world.attack(aliceFleetEntity, bobHomeAsteroid);

    uint256 cooldown = LibFleetCombat.getCooldownTime(aliceAttack, false);
    assertEq(CooldownEnd.get(aliceFleetEntity), block.timestamp + cooldown);
    assertGt(CooldownEnd.get(aliceFleetEntity), block.timestamp);
  }

  function testFleetAttackFailedInCooldown() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 minutemanEntity = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 100;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    // create and send alice fleet
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);
    vm.startPrank(alice);
    bytes32 aliceFleetEntity = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    world.sendFleet(aliceFleetEntity, bobHomeAsteroid);

    switchPrank(creator);
    GracePeriod.set(bobHomeAsteroid, block.timestamp);

    // create bob fleet
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 1;
    }
    setupCreateFleet(bob, bobHomeAsteroid, unitCounts, resourceCounts);
    switchPrank(bob);
    bytes32 bobFleetEntity = world.createFleet(bobHomeAsteroid, unitCounts, resourceCounts);

    vm.warp(LibMath.max(FleetMovement.getArrivalTime(aliceFleetEntity), GracePeriod.get(bobFleetEntity)));

    switchPrank(creator);
    CooldownEnd.set(aliceFleetEntity, block.timestamp + 1);
    switchPrank(alice);

    vm.expectRevert("[Fleet] Fleet is in cooldown");
    world.attack(aliceFleetEntity, bobHomeAsteroid);
  }

  function testCooldownTimes() public {
    uint256 testValue = 1 * 1e18;
    assertEq(LibFleetCombat.getCooldownTime(testValue, false), 0);

    testValue = 1000 * 1e18;
    assertEq(LibFleetCombat.getCooldownTime(testValue, false), 2 * 60);

    testValue = 10000 * 1e18;
    assertEq(LibFleetCombat.getCooldownTime(testValue, false), 24 * 60);

    testValue = 20000 * 1e18;
    assertEq(LibFleetCombat.getCooldownTime(testValue, false), 48 * 60);

    testValue = 100000 * 1e18;
    assertApproxEqAbs(LibFleetCombat.getCooldownTime(testValue, false), 103 * 60, 3);

    testValue = 150000 * 1e18;
    assertApproxEqAbs(LibFleetCombat.getCooldownTime(testValue, false), 118 * 60, 3);

    testValue = 250000 * 1e18;
    assertApproxEqAbs(LibFleetCombat.getCooldownTime(testValue, false), 137 * 60, 3);

    uint256 extension = P_CapitalShipConfig.getCooldownExtension();

    assertEq(
      LibFleetCombat.getCooldownTime(testValue, false) + (extension * 60),
      LibFleetCombat.getCooldownTime(testValue, true)
    );
  }
  function testFleetAttackBlockingFleetAttackerWins() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 minutemanEntity = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 2;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    // create and send alice fleet
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);
    vm.startPrank(alice);
    bytes32 aliceFleetEntity = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    world.sendFleet(aliceFleetEntity, bobHomeAsteroid);

    switchPrank(creator);
    GracePeriod.set(bobHomeAsteroid, block.timestamp);

    // create bob fleet
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 1;
    }
    setupCreateFleet(bob, bobHomeAsteroid, unitCounts, resourceCounts);
    switchPrank(bob);
    bytes32 bobFleetEntity = world.createFleet(bobHomeAsteroid, unitCounts, resourceCounts);

    vm.warp(LibMath.max(FleetMovement.getArrivalTime(aliceFleetEntity), GracePeriod.get(bobFleetEntity)));

    uint256 aliceAttack = LibCombatAttributes.getAttack(aliceFleetEntity);
    uint256 bobDefense = LibCombatAttributes.getDefense(bobFleetEntity);
    uint256 bobHp = LibCombatAttributes.getHp(bobFleetEntity);
    uint256 aliceHp = LibCombatAttributes.getHp(aliceFleetEntity);

    assertGt(GracePeriod.get(aliceFleetEntity), 0, "alice fleet should be in grace period");
    assertGt(GracePeriod.get(aliceHomeAsteroid), 0, "alice home rock should be in grace period");
    assertGt(GracePeriod.get(bobHomeAsteroid), 0, "bob home rock should be in grace period");
    assertGt(GracePeriod.get(bobFleetEntity), 0, "bob fleet should be in grace period");

    world.setFleetStance(bobFleetEntity, uint8(EFleetStance.Block), bobHomeAsteroid);
    switchPrank(alice);
    world.attack(aliceFleetEntity, bobFleetEntity);

    assertEq(GracePeriod.get(aliceFleetEntity), 0, "alice fleet should not be in grace period");
    assertEq(GracePeriod.get(aliceHomeAsteroid), 0, "alice home rock should not be in grace period");
    assertGt(GracePeriod.get(bobHomeAsteroid), 0, "bob home rock should be in grace period");
    assertGt(GracePeriod.get(bobFleetEntity), 0, "bob fleet should be in grace period");

    uint256 bobRemainingUnits = UnitCount.get(bobFleetEntity, minutemanEntity);
    assertEq(bobRemainingUnits, 0, "bob units should have been reduced");
  }

  function testAsteroidAttackFleetAttackerWins() public {
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
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);

    vm.prank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);

    vm.prank(alice);
    world.sendFleet(fleetId, bobHomeAsteroid);

    vm.prank(creator);
    GracePeriod.set(bobHomeAsteroid, block.timestamp);

    //todo the same build has some prototype config issues realted to storage increase when fixed the following lines which initialize
    uint256 defense = 1000 * 1e18;
    uint256 hpProductionIncrease = 1 * 1e18;
    uint256 hp = 1000 * 1e18;
    increaseProduction(bobHomeAsteroid, EResource.U_Defense, defense);
    increaseResource(bobHomeAsteroid, EResource.R_HP, hp);
    increaseProduction(bobHomeAsteroid, EResource.R_HP, hpProductionIncrease);
    uint256 hpProduction = ProductionRate.get(bobHomeAsteroid, uint8(EResource.R_HP));

    //for testing raiding
    increaseResource(bobHomeAsteroid, EResource.Iron, 10);

    assertEq(ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_HP)), hp, "space rock hp should have match SAM");
    assertEq(hp, defense, "space rock hp and defense should be the same when full hp");

    vm.warp(LibMath.max(FleetMovement.getArrivalTime(fleetId), GracePeriod.get(fleetId)));

    vm.startPrank(bob);

    world.attack(bobHomeAsteroid, fleetId);

    assertEq(
      ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_Encryption)),
      MaxResourceCount.get(bobHomeAsteroid, uint8(EResource.R_Encryption)),
      "fleet should have full encryption"
    );

    uint256 unitAttack = P_Unit.getAttack(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype));
    assertGt(unitAttack, 0, "unit attack should more than 0");

    assertEq(
      ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_HP)),
      hp - unitAttack,
      "space rock hp should have been reduced by unit attack"
    );

    assertEq(ResourceCount.get(bobHomeAsteroid, uint8(EResource.Iron)), 10, "space rock should not have been raided");
    assertEq(ResourceCount.get(fleetId, uint8(EResource.Iron)), 0, "fleet should have lost its resources");
    assertEq(UnitCount.get(fleetId, unitPrototype), 0, "fleet should have lost its units");

    assertEq(
      FleetMovement.getDestination(fleetId),
      aliceHomeAsteroid,
      "fleet destination doesn't match, should have reset to home space rock"
    );
    assertEq(FleetMovement.getOrigin(fleetId), aliceHomeAsteroid, "fleet origin doesn't match");
    assertEq(FleetMovement.getArrivalTime(fleetId), block.timestamp, "fleet arrival time doesn't match");
    assertEq(FleetMovement.getSendTime(fleetId), block.timestamp, "fleet send time doesn't match");

    vm.warp(block.timestamp + 5);
    claimResources(bobHomeAsteroid);
    assertEq(
      ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_HP)),
      hp - unitAttack + (hpProduction * 5),
      "space rock hp should have recovered by production"
    );

    vm.warp(block.timestamp + (unitAttack / hpProduction));

    claimResources(bobHomeAsteroid);
    assertEq(
      ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_HP)),
      hp,
      "space rock hp should have recovered completely"
    );
  }

  function testAsteroidAttackFleetDefenderWins() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    uint256 numberOfUnits = 10;
    //create fleet with 1 minuteman marine
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == unitPrototype) unitCounts[i] = numberOfUnits;
    }

    //create fleet with 1 iron
    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    //provide resource and unit requirements to create fleet
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);

    vm.prank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    vm.prank(alice);
    world.sendFleet(fleetId, bobHomeAsteroid);

    vm.prank(creator);
    GracePeriod.set(bobHomeAsteroid, block.timestamp);

    uint256 defense = (numberOfUnits *
      P_Unit.getAttack(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype))) / 2;
    uint256 hpProduction = 1;
    uint256 hp = defense;
    increaseResource(bobHomeAsteroid, EResource.U_Defense, defense);
    increaseResource(bobHomeAsteroid, EResource.R_HP, hp);
    increaseProduction(bobHomeAsteroid, EResource.R_HP, hpProduction);
    assertEq(
      LibCombatAttributes.getDefense(bobHomeAsteroid),
      defense,
      "space rock defense should match increased defense"
    );

    uint256 ironAmount = numberOfUnits *
      P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype));
    uint256 copperAmount = numberOfUnits *
      P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype));
    increaseResource(bobHomeAsteroid, EResource.Iron, ironAmount);
    increaseResource(bobHomeAsteroid, EResource.Copper, copperAmount);

    vm.warp(LibMath.max(FleetMovement.getArrivalTime(fleetId), GracePeriod.get(fleetId)));
    vm.prank(bob);
    world.attack(bobHomeAsteroid, fleetId);

    assertEq(
      ResourceCount.get(bobHomeAsteroid, uint8(EResource.R_HP)),
      0,
      "space rock hp should have been reduced by unit attack"
    );

    assertEq(
      ResourceCount.get(fleetId, uint8(EResource.Iron)),
      0,
      "sum of unraided and raided should equal initial amount"
    );

    assertEq(
      ResourceCount.get(fleetId, uint8(EResource.Copper)) + ResourceCount.get(bobHomeAsteroid, uint8(EResource.Copper)),
      copperAmount,
      "sum of unraided and raided should equal initial amount"
    );
    assertEq(
      ResourceCount.get(fleetId, uint8(EResource.Copper)),
      ResourceCount.get(fleetId, uint8(EResource.Iron)),
      "fleet should have raided equal amounts of iron and copper"
    );
    uint256 casualtyCount = LibMath.divideRound(
      defense,
      P_Unit.getHp(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype))
    );
    if (casualtyCount > numberOfUnits) casualtyCount = numberOfUnits;

    P_RequiredResourcesData memory requiredResources = P_RequiredResources.get(
      unitPrototype,
      UnitLevel.get(aliceHomeAsteroid, unitPrototype)
    );
    for (uint8 i = 0; i < requiredResources.resources.length; i++) {
      if (P_IsUtility.get(requiredResources.resources[i])) {
        assertEq(
          ResourceCount.get(aliceHomeAsteroid, requiredResources.resources[i]),
          requiredResources.amounts[i] * casualtyCount,
          "utility should have been refunded to owner soace rock when fleet took casualties"
        );
      }
    }

    assertEq(UnitCount.get(fleetId, unitPrototype), numberOfUnits - casualtyCount, "fleet should have lost units");
    assertEq(
      LibCombatAttributes.getCargoCapacity(fleetId),
      (numberOfUnits - casualtyCount) * P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype)),
      "fleet cargo should map units"
    );
  }

  // todo: these tests
  function testFleetAttackFleetAttackerKillsDefender() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 minutemanEntity = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 1000;
    }

    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    // create and send alice fleet
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);
    vm.startPrank(alice);
    bytes32 aliceFleetEntity = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    world.sendFleet(aliceFleetEntity, bobHomeAsteroid);

    switchPrank(creator);
    GracePeriod.set(bobHomeAsteroid, block.timestamp);

    // create bob fleet
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 1;
    }
    setupCreateFleet(bob, bobHomeAsteroid, unitCounts, resourceCounts);
    switchPrank(bob);
    bytes32 bobFleetEntity = world.createFleet(bobHomeAsteroid, unitCounts, resourceCounts);

    vm.warp(LibMath.max(FleetMovement.getArrivalTime(aliceFleetEntity), GracePeriod.get(bobFleetEntity)));

    uint256 aliceAttack = LibCombatAttributes.getAttack(aliceFleetEntity);
    uint256 bobDefense = LibCombatAttributes.getDefense(bobFleetEntity);
    uint256 bobHp = LibCombatAttributes.getHp(bobFleetEntity);
    uint256 aliceHp = LibCombatAttributes.getHp(aliceFleetEntity);

    switchPrank(alice);
    world.attack(aliceFleetEntity, bobFleetEntity);

    FleetMovementData memory fleetMovement = FleetMovement.get(bobFleetEntity);

    assertEq(fleetMovement.destination, bobHomeAsteroid, "fleet destination doesn't match");
    assertEq(fleetMovement.origin, bobHomeAsteroid, "fleet origin doesn't match");
    assertEq(fleetMovement.arrivalTime, block.timestamp, "fleet arrival time doesn't match");

    uint256 bobRemainingUnits = UnitCount.get(bobFleetEntity, minutemanEntity);
    assertEq(bobRemainingUnits, 0, "bob units should have been reduced");
  }

  function testFleetAttackFleetDefenderKillsAttacker() public {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256[] memory unitCounts = new uint256[](unitPrototypes.length);
    //create fleet with 1 minuteman marine
    bytes32 minutemanEntity = P_EnumToPrototype.get(UnitKey, uint8(EUnit.MinutemanMarine));
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 1;
    }

    uint256[] memory resourceCounts = new uint256[](P_Transportables.length());

    // create and send alice fleet
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);
    vm.startPrank(alice);
    bytes32 aliceFleetEntity = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    world.sendFleet(aliceFleetEntity, bobHomeAsteroid);

    // create bob fleet
    for (uint256 i = 0; i < unitPrototypes.length; i++) {
      if (unitPrototypes[i] == minutemanEntity) unitCounts[i] = 1000;
    }
    setupCreateFleet(bob, bobHomeAsteroid, unitCounts, resourceCounts);
    switchPrank(bob);
    bytes32 bobFleetEntity = world.createFleet(bobHomeAsteroid, unitCounts, resourceCounts);

    switchPrank(creator);

    GracePeriod.set(bobFleetEntity, block.timestamp - 1);

    uint256 aliceAttack = LibCombatAttributes.getAttack(aliceFleetEntity);
    uint256 bobDefense = LibCombatAttributes.getDefense(bobFleetEntity);
    uint256 bobHp = LibCombatAttributes.getHp(bobFleetEntity);
    uint256 aliceHp = LibCombatAttributes.getHp(aliceFleetEntity);

    switchPrank(alice);
    console.log("timestamp %s, grace period, %s", block.timestamp, GracePeriod.get(bobFleetEntity));
    console.log(
      "alice arrival %s, bobArrival, %s",
      FleetMovement.getArrivalTime(aliceFleetEntity),
      FleetMovement.getArrivalTime(bobFleetEntity)
    );
    world.attack(aliceFleetEntity, bobFleetEntity);

    FleetMovementData memory fleetMovement = FleetMovement.get(aliceFleetEntity);

    assertEq(fleetMovement.destination, aliceHomeAsteroid, "fleet destination doesn't match");
    assertEq(fleetMovement.origin, aliceHomeAsteroid, "fleet origin doesn't match");
    assertEq(fleetMovement.arrivalTime, block.timestamp, "fleet arrival time doesn't match");

    uint256 aliceRemainingUnits = UnitCount.get(aliceFleetEntity, minutemanEntity);
    assertEq(aliceRemainingUnits, 0, "alice units should have been reduced");

    uint256 bobRemainingUnits = UnitCount.get(bobFleetEntity, minutemanEntity);
    assertGt(bobRemainingUnits, 0, "bob units should not be 0");
  }

  /* ------------------------------ FAILURE CASES ----------------------------- */
  function testAttackWrongOwner() public {
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
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    world.sendFleet(fleetId, bobHomeAsteroid);

    switchPrank(creator);
    GracePeriod.set(bobHomeAsteroid, block.timestamp);

    vm.warp(LibMath.max(FleetMovement.getArrivalTime(fleetId), GracePeriod.get(bobHomeAsteroid)));

    uint256 unitCargo = P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype));
    assertTrue(unitCargo > 0, "unit cargo should more than 0");
    increaseResource(bobHomeAsteroid, EResource.Iron, unitCargo);
    assertGt(GracePeriod.get(fleetId), 0, "fleet should be in grace period");
    assertGt(GracePeriod.get(aliceHomeAsteroid), 0, "home rock should be in grace period");

    switchPrank(bob);
    vm.expectRevert("[Fleet] Not fleet owner");
    world.attack(fleetId, bobHomeAsteroid);
    vm.stopPrank();
  }

  function testFleetAttackAsteroidInGracePeriod() public {
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
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    world.sendFleet(fleetId, bobHomeAsteroid);

    vm.warp(GracePeriod.get(bobHomeAsteroid) - 1);

    uint256 unitCargo = P_Unit.getCargo(unitPrototype, UnitLevel.get(aliceHomeAsteroid, unitPrototype));
    assertGt(unitCargo, 0, "unit cargo should more than 0");
    increaseResource(bobEntity, EResource.Iron, unitCargo);

    vm.expectRevert("[Fleet] Target is in grace period");
    switchPrank(alice);
    world.attack(fleetId, bobHomeAsteroid);
  }

  function testFleetAttackInStance() public {
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
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    world.sendFleet(fleetId, bobHomeAsteroid);

    switchPrank(creator);

    vm.warp(LibMath.max(FleetMovement.getArrivalTime(fleetId), GracePeriod.get(bobHomeAsteroid)));

    switchPrank(alice);
    world.setFleetStance(fleetId, uint8(EFleetStance.Defend), bobHomeAsteroid);
    vm.expectRevert("[Fleet] Fleet cannot be in stance");
    world.attack(fleetId, bobHomeAsteroid);

    world.setFleetStance(fleetId, uint8(EFleetStance.Block), bobHomeAsteroid);

    vm.expectRevert("[Fleet] Fleet cannot be in stance");
    world.attack(fleetId, bobHomeAsteroid);
  }

  function testAttackNotInOrbit() public {
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
    setupCreateFleet(alice, aliceHomeAsteroid, unitCounts, resourceCounts);

    vm.startPrank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeAsteroid, unitCounts, resourceCounts);
    vm.warp(LibMath.max(FleetMovement.getArrivalTime(fleetId), GracePeriod.get(bobHomeAsteroid)));

    switchPrank(alice);
    vm.expectRevert("[Fleet] Fleet is not in orbit");
    world.attack(fleetId, bobHomeAsteroid);
  }
}
