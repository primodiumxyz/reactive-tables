// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { EResource } from "src/Types.sol";
import { FleetMovement, ResourceCount, MaxResourceCount, IsFleet, P_Transportables, UnitCount, P_Unit, P_UnitData, UnitLevel, ResourceCount, OwnedBy, P_UnitPrototypes } from "codegen/index.sol";
import { LibFleet } from "libraries/fleet/LibFleet.sol";
import { LibResource } from "libraries/LibResource.sol";
import { FleetsMap } from "libraries/fleet/FleetsMap.sol";
import { LibFleetStance } from "libraries/fleet/LibFleetStance.sol";
import { FleetsMap } from "libraries/fleet/FleetsMap.sol";
import { FleetKey, FleetOwnedByKey, FleetIncomingKey, FleetStanceKey } from "src/Keys.sol";

import { WORLD_SPEED_SCALE, UNIT_SPEED_SCALE } from "src/constants.sol";
import { EResource, EFleetStance } from "src/Types.sol";

library LibCombatAttributes {
  /* --------------------------- Asteroid and Fleet --------------------------- */

  function getAllUnits(bytes32 entity) internal view returns (uint256[] memory units) {
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    units = new uint256[](unitPrototypes.length);
    for (uint8 i = 0; i < unitPrototypes.length; i++) {
      units[i] = UnitCount.get(entity, unitPrototypes[i]);
    }
    return units;
  }

  function getAttack(bytes32 entity) internal view returns (uint256 attack) {
    bytes32 asteroid = IsFleet.get(entity) ? OwnedBy.get(entity) : entity;
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    for (uint8 i = 0; i < unitPrototypes.length; i++) {
      uint256 unitCount = UnitCount.get(entity, unitPrototypes[i]);
      if (unitCount == 0) continue;
      uint256 unitLevel = UnitLevel.get(asteroid, unitPrototypes[i]);
      attack += P_Unit.getAttack(unitPrototypes[i], unitLevel) * unitCount;
    }
  }

  function getAttackWithAllies(bytes32 entity) internal view returns (uint256 attack) {
    attack = getAttack(entity);
    bytes32[] memory allies = LibFleetStance.getAllies(entity);
    for (uint8 i = 0; i < allies.length; i++) {
      attack += getAttack(allies[i]);
    }
  }

  function getAttacksWithAllies(
    bytes32 entity
  ) internal view returns (uint256 attack, uint256[] memory attacks, uint256 totalAttack) {
    bytes32[] memory allies = LibFleetStance.getAllies(entity);

    attacks = new uint256[](allies.length);

    attack = getAttack(entity);
    totalAttack += attack;
    for (uint8 i = 0; i < allies.length; i++) {
      attacks[i] = getAttack(allies[i]);
      totalAttack += attacks[i];
    }
  }

  function getDefense(bytes32 entity) internal view returns (uint256) {
    bool isFleet = IsFleet.get(entity);
    bytes32 asteroid = isFleet ? OwnedBy.get(entity) : entity;
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    uint256 unitDefense = 0;
    for (uint8 i = 0; i < unitPrototypes.length; i++) {
      uint256 unitCount = UnitCount.get(entity, unitPrototypes[i]);
      if (unitCount == 0) continue;
      uint256 unitLevel = UnitLevel.get(asteroid, unitPrototypes[i]);
      unitDefense += P_Unit.getDefense(unitPrototypes[i], unitLevel) * unitCount;
    }
    if (isFleet) return unitDefense;
    uint256 maxHp = MaxResourceCount.get(asteroid, uint8(EResource.R_HP));
    uint256 hp = ResourceCount.get(asteroid, uint8(EResource.R_HP));
    uint256 defenseResource = ResourceCount.get(asteroid, uint8(EResource.U_Defense));
    uint256 defense = ((defenseResource + unitDefense) *
      (100 + ResourceCount.get(asteroid, uint8(EResource.M_DefenseMultiplier)))) / 100;
    if (maxHp == 0) return defense;
    return (defense * hp) / maxHp;
  }

  function getDefenseWithAllies(bytes32 entity) internal view returns (uint256 defense) {
    defense = getDefense(entity);
    bytes32[] memory allies = LibFleetStance.getAllies(entity);
    for (uint8 i = 0; i < allies.length; i++) {
      defense += getDefense(allies[i]);
    }
  }

  function getDefensesWithAllies(
    bytes32 entity
  ) internal view returns (uint256 defense, uint256[] memory defenses, uint256 totalDefense) {
    bytes32[] memory allies = LibFleetStance.getAllies(entity);

    defenses = new uint256[](allies.length);

    defense = getDefense(entity);
    totalDefense += defense;

    for (uint8 i = 0; i < allies.length; i++) {
      defenses[i] = getDefense(allies[i]);
      totalDefense += defenses[i];
    }
  }

  function getHp(bytes32 entity) internal view returns (uint256 hp) {
    bytes32 ownerSpaceRock = IsFleet.get(entity) ? OwnedBy.get(entity) : entity;
    hp += ResourceCount.get(entity, uint8(EResource.R_HP));
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    for (uint8 i = 0; i < unitPrototypes.length; i++) {
      uint256 unitCount = UnitCount.get(entity, unitPrototypes[i]);
      if (unitCount == 0) continue;
      uint256 unitLevel = UnitLevel.get(ownerSpaceRock, unitPrototypes[i]);
      hp += P_Unit.getHp(unitPrototypes[i], unitLevel) * unitCount;
    }
  }

  function getHpWithAllies(bytes32 entity) internal view returns (uint256 hp) {
    hp = getHp(entity);
    bytes32[] memory allies = LibFleetStance.getAllies(entity);
    for (uint8 i = 0; i < allies.length; i++) {
      hp += getHp(allies[i]);
    }
  }

  function getHpsWithAllies(bytes32 entity) internal view returns (uint256 hp, uint256[] memory hps, uint256 totalHp) {
    hp = getHp(entity);
    bytes32[] memory allies = LibFleetStance.getAllies(entity);
    hps = new uint256[](allies.length);
    totalHp = hp;
    for (uint8 i = 0; i < allies.length; i++) {
      hps[i] = getHp(allies[i]);
      totalHp += hps[i];
    }
  }

  function getCargo(bytes32 entity) internal view returns (uint256 cargo) {
    uint8[] memory transportables = P_Transportables.get();
    for (uint8 i = 0; i < transportables.length; i++) {
      cargo += ResourceCount.get(entity, transportables[i]);
    }
  }

  function getCargoWithAllies(bytes32 entity) internal view returns (uint256 cargo) {
    cargo = getCargo(entity);
    bytes32[] memory allies = LibFleetStance.getAllies(entity);
    for (uint8 i = 0; i < allies.length; i++) {
      cargo += getCargo(allies[i]);
    }
  }

  function getCargoCapacity(bytes32 entity) internal view returns (uint256 cargoCapacity) {
    bytes32 asteroid = IsFleet.get(entity) ? OwnedBy.get(entity) : entity;
    bytes32[] memory unitPrototypes = P_UnitPrototypes.get();
    for (uint8 i = 0; i < unitPrototypes.length; i++) {
      uint256 unitCount = UnitCount.get(entity, unitPrototypes[i]);
      uint256 unitLevel = UnitLevel.get(asteroid, unitPrototypes[i]);
      cargoCapacity += P_Unit.getCargo(unitPrototypes[i], unitLevel) * unitCount;
    }
  }

  function getCargoCapacityWithAllies(bytes32 entity) internal view returns (uint256 cargoCapacity) {
    cargoCapacity = getCargoCapacity(entity);
    bytes32[] memory allies = LibFleetStance.getAllies(entity);
    for (uint8 i = 0; i < allies.length; i++) {
      cargoCapacity += getCargoCapacity(allies[i]);
    }
  }

  function getCargoSpace(bytes32 entity) internal view returns (uint256) {
    uint256 cargoCapacity = getCargoCapacity(entity);
    uint256 cargo = getCargo(entity);
    return cargoCapacity > cargo ? cargoCapacity - cargo : 0;
  }

  function getCargoSpaceWithAllies(bytes32 entity) internal view returns (uint256 cargoSpace) {
    cargoSpace = getCargoSpace(entity);
    bytes32[] memory allies = LibFleetStance.getAllies(entity);
    for (uint256 i = 0; i < allies.length; i++) {
      cargoSpace += getCargoSpace(allies[i]);
    }
  }

  function getCargoSpacesWithAllies(
    bytes32 entity
  ) internal view returns (uint256 cargoSpace, uint256[] memory cargoSpaces, uint256 totalCargoSpace) {
    bytes32[] memory allies = LibFleetStance.getAllies(entity);
    cargoSpaces = new uint256[](allies.length);
    cargoSpace = getCargoSpace(entity);
    totalCargoSpace = cargoSpace;

    for (uint8 i = 0; i < allies.length; i++) {
      cargoSpaces[i] = getCargoSpace(allies[i]);
      totalCargoSpace += cargoSpaces[i];
    }
  }

  /* -------------------------------- Asteroid -------------------------------- */

  function getStoredResourceCountWithDefenders(bytes32 asteroid) internal view returns (uint256 totalResources) {
    totalResources = LibResource.getStoredResourceCountVaulted(asteroid);
    bytes32[] memory allies = LibFleetStance.getDefendingFleets(asteroid);
    for (uint256 i = 0; i < allies.length; i++) {
      totalResources += getCargo(allies[i]);
    }
  }

  function getStoredResourceCountsWithDefenders(bytes32 asteroid) internal view returns (uint256[] memory, uint256) {
    (uint256[] memory resourceCounts, uint256 totalResources) = LibResource.getStoredResourceCountsVaulted(asteroid);
    bytes32[] memory defenderFleetIds = LibFleetStance.getDefendingFleets(asteroid);
    for (uint256 i = 0; i < defenderFleetIds.length; i++) {
      uint256[] memory defenderResourceCounts = LibFleet.getResourceCounts(defenderFleetIds[i]);
      for (uint256 j = 0; j < defenderResourceCounts.length; j++) {
        resourceCounts[j] += defenderResourceCounts[j];
        totalResources += defenderResourceCounts[j];
      }
    }
    return (resourceCounts, totalResources);
  }

  function getEncryption(bytes32 asteroid) internal view returns (uint256 encryption) {
    encryption = ResourceCount.get(asteroid, uint8(EResource.R_Encryption));
  }
}
