import { Entity } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { EResource } from "contracts/config/enums";
import { components } from "src/network/components";
import { world } from "src/network/world";
import { EntityType, RESOURCE_SCALE } from "src/util/constants";
import { getSecondaryAsteroidEntity, hashEntities, toHex32 } from "src/util/encode";
import { getPositionByVector } from "src/util/vector";
import { Hex } from "viem";

const emptyData = {
  __staticData: "",
  __encodedLengths: "",
  __dynamicData: "",
};

const spawnDroidBase = (asteroidEntity: Entity) => {
  const mainBaseCoord = components.Position.get(EntityType.MainBase) ?? { x: 19, y: 13 };
  const droidBaseEntity = hashEntities(asteroidEntity, EntityType.DroidBase);
  components.Position.set(
    { ...emptyData, x: mainBaseCoord.x, y: mainBaseCoord.y, parent: asteroidEntity },
    droidBaseEntity
  );
  components.BuildingType.set({ ...emptyData, value: EntityType.DroidBase }, droidBaseEntity);
  components.Level.set({ ...emptyData, value: 1n }, droidBaseEntity);
  components.IsActive.set({ ...emptyData, value: true }, droidBaseEntity);
  components.OwnedBy.set({ ...emptyData, value: asteroidEntity }, droidBaseEntity);

  if (components.P_Blueprint.has(EntityType.DroidBase)) return;

  components.P_Blueprint.set(
    { ...emptyData, value: components.P_Blueprint.get(EntityType.MainBase)?.value ?? [] },
    EntityType.DroidBase
  );
};

export function initializeSecondaryAsteroids(sourceEntity: Entity, source: Coord) {
  const config = components.P_GameConfig.get();

  if (!config) throw new Error("GameConfig not found");
  for (let i = 0; i < config.maxAsteroidsPerPlayer; i++) {
    const asteroidPosition = getPositionByVector(
      Number(config.asteroidDistance),
      Math.floor((i * 360) / Number(config.maxAsteroidsPerPlayer)),
      source
    );
    const asteroidEntity = getSecondaryAsteroidEntity(sourceEntity, asteroidPosition);

    if (!components.OwnedBy.get(asteroidEntity)) spawnDroidBase(asteroidEntity);

    if (components.ReversePosition.getWithKeys(asteroidPosition)) continue;

    world.registerEntity({ id: asteroidEntity });
    components.ReversePosition.setWithKeys({ entity: asteroidEntity as string, ...emptyData }, asteroidPosition);
    if (!isSecondaryAsteroid(asteroidEntity, Number(config.asteroidChanceInv))) continue;

    const asteroidData = getAsteroidData(asteroidEntity);
    components.Asteroid.set({ ...emptyData, ...asteroidData }, asteroidEntity);
    components.Position.set({ ...emptyData, ...asteroidPosition, parent: toHex32("0") }, asteroidEntity);

    const defenseData = getSecondaryAsteroidUnitsAndEncryption(asteroidEntity, asteroidData.maxLevel);
    components.UnitCount.setWithKeys(
      { ...emptyData, value: defenseData.droidCount },
      { entity: asteroidEntity as Hex, unit: EntityType.Droid as Hex }
    );

    components.ResourceCount.setWithKeys(
      { ...emptyData, value: defenseData.encryption },
      { entity: asteroidEntity as Hex, resource: EResource.R_Encryption }
    );
    components.MaxResourceCount.setWithKeys(
      { ...emptyData, value: defenseData.encryption },
      { entity: asteroidEntity as Hex, resource: EResource.R_Encryption }
    );
  }
}

function isSecondaryAsteroid(entity: Entity, chanceInv: number) {
  const motherlodeType = getByteUInt(entity, 6, 128);
  return motherlodeType % chanceInv === 1;
}

function getSecondaryAsteroidUnitsAndEncryption(asteroidEntity: Entity, level: bigint) {
  const droidCount = 4n ** level + 100n;
  const encryption = (level * 10n + 10n) * RESOURCE_SCALE;
  return { droidCount, encryption };
}

function getAsteroidData(asteroidEntity: Entity) {
  const distributionVal = getByteUInt(asteroidEntity, 7, 12) % 100;
  let maxLevel = 8;
  // //micro
  if (distributionVal <= 50) {
    maxLevel = 1;
    //small
  } else if (distributionVal <= 75) {
    maxLevel = 3;
    //medium
  } else if (distributionVal <= 90) {
    maxLevel = 5;
    //large
  }

  const mapId = (getByteUInt(asteroidEntity, 3, 20) % 4) + 2;
  return { isAsteroid: true, maxLevel: BigInt(maxLevel), mapId: mapId, spawnsSecondary: false };
}

const ONE = BigInt(1);
const getByteUInt = (_b: Entity, length: number, shift: number): number => {
  const b = BigInt(_b);
  const mask = ((ONE << BigInt(length)) - ONE) << BigInt(shift);
  const _byteUInt = (b & mask) >> BigInt(shift);
  return Number(_byteUInt);
};
