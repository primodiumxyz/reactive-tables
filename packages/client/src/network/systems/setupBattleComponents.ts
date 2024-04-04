import { Entity, Has, defineComponentSystem, defineEnterSystem, namespaceWorld } from "@latticexyz/recs";
import { decodeEntity } from "@latticexyz/store-sync/recs";
import { components } from "../components";
import { world } from "../world";

export const setupBattleComponents = () => {
  const systemWorld = namespaceWorld(world, "systems");
  const { RawBattle, RawBattleParticipant, RawBattleParticipants } = components.Battle;

  defineComponentSystem(systemWorld, components.BattleResult, ({ entity, value }) => {
    const battleData = value[0];
    if (!battleData) return RawBattle.remove(entity);
    const data = {
      attacker: battleData.aggressorEntity as Entity,
      attackerDamage: battleData.aggressorDamage,
      defender: battleData.targetEntity as Entity,
      defenderDamage: battleData.targetDamage,
      attackingPlayer: battleData.player as Entity,
      defendingPlayer: battleData.targetPlayer as Entity,
      winner: battleData.winner as Entity,
      rock: battleData.rock as Entity,
      timestamp: battleData.timestamp,
      aggressorAllies: battleData.aggressorAllies as Entity[],
      targetAllies: battleData.targetAllies as Entity[],
    };

    RawBattle.set(data, entity);
  });

  const updateBattleParticipant = ({ entity }: { entity: Entity }) => {
    const { battleId } = decodeEntity(components.BattleDamageDealtResult.metadata.keySchema, entity);
    const damageDealt = components.BattleDamageDealtResult.get(entity)?.damageDealt ?? 0n;
    const { hpAtStart, damageTaken } = components.BattleDamageTakenResult.get(entity) ?? {
      hpAtStart: 0n,
      damageTaken: 0n,
    };
    const { unitLevels, casualties, unitsAtStart } = components.BattleUnitResult.get(entity) ?? {
      unitLevels: undefined,
      casualties: undefined,
      unitsAtStart: undefined,
    };
    const { resourcesAtStart, resourcesAtEnd } = components.BattleRaidResult.get(entity) ?? {
      resourcesAtStart: undefined,
      resourcesAtEnd: undefined,
    };
    const { encryptionAtStart, encryptionAtEnd } = components.BattleEncryptionResult.get(entity) ?? {
      encryptionAtStart: undefined,
      encryptionAtEnd: undefined,
    };

    const previousData = RawBattleParticipant.get(entity);

    const newData = {
      ...previousData,
      damageDealt,
      hpAtStart,
      damageTaken,
      unitLevels,
      unitsAtStart,
      casualties,
      resourcesAtStart,
      resourcesAtEnd,
      encryptionAtStart,
      encryptionAtEnd,
    };

    RawBattleParticipant.set(newData, entity);
    const oldParticipantList = RawBattleParticipants.get(battleId as Entity)?.value;
    if (oldParticipantList?.includes(entity)) return;
    RawBattleParticipants.set({ value: oldParticipantList?.concat(entity) ?? [entity] }, battleId as Entity);
  };

  defineEnterSystem(systemWorld, [Has(components.BattleDamageDealtResult)], updateBattleParticipant);

  defineEnterSystem(systemWorld, [Has(components.BattleDamageTakenResult)], updateBattleParticipant);

  defineEnterSystem(systemWorld, [Has(components.BattleUnitResult)], updateBattleParticipant);
  defineEnterSystem(systemWorld, [Has(components.BattleRaidResult)], updateBattleParticipant);
  defineEnterSystem(systemWorld, [Has(components.BattleEncryptionResult)], updateBattleParticipant);
};
