// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";

contract LibResourceTest is PrimodiumTest {
  bytes32 playerEntity = "playerEntity";
  bytes32 buildingPrototype = "buildingPrototype";
  bytes32 unitPrototype = "unitPrototype";
  bytes32 buildingEntity = "building";
  uint256 level = 2;

  function setUp() public override {
    super.setUp();
    spawn(creator);
    vm.startPrank(creator);
    playerEntity = addressToEntity(creator);
    bytes32 spaceRockEntity = Home.get(playerEntity);
    Level.set(spaceRockEntity, 8);
    BuildingType.set(buildingEntity, buildingPrototype);
    OwnedBy.set(buildingEntity, spaceRockEntity);
  }

  function testClaimAllResourcesBasic() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, Iron, 1000);
    ProductionRate.set(spaceRockEntity, Iron, 10);
    LastClaimedAt.set(spaceRockEntity, block.timestamp - 10);
    LibResource.claimAllResources(spaceRockEntity);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), 100);
  }

  function testClaimAllResourcesConsumptionBasic() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, Copper, 1000);
    ProductionRate.set(spaceRockEntity, Copper, 10);
    P_ConsumesResource.set(Copper, Iron);

    MaxResourceCount.set(spaceRockEntity, Iron, 1000);
    ResourceCount.set(spaceRockEntity, Iron, 1000);

    ConsumptionRate.set(spaceRockEntity, Iron, 100);
    LastClaimedAt.set(spaceRockEntity, block.timestamp - 10);
    LibResource.claimAllResources(spaceRockEntity);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), 0, "iron doesn't match");
    assertEq(ResourceCount.get(spaceRockEntity, Copper), 100, "copper doesn't match");
  }

  function testClaimAllResourcesConsumptionRunOutBasic() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, Copper, 1000);
    ProductionRate.set(spaceRockEntity, Copper, 10);
    P_ConsumesResource.set(Copper, Iron);
    MaxResourceCount.set(spaceRockEntity, Iron, 1000);
    ResourceCount.set(spaceRockEntity, Iron, 500);

    ConsumptionRate.set(spaceRockEntity, Iron, 100);
    LastClaimedAt.set(spaceRockEntity, block.timestamp - 10);
    LibResource.claimAllResources(spaceRockEntity);
    assertEq(ResourceCount.get(spaceRockEntity, Copper), 50);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), 0);
  }

  function testClaimAllResourcesLessThanMax() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, Iron, 50);
    ProductionRate.set(spaceRockEntity, Iron, 10);
    LastClaimedAt.set(spaceRockEntity, block.timestamp - 10);
    LibResource.claimAllResources(spaceRockEntity);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), 50);
  }

  function testClaimAllResourcesZeroProductionRate() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, Iron, 1000);
    LastClaimedAt.set(spaceRockEntity, block.timestamp - 10);
    LibResource.claimAllResources(spaceRockEntity);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), 0);
  }

  function testClaimAllResourcesIsUtility() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, Iron, 1000);
    ProductionRate.set(spaceRockEntity, Iron, 10);
    P_IsUtility.set(Iron, true);
    LastClaimedAt.set(spaceRockEntity, block.timestamp - 10);
    LibResource.claimAllResources(spaceRockEntity);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), 0);
  }

  function testSpendBuildingRequiredResource() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, Iron, 100);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(buildingPrototype, level, requiredResourcesData);

    LibResource.spendBuildingRequiredResources(buildingEntity, level);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), 50);
  }

  function testFailSpendBuildingRequiredResourceInsufficient() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, Iron, 30);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(buildingPrototype, level, requiredResourcesData);

    LibResource.spendBuildingRequiredResources(buildingEntity, level);
  }

  function testSpendBuildingRequiredUtility() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    P_IsUtility.set(Iron, true);
    ResourceCount.set(spaceRockEntity, Iron, 100);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(buildingPrototype, level, requiredResourcesData);

    requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(buildingPrototype, level + 1, requiredResourcesData);
    IsActive.set(buildingEntity, true);
    LibResource.spendBuildingRequiredResources(buildingEntity, level);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), 50);
    assertEq(UtilityMap.get(buildingEntity, Iron), 50);

    LibResource.spendBuildingRequiredResources(buildingEntity, level + 1);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), 0);
    assertEq(UtilityMap.get(buildingEntity, Iron), 100);
  }

  function testFailSpendBuildingRequiredUtilityInsufficient() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    P_IsUtility.set(Iron, true);
    ResourceCount.set(spaceRockEntity, Iron, 30);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(buildingPrototype, 1, requiredResourcesData);
    IsActive.set(buildingEntity, true);
    LibResource.spendBuildingRequiredResources(buildingEntity, 1);
  }

  function testSpendUnitRequiredResource() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, Iron, 100);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(unitPrototype, 0, requiredResourcesData);

    LibResource.spendUnitRequiredResources(spaceRockEntity, unitPrototype, 1);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), 50);
  }

  function testFailSpendUnitRequiredResourceInsufficient() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, Iron, 30);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(unitPrototype, 0, requiredResourcesData);

    LibResource.spendUnitRequiredResources(spaceRockEntity, unitPrototype, 1);
  }

  function testSpendUnitRequiredUtility() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, Iron, 100);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(unitPrototype, 0, requiredResourcesData);

    LibResource.spendUnitRequiredResources(spaceRockEntity, unitPrototype, 1);
    assertEq(ResourceCount.get(spaceRockEntity, Iron), 50);
  }

  function testFailSpendUnitRequiredUtilityInsufficient() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, Iron, 30);

    P_RequiredResourcesData memory requiredResourcesData = P_RequiredResourcesData(new uint8[](1), new uint256[](1));
    requiredResourcesData.resources[0] = uint8(Iron);
    requiredResourcesData.amounts[0] = 50;
    P_RequiredResources.set(unitPrototype, 0, requiredResourcesData);

    LibResource.spendUnitRequiredResources(spaceRockEntity, unitPrototype, 1);
  }

  function testClearUtilityUsage() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    MaxResourceCount.set(spaceRockEntity, Iron, 1000);
    P_IsUtility.set(Iron, true);
    UtilityMap.set(buildingEntity, Iron, 50);
    ResourceCount.set(spaceRockEntity, Iron, 100);
    IsActive.set(buildingEntity, true);
    LibResource.clearUtilityUsage(buildingEntity);

    assertEq(ResourceCount.get(spaceRockEntity, Iron), 150);
    assertEq(UtilityMap.get(buildingEntity, Iron), 0);
  }

  function testGetAllResourceCounts() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    ResourceCount.set(spaceRockEntity, Iron, 100);
    ResourceCount.set(spaceRockEntity, Copper, 200);
    ResourceCount.set(spaceRockEntity, Platinum, 500);
    ResourceCount.set(spaceRockEntity, Kimberlite, 1500);

    (uint256[] memory resources, uint256 totalResources) = LibResource.getStoredResourceCountsVaulted(spaceRockEntity);

    uint8[] memory transportables = P_Transportables.get();

    assertEq(totalResources, 2300);
    for (uint256 i = 0; i < transportables.length; i++) {
      if (transportables[i] == uint8(Iron)) {
        assertEq(resources[i], 100);
      } else if (transportables[i] == uint8(Copper)) {
        assertEq(resources[i], 200);
      } else if (transportables[i] == uint8(Platinum)) {
        assertEq(resources[i], 500);
      } else if (transportables[i] == uint8(Kimberlite)) {
        assertEq(resources[i], 1500);
      } else {
        assertEq(resources[i], 0);
      }
    }
  }

  function testResourceClaimUnderflow() public {
    bytes32 spaceRockEntity = Home.get(playerEntity);
    uint256 startingResourceCount = 100;
    increaseResource(spaceRockEntity, EResource.Iron, startingResourceCount);
    buildBuilding(creator, EBuilding.IronMine);
    buildBuilding(creator, EBuilding.IronPlateFactory);
    buildBuilding(creator, EBuilding.IronPlateFactory);
    buildBuilding(creator, EBuilding.IronPlateFactory);
    uint256 resourceConsumption = ConsumptionRate.get(spaceRockEntity, Iron);
    uint256 resourceProduction = ProductionRate.get(spaceRockEntity, Iron);

    uint256 timeUntilEmpty = startingResourceCount / resourceConsumption;
    vm.warp(block.timestamp + 1000000);

    buildBuilding(creator, EBuilding.IronMine);
  }
}
