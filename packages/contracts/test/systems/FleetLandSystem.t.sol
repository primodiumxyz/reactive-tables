// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;
import "test/PrimodiumTest.t.sol";

contract FleetLandSystemTest is PrimodiumTest {
  bytes32 aliceHomeSpaceRock;
  bytes32 aliceEntity;

  function setUp() public override {
    super.setUp();
    aliceEntity = addressToEntity(alice);
    aliceHomeSpaceRock = spawn(alice);
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

  function testLandFleetFailInCooldown() public {
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
    vm.prank(alice);
    bytes32 fleetId = world.createFleet(aliceHomeSpaceRock, unitCounts, resourceCounts);

    vm.prank(creator);
    CooldownEnd.set(fleetId, block.timestamp + 1);

    vm.startPrank(alice);
    vm.expectRevert("[Fleet] Fleet is in cooldown");
    world.landFleet(fleetId, aliceHomeSpaceRock);
    vm.stopPrank();
  }
}
