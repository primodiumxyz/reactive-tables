// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { PirateAsteroid, UnitCount, ResourceCount, FleetStance, IsFleet, BattleResult, BattleResultData, FleetMovement, GracePeriod, OwnedBy } from "codegen/index.sol";
import { FleetBaseSystem } from "systems/internal/FleetBaseSystem.sol";
import { LibFleetCombat } from "libraries/fleet/LibFleetCombat.sol";
import { LibCombatAttributes } from "libraries/LibCombatAttributes.sol";
import { EFleetStance, EResource } from "src/Types.sol";
import { CapitalShipPrototypeId } from "codegen/Prototypes.sol";
import { battleRaidResolve, battleApplyDamage, fleetResolveBattleEncryption, transferSpaceRockOwnership, initializeSpaceRockOwnership, fleetResolvePirateAsteroid } from "libraries/SubsystemCalls.sol";

contract FleetCombatSystem is FleetBaseSystem {
  modifier _onlyWhenNotInGracePeriod(bytes32 entity) {
    require(block.timestamp >= GracePeriod.get(entity), "[Fleet] Target is in grace period");
    _;
  }

  function attack(bytes32 entity, bytes32 targetEntity) public {
    if (IsFleet.get(entity)) {
      if (IsFleet.get(targetEntity)) {
        fleetAttackFleet(entity, targetEntity);
      } else {
        fleetAttackSpaceRock(entity, targetEntity);
      }
    } else {
      spaceRockAttackFleet(entity, targetEntity);
    }
  }

  function fleetAttackFleet(
    bytes32 fleetId,
    bytes32 targetFleet
  )
    private
    _onlyFleetOwner(fleetId)
    _onlyWhenNotInCooldown(fleetId)
    _onlyWhenNotInGracePeriod(targetFleet)
    _onlyWhenNotInStance(fleetId)
    _onlyWhenFleetsAreIsInSameOrbit(fleetId, targetFleet)
  {
    (bytes32 battleId, BattleResultData memory batteResult) = LibFleetCombat.attack(fleetId, targetFleet);

    afterBattle(battleId, batteResult);
  }

  function fleetAttackSpaceRock(
    bytes32 fleetId,
    bytes32 targetSpaceRock
  )
    private
    _onlyFleetOwner(fleetId)
    _onlyWhenNotInCooldown(fleetId)
    _onlyWhenNotInStance(fleetId)
    _onlyWhenNotInGracePeriod(targetSpaceRock)
    _onlyWhenFleetIsInOrbitOfSpaceRock(fleetId, targetSpaceRock)
    _onlyWhenNotPirateAsteroidOrHasNotBeenDefeated(targetSpaceRock)
    _claimResources(targetSpaceRock)
    _claimUnits(targetSpaceRock)
  {
    (bytes32 battleId, BattleResultData memory batteResult) = LibFleetCombat.attack(fleetId, targetSpaceRock);
    afterBattle(battleId, batteResult);
  }

  function spaceRockAttackFleet(
    bytes32 spaceRock,
    bytes32 targetFleet
  )
    private
    _onlyWhenNotInGracePeriod(targetFleet)
    _onlySpaceRockOwner(spaceRock)
    _onlyWhenFleetIsInOrbitOfSpaceRock(targetFleet, spaceRock)
    _claimResources(spaceRock)
    _claimUnits(spaceRock)
  {
    (bytes32 battleId, BattleResultData memory battleResult) = LibFleetCombat.attack(spaceRock, targetFleet);
    afterBattle(battleId, battleResult);
  }

  function afterBattle(bytes32 battleId, BattleResultData memory battleResult) internal {
    bool isAggressorWinner = battleResult.winner == battleResult.aggressorEntity;

    bool isAggressorFleet = IsFleet.get(battleResult.aggressorEntity);

    bool isTargetFleet = IsFleet.get(battleResult.targetEntity);
    bytes32 defendingPlayerEntity = isTargetFleet
      ? OwnedBy.get(OwnedBy.get(battleResult.targetEntity))
      : OwnedBy.get(battleResult.targetEntity);
    bool isPirateAsteroid = PirateAsteroid.getIsPirateAsteroid(battleResult.targetEntity);

    bool decrypt = isAggressorFleet && UnitCount.get(battleResult.aggressorEntity, CapitalShipPrototypeId) > 0;
    bool isRaid = isAggressorWinner && (isTargetFleet || !decrypt || isPirateAsteroid);
    bool isDecryption = !isRaid && isAggressorWinner && !isTargetFleet && decrypt && !isPirateAsteroid;

    if (battleResult.targetDamage > 0)
      battleApplyDamage(battleId, defendingPlayerEntity, battleResult.aggressorEntity, battleResult.targetDamage);

    if (isRaid) {
      battleRaidResolve(battleId, battleResult.aggressorEntity, battleResult.targetEntity);
    }
    if (isDecryption) {
      //in decryption we resolve encryption first so the fleet decryption unit isn't lost before decrypting
      LibFleetCombat.resolveBattleEncryption(battleId, battleResult.targetEntity, battleResult.aggressorEntity);
      if (ResourceCount.get(battleResult.targetEntity, uint8(EResource.R_Encryption)) == 0) {
        if (OwnedBy.get(battleResult.targetEntity) != bytes32(0)) {
          transferSpaceRockOwnership(battleResult.targetEntity, _player());
        } else {
          initializeSpaceRockOwnership(battleResult.targetEntity, _player());
        }
      }
    }
    battleApplyDamage(battleId, _player(), battleResult.targetEntity, battleResult.aggressorDamage);
    if (isPirateAsteroid && isAggressorWinner) {
      fleetResolvePirateAsteroid(_player(), battleResult.targetEntity);
    }
  }
}
