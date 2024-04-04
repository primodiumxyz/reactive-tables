// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";
import { WorldResourceIdInstance, WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { AccessControl } from "@latticexyz/world/src/AccessControl.sol";

contract MoveBuildingSystemTest is PrimodiumTest {
  bytes32 playerEntity;

  function setUp() public override {
    super.setUp();
    // init other
    spawn(creator);
    spawn(bob);
    playerEntity = addressToEntity(creator);
    vm.startPrank(creator);
  }

  function testMoveShipyard() public {
    EBuilding building = EBuilding.Shipyard;
    Dimensions.set(ExpansionKey, 1, 35, 27);
    P_RequiredResourcesData memory requiredResources = getBuildCost(building);
    provideResources(Home.get(playerEntity), requiredResources);
    vm.startPrank(creator);
    removeRequirements(building);
    P_RequiredBaseLevel.set(P_EnumToPrototype.get(BuildingKey, uint8(EBuilding.Shipyard)), 1, 0);

    PositionData memory originalPosition = getTilePosition(Home.get(playerEntity), building);
    world.build(building, originalPosition);
    PositionData memory newPosition = getTilePosition(Home.get(playerEntity), building);
    uint256 gas = gasleft();
    world.moveBuilding(originalPosition, newPosition);
    console.log("after", gas - gasleft());
  }

  function testMove() public {
    bytes32 mainBaseEntity = Home.get(Home.get(playerEntity));
    PositionData memory mainBasePosition = Position.get(mainBaseEntity);
    PositionData memory newPosition = PositionData(
      mainBasePosition.x + 3,
      mainBasePosition.y + 3,
      mainBasePosition.parent
    );
    bytes32[] memory oldChildren = Children.get(mainBaseEntity);

    uint256 gas = gasleft();
    world.moveBuilding(mainBasePosition, newPosition);
    console.log("after", gas - gasleft());
    assertEq(
      mainBaseEntity,
      LibBuilding.getBuildingFromCoord(newPosition),
      "building entity should be same at new position"
    );
    mainBasePosition = Position.get(mainBaseEntity);
    assertEq(mainBasePosition.x, newPosition.x, "building position should have updated");
    assertEq(mainBasePosition.y, newPosition.y, "building position should have updated");
    assertEq(mainBasePosition.parent, newPosition.parent, "building position should have updated");
    int32[] memory blueprint = P_Blueprint.get(MainBasePrototypeId);
    bytes32[] memory children = Children.get(mainBaseEntity);

    assertEq(blueprint.length, children.length * 2, "children length should match blueprint length");
    for (uint256 i = 0; i < children.length; i++) {
      PositionData memory tilePosition = Position.get(children[i]);
      assertEq(
        tilePosition,
        PositionData(
          blueprint[i * 2] + mainBasePosition.x,
          blueprint[i * 2 + 1] + mainBasePosition.y,
          mainBasePosition.parent
        )
      );
      assertEq(mainBaseEntity, OwnedBy.get(children[i]), "children should be owned by the building");
    }

    for (uint256 i = 0; i < oldChildren.length; i++) {
      assertEq(OwnedBy.get(oldChildren[i]), 0, "old children should be unowned");
    }
  }

  function testFailMoveOutOfBounds() public {
    bytes32 mainBaseEntity = Home.get(Home.get(playerEntity));
    PositionData memory mainBasePosition = Position.get(mainBaseEntity);
    PositionData memory newPosition = PositionData(
      mainBasePosition.x + 15,
      mainBasePosition.y + 15,
      mainBasePosition.parent
    );

    world.moveBuilding(mainBasePosition, newPosition);
  }

  function testMoveSomeSameTiles() public {
    bytes32 mainBaseEntity = Home.get(Home.get(playerEntity));
    PositionData memory mainBasePosition = Position.get(mainBaseEntity);
    PositionData memory newPosition = PositionData(
      mainBasePosition.x + 1,
      mainBasePosition.y + 1,
      mainBasePosition.parent
    );

    world.moveBuilding(mainBasePosition, newPosition);
    mainBasePosition = Position.get(mainBaseEntity);
    assertEq(mainBasePosition.x, newPosition.x, "building position should have updated");
    assertEq(mainBasePosition.y, newPosition.y, "building position should have updated");
    assertEq(mainBasePosition.parent, newPosition.parent, "building position should have updated");
    int32[] memory blueprint = P_Blueprint.get(MainBasePrototypeId);
    bytes32[] memory children = Children.get(mainBaseEntity);

    assertEq(blueprint.length, children.length * 2, "children length should match blueprint length");
    for (uint256 i = 0; i < children.length; i++) {
      PositionData memory tilePosition = Position.get(children[i]);
      assertEq(
        tilePosition,
        PositionData(
          blueprint[i * 2] + mainBasePosition.x,
          blueprint[i * 2 + 1] + mainBasePosition.y,
          mainBasePosition.parent
        )
      );
      assertEq(mainBaseEntity, OwnedBy.get(children[i]), "children should be owned by the building");
    }
  }

  function testMoveBuildTiles() public {
    console.log("testMoveBuildTiles");
    bytes32 mainBaseEntity = Home.get(Home.get(playerEntity));
    PositionData memory mainBasePosition = Position.get(mainBaseEntity);
    PositionData memory newPosition = PositionData(
      mainBasePosition.x - 1,
      mainBasePosition.y - 1,
      mainBasePosition.parent
    );

    uint256 gas = gasleft();
    world.moveBuilding(mainBasePosition, newPosition);
    console.log("after", gas - gasleft());
    uint256 timestamp = block.timestamp;
    vm.warp(block.timestamp + 1);
    assertTrue(timestamp != block.timestamp, "timestamp should have updated");
    assertEq(
      Spawned.get(LibEncode.getTimedHash(BuildingKey, mainBasePosition)),
      false,
      "new building should not be spawned"
    );
    assertTrue(
      LibEncode.getTimedHash(BuildingKey, mainBasePosition) != LibBuilding.getBuildingFromCoord(mainBasePosition),
      "building entity should be different at new timestamp"
    );
    assertTrue(
      mainBaseEntity != LibBuilding.getBuildingFromCoord(mainBasePosition),
      "old tile owner should not be main base"
    );
    assertEq(
      mainBaseEntity,
      LibBuilding.getBuildingFromCoord(newPosition),
      " building entity should be same at new position"
    );
    assertEq(0, LibBuilding.getBuildingFromCoord(mainBasePosition), "there should be no building at the old position");

    P_RequiredTile.deleteRecord(IronMinePrototypeId);
    world.build(EBuilding.IronMine, mainBasePosition);

    assertTrue(
      LibBuilding.getBuildingFromCoord(mainBasePosition) != LibBuilding.getBuildingFromCoord(newPosition),
      "the two buildings should be different"
    );
    assertEq(
      BuildingType.get(LibBuilding.getBuildingFromCoord(mainBasePosition)),
      IronMinePrototypeId,
      "the building should be an iron mine"
    );
    assertEq(
      BuildingType.get(LibBuilding.getBuildingFromCoord(newPosition)),
      MainBasePrototypeId,
      "the building should be MainBase"
    );
  }

  function testFailMoveOnTopOfBuildingTiles() public {
    P_RequiredTile.deleteRecord(IronMinePrototypeId);

    console.log("testMoveBuildTiles");
    bytes32 mainBaseEntity = Home.get(Home.get(playerEntity));
    PositionData memory mainBasePosition = Position.get(mainBaseEntity);

    PositionData memory overlappedPosition = PositionData(
      mainBasePosition.x - 3,
      mainBasePosition.y - 3,
      mainBasePosition.parent
    );
    world.build(EBuilding.IronMine, overlappedPosition);

    PositionData memory newPosition = PositionData(
      mainBasePosition.x - 1,
      mainBasePosition.y - 1,
      mainBasePosition.parent
    );

    world.moveBuilding(mainBasePosition, newPosition);
    console.log("moved success");
    uint256 timestamp = block.timestamp;
    vm.warp(block.timestamp + 1);
    assertTrue(timestamp != block.timestamp, "timestamp should have updated");
    assertEq(
      Spawned.get(LibEncode.getTimedHash(BuildingKey, mainBasePosition)),
      false,
      "new building should not be spawned"
    );
    assertTrue(
      LibEncode.getTimedHash(BuildingKey, mainBasePosition) != LibBuilding.getBuildingFromCoord(mainBasePosition),
      "building entity should be different at new timestamp"
    );
    assertTrue(
      mainBaseEntity != LibBuilding.getBuildingFromCoord(mainBasePosition),
      "old tile owner should not be main base"
    );
    assertEq(
      mainBaseEntity,
      LibBuilding.getBuildingFromCoord(newPosition),
      " building entity should be same at new position"
    );
    assertEq(0, LibBuilding.getBuildingFromCoord(mainBasePosition), "there should be no building at the old position");

    world.build(EBuilding.IronMine, mainBasePosition);

    assertTrue(
      LibBuilding.getBuildingFromCoord(mainBasePosition) != LibBuilding.getBuildingFromCoord(newPosition),
      "the two buildings should be different"
    );
    assertEq(
      BuildingType.get(LibBuilding.getBuildingFromCoord(mainBasePosition)),
      IronMinePrototypeId,
      "the building should be an iron mine"
    );
    assertEq(
      BuildingType.get(LibBuilding.getBuildingFromCoord(newPosition)),
      MainBasePrototypeId,
      "the building should be MainBase"
    );
  }
}
