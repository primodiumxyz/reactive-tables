// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;
import { buildMainBase } from "src/libraries/SubsystemCalls.sol";
import { EObjectives } from "src/Types.sol";
import { ObjectiveKey } from "src/Keys.sol";
import { initializeSpaceRockOwnership } from "src/libraries/SubsystemCalls.sol";
import "test/PrimodiumTest.t.sol";

contract ClaimObjectiveSystemTest is PrimodiumTest {
  bytes32 playerEntity = "playerEntity";
  bytes32 enemy = "enemy";

  bytes32 unit1 = "unit1";
  bytes32 unit2 = "unit2";

  bytes32 homeRock;
  bytes32 rock = "rock";

  function setUp() public override {
    super.setUp();
    playerEntity = addressToEntity(creator);
    homeRock = spawn(creator);
    vm.startPrank(creator);
  }

  function setupRaid() internal {
    bytes32[] memory unitTypes = new bytes32[](P_UnitPrototypes.length());
    unitTypes[0] = unit1;
    P_UnitPrototypes.set(unitTypes);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    Home.set(enemy, rock);
    MaxResourceCount.set(
      spaceRockEntity,
      uint8(EResource.Iron),
      MaxResourceCount.get(spaceRockEntity, uint8(EResource.Iron)) + 100
    );
    ResourceCount.set(rock, Iron, 100);
    P_IsUtility.set(Platinum, true);
    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Platinum), 1000);
    ResourceCount.set(rock, Platinum, 500);
    LibResource.claimAllResources(spaceRockEntity);
    LibResource.claimAllResources(rock);
  }

  function testClaimMainBaseLevelObjective() public {
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)));
    P_RequiredBaseLevel.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), 1, 2);
    Level.set(Home.get(Home.get(playerEntity)), 2);
    MaxResourceCount.set(playerEntity, uint8(EResource.Iron), 100);
    P_ResourceRewardData memory resourceRewardData = P_ResourceRewardData(new uint8[](1), new uint256[](1));
    resourceRewardData.resources[0] = uint8(EResource.Iron);
    resourceRewardData.amounts[0] = 100;
    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), resourceRewardData);

    world.claimObjective(homeRock, EObjectives.BuildIronMine);
  }

  function testFailClaimMainBaseLevelObjective() public {
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)));
    P_RequiredBaseLevel.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), 1, 2);
    world.claimObjective(homeRock, EObjectives.BuildIronMine);
  }

  function testFailClaimInvalidObjective() public {
    world.claimObjective(homeRock, EObjectives.LENGTH);
  }

  function testFailRequiredClaimObjective() public {
    bytes32[] memory objectives = new bytes32[](1);
    objectives[0] = P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine));
    P_RequiredObjectives.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), objectives);
    world.claimObjective(homeRock, EObjectives.BuildCopperMine);
  }

  function testClaimObjective() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)));
    console.log("claiming objective", uint256(P_EnumToPrototype.get(BuildingKey, uint8(EBuilding.IronMine))));
    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 100);
    P_ResourceRewardData memory resourceRewardData = P_ResourceRewardData(new uint8[](1), new uint256[](1));
    resourceRewardData.resources[0] = uint8(EResource.Iron);
    resourceRewardData.amounts[0] = 100;
    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), resourceRewardData);

    world.claimObjective(homeRock, EObjectives.BuildIronMine);
    assertEq(
      ResourceCount.get(spaceRockEntity, uint8(EResource.Iron)),
      resourceRewardData.amounts[0],
      "Resource does not match"
    );
  }

  function testClaimObjectiveReceiveResourceRewards() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 0);
    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 100);
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)));
    P_ResourceRewardData memory resourceRewardData = P_ResourceRewardData(new uint8[](1), new uint256[](1));
    resourceRewardData.resources[0] = uint8(EResource.Iron);
    resourceRewardData.amounts[0] = 100;
    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), resourceRewardData);
    world.claimObjective(homeRock, EObjectives.BuildIronMine);
    assertEq(
      ResourceCount.get(spaceRockEntity, uint8(EResource.Iron)),
      resourceRewardData.amounts[0],
      "Resource does not match"
    );
  }

  function testFailClaimObjectiveReceiveResourceRewards() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 0);
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)));
    P_ResourceRewardData memory resourceRewardData = P_ResourceRewardData(new uint8[](1), new uint256[](1));
    resourceRewardData.resources[0] = uint8(EResource.Iron);
    resourceRewardData.amounts[0] = 100;
    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), resourceRewardData);
    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 0);
    console.log(ResourceCount.get(spaceRockEntity, uint8(EResource.Iron)));
    world.claimObjective(homeRock, EObjectives.BuildIronMine);
    console.log(ResourceCount.get(spaceRockEntity, uint8(EResource.Iron)));
  }

  function testClaimObjectiveReceiveUnitRewards() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    UnitCount.set(Home.get(playerEntity), unit1, 0);
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)));
    P_UnitRewardData memory unitRewardData = P_UnitRewardData(new bytes32[](1), new uint256[](1));
    unitRewardData.units[0] = unit1;
    unitRewardData.amounts[0] = 100;
    P_UnitReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), unitRewardData);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(EResource.U_Housing);
    requiredResourcesData.amounts[0] = 1;
    P_RequiredResources.set(unit1, 0, requiredResourcesData);

    // provide the required housing
    LibProduction.increaseResourceProduction(spaceRockEntity, EResource.U_Housing, 100);

    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 100);
    P_ResourceRewardData memory resourceRewardData = P_ResourceRewardData(new uint8[](1), new uint256[](1));
    resourceRewardData.resources[0] = uint8(EResource.Iron);
    resourceRewardData.amounts[0] = 100;
    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), resourceRewardData);

    world.claimObjective(homeRock, EObjectives.BuildIronMine);
    assertEq(UnitCount.get(Home.get(playerEntity), unit1), unitRewardData.amounts[0], "Unit count does not match");
  }

  function testFailClaimObjectiveReceiveUnitRewards() public {
    UnitCount.set(Home.get(playerEntity), unit1, 0);
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)));
    P_UnitRewardData memory unitRewardData = P_UnitRewardData(new bytes32[](1), new uint256[](1));
    unitRewardData.units[0] = unit1;
    unitRewardData.amounts[0] = 100;
    P_UnitReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), unitRewardData);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(EResource.U_Housing);
    requiredResourcesData.amounts[0] = 1;
    P_RequiredResources.set(unit1, 0, requiredResourcesData);

    world.claimObjective(homeRock, EObjectives.BuildIronMine);
  }

  function testFailClaimObjectiveTwice() public {
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)));
    world.claimObjective(homeRock, EObjectives.BuildIronMine);
    world.claimObjective(homeRock, EObjectives.BuildIronMine);
  }

  function testClaimObjectiveHasBuiltBuilding() public {
    world.build(EBuilding.IronMine, getTilePosition(homeRock, EBuilding.IronMine));
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 100);
    P_ResourceRewardData memory resourceRewardData = P_ResourceRewardData(new uint8[](1), new uint256[](1));
    resourceRewardData.resources[0] = uint8(EResource.Iron);
    resourceRewardData.amounts[0] = 100;
    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), resourceRewardData);

    world.claimObjective(homeRock, EObjectives.BuildIronMine);
  }

  function testClaimObjectiveHasProducedResources() public {
    world.build(EBuilding.IronMine, getTilePosition(homeRock, EBuilding.IronMine));
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 100);
    P_ResourceRewardData memory resourceRewardData = P_ResourceRewardData(new uint8[](1), new uint256[](1));
    resourceRewardData.resources[0] = uint8(EResource.Iron);
    resourceRewardData.amounts[0] = 100;
    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), resourceRewardData);

    P_ProducedResourcesData memory producedResourcesData = P_ProducedResourcesData(new uint8[](1), new uint256[](1));
    producedResourcesData.resources[0] = uint8(EResource.Iron);
    producedResourcesData.amounts[0] =
      P_Production.getAmounts(P_EnumToPrototype.get(BuildingKey, uint8(EBuilding.IronMine)), 1)[0] *
      10;
    P_ProducedResources.set(
      P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)),
      producedResourcesData
    );
    MaxResourceCount.set(
      spaceRockEntity,
      uint8(EResource.Iron),
      P_Production.getAmounts(P_EnumToPrototype.get(BuildingKey, uint8(EBuilding.IronMine)), 1)[0] * 100
    );
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)));
    LastClaimedAt.set(spaceRockEntity, block.timestamp - 10);

    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), resourceRewardData);
    world.claimObjective(homeRock, EObjectives.BuildCopperMine);

    assertEq(
      ResourceCount.get(spaceRockEntity, uint8(EResource.Iron)),
      producedResourcesData.amounts[0] + 100,
      "Produced Resource does not match"
    );
  }

  function testFailClaimObjectiveHasProducedResources() public {
    world.build(EBuilding.IronMine, getTilePosition(homeRock, EBuilding.IronMine));
    bytes32 spaceRockEntity = Home.get(playerEntity);
    world.claimObjective(homeRock, EObjectives.BuildIronMine);
    P_ProducedResourcesData memory producedResourcesData = P_ProducedResourcesData(new uint8[](1), new uint256[](1));
    producedResourcesData.resources[0] = uint8(EResource.Iron);
    producedResourcesData.amounts[0] =
      P_Production.getAmounts(P_EnumToPrototype.get(BuildingKey, uint8(EBuilding.IronMine)), 1)[0] *
      10;
    P_ProducedResources.set(
      P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)),
      producedResourcesData
    );
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)));
    LastClaimedAt.set(spaceRockEntity, block.timestamp - 5);
    world.claimObjective(homeRock, EObjectives.BuildCopperMine);
  }

  function testClaimObjectiveRequiredObjectives() public {
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)));
    bytes32[] memory objectives = new bytes32[](1);
    objectives[0] = P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine));
    P_RequiredObjectives.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), objectives);

    CompletedObjective.set(
      addressToEntity(creator),
      P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)),
      true
    );
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 100);
    P_ResourceRewardData memory resourceRewardData = P_ResourceRewardData(new uint8[](1), new uint256[](1));
    resourceRewardData.resources[0] = uint8(EResource.Iron);
    resourceRewardData.amounts[0] = 100;
    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), resourceRewardData);

    world.claimObjective(homeRock, EObjectives.BuildCopperMine);
  }

  function testFailClaimObjectiveRaidedResources() public {
    P_RaidedResourcesData memory raidedResourcesData = P_RaidedResourcesData(new uint8[](1), new uint256[](1));
    raidedResourcesData.resources[0] = uint8(EResource.Iron);
    raidedResourcesData.amounts[0] = 100;
    P_RaidedResources.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), raidedResourcesData);
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)));
    world.claimObjective(homeRock, EObjectives.BuildCopperMine);
  }

  function testFailClaimObjectiveDestroyedUnits() public {
    P_DestroyedUnitsData memory destroyedUnitsData = P_DestroyedUnitsData(new bytes32[](1), new uint256[](1));
    destroyedUnitsData.units[0] = unit1;
    destroyedUnitsData.amounts[0] = 100;
    P_DestroyedUnits.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), destroyedUnitsData);
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)));

    world.claimObjective(homeRock, EObjectives.BuildCopperMine);
  }

  function testClaimObjectiveRequiredUnits() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 100);
    P_RequiredUnitsData memory requiredUnitsData = P_RequiredUnitsData(new bytes32[](1), new uint256[](1));
    requiredUnitsData.units[0] = unit1;
    requiredUnitsData.amounts[0] = 100;
    P_RequiredUnits.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), requiredUnitsData);
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)));
    UnitCount.set(Home.get(playerEntity), unit1, 100);

    P_ResourceRewardData memory resourceRewardData = P_ResourceRewardData(new uint8[](1), new uint256[](1));
    resourceRewardData.resources[0] = uint8(EResource.Iron);
    resourceRewardData.amounts[0] = 100;
    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), resourceRewardData);
    world.claimObjective(homeRock, EObjectives.BuildCopperMine);
  }

  function testFailClaimObjectiveRequiredUnits() public {
    P_RequiredUnitsData memory requiredUnitsData = P_RequiredUnitsData(new bytes32[](1), new uint256[](1));
    requiredUnitsData.units[0] = unit1;
    requiredUnitsData.amounts[0] = 100;
    P_RequiredUnits.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), requiredUnitsData);
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)));

    world.claimObjective(homeRock, EObjectives.BuildCopperMine);
  }

  function testClaimObjectiveProducedUnits() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 100);
    P_ProducedUnitsData memory producedUnitsData = P_ProducedUnitsData(new bytes32[](1), new uint256[](1));
    producedUnitsData.units[0] = unit1;
    producedUnitsData.amounts[0] = 100;
    P_ProducedUnits.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), producedUnitsData);
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)));
    ProducedUnit.set(playerEntity, unit1, 100);

    P_ResourceRewardData memory resourceRewardData = P_ResourceRewardData(new uint8[](1), new uint256[](1));
    resourceRewardData.resources[0] = uint8(EResource.Iron);
    resourceRewardData.amounts[0] = 100;
    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), resourceRewardData);

    world.claimObjective(homeRock, EObjectives.BuildCopperMine);
  }

  function testFailClaimObjectiveProducedUnits() public {
    P_ProducedUnitsData memory producedUnitsData = P_ProducedUnitsData(new bytes32[](1), new uint256[](1));
    producedUnitsData.units[0] = unit1;
    producedUnitsData.amounts[0] = 100;
    P_ProducedUnits.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), producedUnitsData);
    P_HasBuiltBuildings.deleteRecord(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)));

    world.claimObjective(homeRock, EObjectives.BuildCopperMine);
  }

  function setupSpawnPirateAsteroid(
    bytes32 objectivePrototype,
    int32 x,
    int32 y,
    uint256 unit1Count,
    uint256 ironCount
  ) internal returns (P_SpawnPirateAsteroidData memory spawnPirateAsteroid) {
    bytes32[] memory unitTypes = new bytes32[](P_UnitPrototypes.length());
    unitTypes[0] = unit1;
    unitTypes[1] = unit2;
    P_UnitPrototypes.set(unitTypes);
    P_HasBuiltBuildings.deleteRecord(objectivePrototype);

    spawnPirateAsteroid.x = x;
    spawnPirateAsteroid.y = y;
    spawnPirateAsteroid.resources = new uint8[](1);
    spawnPirateAsteroid.resources[0] = uint8(EResource.Iron);
    spawnPirateAsteroid.resourceAmounts = new uint256[](1);
    spawnPirateAsteroid.resourceAmounts[0] = ironCount;
    spawnPirateAsteroid.units = new bytes32[](1);
    spawnPirateAsteroid.units[0] = unit1;
    spawnPirateAsteroid.unitAmounts = new uint256[](1);
    spawnPirateAsteroid.unitAmounts[0] = unit1Count;

    P_SpawnPirateAsteroid.set(objectivePrototype, spawnPirateAsteroid);
  }

  function setupSpawnPirateAsteroid(
    bytes32 objectivePrototype
  ) internal returns (P_SpawnPirateAsteroidData memory spawnPirateAsteroid) {
    spawnPirateAsteroid = setupSpawnPirateAsteroid(objectivePrototype, 10, -10, 10, 100);
  }

  function testSecondPirateAsteroid() public {
    bytes32 objectivePrototype = P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine));
    setupSpawnPirateAsteroid(objectivePrototype);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 200);
    P_ResourceRewardData memory resourceRewardData = P_ResourceRewardData(new uint8[](1), new uint256[](1));
    resourceRewardData.resources[0] = uint8(EResource.Iron);
    resourceRewardData.amounts[0] = 100;
    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), resourceRewardData);

    world.claimObjective(homeRock, EObjectives.BuildIronMine);

    bytes32 personalPirateEntity = LibEncode.getHash(PirateKey, playerEntity);
    bytes32 pirateAsteroidEntity = LibEncode.getHash(personalPirateEntity);

    PositionData memory pirateAsteroidPosition = Position.get(pirateAsteroidEntity);

    objectivePrototype = P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine));
    setupSpawnPirateAsteroid(objectivePrototype, 100, 100, 10, 300);

    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildCopperMine)), resourceRewardData);

    world.claimObjective(homeRock, EObjectives.BuildCopperMine);
    assertEq(
      ReversePosition.get(pirateAsteroidPosition.x, pirateAsteroidPosition.y) != pirateAsteroidEntity,
      true,
      "Pirate asteroid not moved"
    );
    assertTrue(Position.get(pirateAsteroidEntity).x != pirateAsteroidPosition.x, "Pirate asteroid not moved");
    assertEq(ResourceCount.get(pirateAsteroidEntity, uint8(Iron)), 400, "Resource count does not match");
    assertEq(UnitCount.get(pirateAsteroidEntity, unit1), 10, "Unit count does not match");
  }

  function testClaimObjectiveSpawnPirateAsteroid() public {
    bytes32 objectivePrototype = P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine));
    setupSpawnPirateAsteroid(objectivePrototype);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, uint8(EResource.Iron), 100);
    P_ResourceRewardData memory resourceRewardData = P_ResourceRewardData(new uint8[](1), new uint256[](1));
    resourceRewardData.resources[0] = uint8(EResource.Iron);
    resourceRewardData.amounts[0] = 100;
    P_ResourceReward.set(P_EnumToPrototype.get(ObjectiveKey, uint8(EObjectives.BuildIronMine)), resourceRewardData);

    world.claimObjective(homeRock, EObjectives.BuildIronMine);
    bytes32 personalPirateEntity = LibEncode.getHash(PirateKey, playerEntity);
    bytes32 pirateAsteroidEntity = LibEncode.getHash(personalPirateEntity);
    assertEq(PirateAsteroid.get(pirateAsteroidEntity).isPirateAsteroid, true, "Pirate asteroid not created");
    assertEq(ResourceCount.get(pirateAsteroidEntity, uint8(Iron)), 100, "Resource count does not match");
    assertEq(UnitCount.get(pirateAsteroidEntity, unit1), 10, "Unit count does not match");
  }
}
