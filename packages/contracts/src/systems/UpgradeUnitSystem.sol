// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { PrimodiumSystem } from "systems/internal/PrimodiumSystem.sol";

import { OwnedBy, P_EnumToPrototype, P_MaxLevel, UnitLevel } from "codegen/index.sol";
import { LibBuilding, LibResource, LibProduction } from "codegen/Libraries.sol";
import { EUnit } from "src/Types.sol";
import { UnitKey } from "src/Keys.sol";

import { spendUpgradeResources } from "libraries/SubsystemCalls.sol";

contract UpgradeUnitSystem is PrimodiumSystem {
  /// @notice Upgrades the specified unit for the sender
  /// @param unit The type of unit to upgrade
  function upgradeUnit(bytes32 spaceRockEntity, EUnit unit) public _claimResources(spaceRockEntity) {
    bytes32 playerEntity = _player();
    bytes32 unitPrototype = P_EnumToPrototype.get(UnitKey, uint8(unit));
    uint256 currentLevel = UnitLevel.get(spaceRockEntity, unitPrototype);
    uint256 targetLevel = currentLevel + 1;
    require(OwnedBy.get(spaceRockEntity) == playerEntity, "[UpgradeUnitSystem] space rock not owned by player");
    require(unit != EUnit.NULL && unit != EUnit.LENGTH, "[UpgradeUnitSystem] Invalid unit");

    require(
      LibBuilding.hasRequiredBaseLevel(spaceRockEntity, unitPrototype, targetLevel),
      "[UpgradeUnitSystem] MainBase level requirement not met"
    );

    require(targetLevel <= P_MaxLevel.get(unitPrototype), "[UpgradeUnitSystem] Max level reached");

    spendUpgradeResources(spaceRockEntity, unitPrototype, targetLevel);

    UnitLevel.set(spaceRockEntity, unitPrototype, targetLevel);
  }
}
