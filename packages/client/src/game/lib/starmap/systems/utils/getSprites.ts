import { EntitytoBuildingSpriteKey, SpriteKeys } from "@game/constants";
import { Entity } from "@latticexyz/recs";
import { clampedIndex, getBlockTypeName } from "src/util/common";
import { EntityType, MapIdToAsteroidType, RockRelationship } from "src/util/constants";
import { getRockRelationship } from "src/util/asteroid";

const maxLevelToSize: Record<number, string> = {
  1: "Small",
  3: "Small",
  5: "Medium",
  8: "Large",
};

export const getRockSprite = (mapId: number, level: bigint) => {
  return mapId === 1 ? getPrimaryRockSprite(level) : getSecondaryRockSprite(mapId, level);
};

export const getPrimaryRockSprite = (level: bigint) => {
  return EntitytoBuildingSpriteKey[EntityType.Asteroid][
    clampedIndex(Number(level) - 1, EntitytoBuildingSpriteKey[EntityType.Asteroid].length)
  ];
};

export const getSecondaryRockSprite = (mapId: number, maxLevel: bigint) => {
  return SpriteKeys[
    `Motherlode${getBlockTypeName(MapIdToAsteroidType[mapId])}${
      maxLevelToSize[Number(maxLevel)]
    }` as keyof typeof SpriteKeys
  ];
};

export const getOutlineSprite = (playerEntity: Entity, rock: Entity) => {
  const rockRelationship = getRockRelationship(playerEntity, rock);

  return SpriteKeys[
    `Asteroid${
      {
        [RockRelationship.Ally]: "Alliance",
        [RockRelationship.Enemy]: "Enemy",
        [RockRelationship.Neutral]: "Enemy",
        [RockRelationship.Self]: "Player",
      }[rockRelationship]
    }` as keyof typeof SpriteKeys
  ];
};

export const getSecondaryOutlineSprite = (playerEntity: Entity, rock: Entity, maxLevel: bigint) => {
  const rockRelationship = getRockRelationship(playerEntity, rock);

  return SpriteKeys[
    `Motherlode${
      {
        [RockRelationship.Ally]: "Alliance",
        [RockRelationship.Enemy]: "Enemy",
        [RockRelationship.Neutral]: "Neutral",
        [RockRelationship.Self]: "Player",
      }[rockRelationship]
    }${maxLevelToSize[Number(maxLevel)]}` as keyof typeof SpriteKeys
  ];
};
