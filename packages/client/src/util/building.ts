import { Primodium } from "@game/api";
// import { EntitytoSpriteKey } from "@game/constants";
import { EntitytoBuildingSpriteKey } from "@game/constants";
import { Entity } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { EResource, MUDEnums } from "contracts/config/enums";
import { components as comps } from "src/network/components";
import { Hex } from "viem";
import { clampedIndex, getBlockTypeName, toRomanNumeral } from "./common";
import {
  MultiplierStorages,
  ResourceEntityLookup,
  ResourceStorages,
  ResourceType,
  SPEED_SCALE,
  UtilityStorages,
} from "./constants";
import { outOfBounds } from "./outOfBounds";
import { getRecipe } from "./recipe";
import { getScale } from "./resource";
import { getBuildingAtCoord, getResourceKey } from "./tile";

type Dimensions = { width: number; height: number };
export const blueprintCache = new Map<Entity, Dimensions>();

export function calcDims(entity: Entity, coordinates: Coord[]): Dimensions {
  if (blueprintCache.has(entity)) return blueprintCache.get(entity)!;
  let minX = coordinates[0].x;
  let maxX = coordinates[0].x;
  let minY = coordinates[0].y;
  let maxY = coordinates[0].y;

  for (let i = 1; i < coordinates.length; i++) {
    minX = Math.min(minX, coordinates[i].x);
    maxX = Math.max(maxX, coordinates[i].x);
    minY = Math.min(minY, coordinates[i].y);
    maxY = Math.max(maxY, coordinates[i].y);
  }

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  blueprintCache.set(entity, { width, height });
  return { width, height };
}

export function convertToCoords(numbers: number[]): Coord[] {
  if (numbers.length % 2 !== 0) {
    throw new Error("Input array must contain an even number of elements");
  }

  const coordinates: Coord[] = [];

  for (let i = 0; i < numbers.length; i += 2) {
    coordinates.push({ x: numbers[i], y: numbers[i + 1] });
  }

  return coordinates;
}

export function relCoordToAbs(coordinates: Coord[], origin: Coord): Coord[] {
  return coordinates.map((coord) => ({
    x: coord.x + origin.x,
    y: coord.y + origin.y,
  }));
}

export function getBuildingOrigin(source: Coord, building: Entity) {
  const blueprint = comps.P_Blueprint.get(building)?.value;
  if (!blueprint) return;
  const topLeftCoord = getTopLeftCoord(convertToCoords(blueprint));

  if (!blueprint) return;
  return { x: source.x - topLeftCoord.x, y: source.y - topLeftCoord.y };
}

export function getBuildingTopLeft(origin: Coord, buildingType: Entity) {
  const rawBlueprint = comps.P_Blueprint.get(buildingType)?.value;
  if (!rawBlueprint) throw new Error("No blueprint found");

  const relativeTopLeft = getTopLeftCoord(convertToCoords(rawBlueprint));

  return { x: origin.x + relativeTopLeft.x, y: origin.y + relativeTopLeft.y };
}

export function getTopLeftCoord(coordinates: Coord[]): Coord {
  if (coordinates.length === 0) throw new Error("Cannot get top left coordinate of empty array");
  if (coordinates.length === 1) return coordinates[0];

  let minX = coordinates[0].x;
  let maxY = coordinates[0].y;

  for (let i = 1; i < coordinates.length; i++) {
    minX = Math.min(minX, coordinates[i].x);
    maxY = Math.max(maxY, coordinates[i].y);
  }

  return { x: minX, y: maxY };
}

export function getBuildingDimensions(building: Entity) {
  const blueprint = comps.P_Blueprint.get(building)?.value;

  const dimensions = blueprint ? calcDims(building, convertToCoords(blueprint)) : { width: 1, height: 1 };

  return dimensions;
}

export const validateBuildingPlacement = (
  coord: Coord,
  buildingPrototype: Entity,
  asteroid: Entity,
  building?: Entity
) => {
  //get building dimesions
  const buildingDimensions = getBuildingDimensions(buildingPrototype);
  const requiredTile = comps.P_RequiredTile.get(buildingPrototype)?.value;

  //iterate over dimensions and check if there is a building there
  for (let x = 0; x < buildingDimensions.width; x++) {
    for (let y = 0; y < buildingDimensions.height; y++) {
      const buildingCoord = { x: coord.x + x, y: coord.y - y };
      const buildingAtCoord = getBuildingAtCoord(buildingCoord, asteroid);
      if (buildingAtCoord && buildingAtCoord !== building) return false;
      if (outOfBounds(buildingCoord, asteroid)) return false;
      const mapId = comps.Asteroid.get(asteroid)?.mapId ?? 1;
      if (requiredTile && requiredTile !== getResourceKey(buildingCoord, mapId)) return false;
    }
  }

  return true;
};

export const getBuildingName = (building: Entity) => {
  const buildingType = comps.BuildingType.get(building)?.value as Entity;
  const level = comps.Level.get(building)?.value ?? 1n;

  if (!buildingType) return null;

  return `${getBlockTypeName(buildingType)} ${toRomanNumeral(Number(level))}`;
};

export const getBuildingImage = (primodium: Primodium, building: Entity) => {
  const buildingType = comps.BuildingType.get(building)?.value as Entity;
  const level = comps.Level.get(building)?.value ?? 1n;
  const { getSpriteBase64 } = primodium.api().sprite;

  if (EntitytoBuildingSpriteKey[buildingType]) {
    const imageIndex = parseInt(level ? level.toString() : "1") - 1;

    return getSpriteBase64(
      EntitytoBuildingSpriteKey[buildingType][clampedIndex(imageIndex, EntitytoBuildingSpriteKey[buildingType].length)]
    );
  }

  return "";
};

export const getBuildingImageFromType = (primodium: Primodium, buildingType: Entity) => {
  const level = comps.Level.get(buildingType)?.value ?? 1n;
  const { getSpriteBase64 } = primodium.api().sprite;

  if (EntitytoBuildingSpriteKey[buildingType]) {
    const imageIndex = parseInt(level ? level.toString() : "1") - 1;

    return getSpriteBase64(
      EntitytoBuildingSpriteKey[buildingType][clampedIndex(imageIndex, EntitytoBuildingSpriteKey[buildingType].length)]
    );
  }

  return "";
};

export const getBuildingStorages = (buildingType: Entity, level: bigint) => {
  const resourceStorages = MUDEnums.EResource.map((_, i) => {
    const storage = comps.P_ByLevelMaxResourceUpgrades.getWithKeys({
      prototype: buildingType as Hex,
      level,
      resource: i,
    })?.value;

    if (!storage) return null;

    return {
      resource: ResourceEntityLookup[i as EResource],
      resourceType: comps.P_IsUtility.getWithKeys({ id: i }) ? ResourceType.Resource : ResourceType.Utility,
      amount: storage,
    };
  });

  return resourceStorages.filter((storage) => !!storage) as {
    resource: Entity;
    resourceType: ResourceType;
    amount: bigint;
  }[];
};

export function getBuildingLevelStorageUpgrades(buildingType: Entity, level: bigint) {
  const storageUpgrade = comps.P_ListMaxResourceUpgrades.getWithKeys({
    prototype: buildingType as Hex,
    level: level,
  })?.value as EResource[] | undefined;
  if (!storageUpgrade) return [];
  return storageUpgrade.map((resource) => ({
    resource: ResourceEntityLookup[resource],
    amount:
      comps.P_ByLevelMaxResourceUpgrades.getWithKeys({ prototype: buildingType as Hex, level, resource })?.value ?? 0n,
  }));
}

export function transformProductionData(
  production: { resources: number[]; amounts: bigint[] } | undefined
): { resource: Entity; amount: bigint; type: ResourceType }[] {
  if (!production) return [];

  return production.resources
    .map((curr, i) => {
      const resourceEntity = ResourceEntityLookup[curr as EResource];
      const type = ResourceStorages.has(resourceEntity)
        ? ResourceType.ResourceRate
        : UtilityStorages.has(resourceEntity)
        ? ResourceType.Utility
        : MultiplierStorages.has(resourceEntity)
        ? ResourceType.Multiplier
        : null;

      if (type === null) return null;

      let amount = production.amounts[i];
      if (type === ResourceType.ResourceRate) {
        const worldSpeed = comps.P_GameConfig.get()?.worldSpeed ?? 100n;
        amount = (amount * worldSpeed) / SPEED_SCALE;
      }

      if (type === ResourceType.Multiplier) {
        amount = amount / BigInt(getScale(resourceEntity));
      }
      return {
        resource: ResourceEntityLookup[curr as EResource],
        amount,
        type,
      };
    })
    .filter((item) => item !== null) as { resource: Entity; amount: bigint; type: ResourceType }[];
}

export const getBuildingInfo = (building: Entity) => {
  const buildingType = comps.BuildingType.get(building)?.value as Hex | undefined;
  if (!buildingType) throw new Error("No building type found");
  const buildingTypeEntity = buildingType as Entity;

  const level = comps.Level.get(building)?.value ?? 1n;
  const buildingLevelKeys = { prototype: buildingType, level: level };
  const production = transformProductionData(comps.P_Production.getWithKeys(buildingLevelKeys));
  const productionDep = comps.P_RequiredDependency.getWithKeys(buildingLevelKeys);

  const requiredDependencies = transformProductionData({
    resources: productionDep ? [productionDep.resource] : [],
    amounts: productionDep ? [productionDep.amount] : [],
  });
  const unitProduction = comps.P_UnitProdTypes.getWithKeys(buildingLevelKeys)?.value;
  const storages = getBuildingStorages(buildingTypeEntity, level);
  const unitProductionMultiplier = comps.P_UnitProdMultiplier.getWithKeys(buildingLevelKeys)?.value;
  const position = comps.Position.get(building) ?? { x: 0, y: 0, parent: undefined };

  const nextLevel = level + 1n;
  const maxLevel = comps.P_MaxLevel.getWithKeys({ prototype: buildingType })?.value ?? 1n;

  let upgrade = undefined;
  if (nextLevel <= maxLevel) {
    const buildingNextLevelKeys = { prototype: buildingType, level: nextLevel };
    const nextLevelProduction = transformProductionData(comps.P_Production.getWithKeys(buildingNextLevelKeys));
    const nextLevelProductionDep = comps.P_RequiredDependency.getWithKeys(buildingNextLevelKeys);
    const nextLevelRequiredDependencies = transformProductionData({
      resources: nextLevelProductionDep ? [nextLevelProductionDep.resource] : [],
      amounts: nextLevelProductionDep ? [nextLevelProductionDep.amount] : [],
    });
    const unitNextLevelProduction = comps.P_UnitProdTypes.getWithKeys(buildingNextLevelKeys)?.value;
    const nextLevelStorages = getBuildingStorages(buildingTypeEntity, nextLevel);
    const nextLevelUnitProductionMultiplier = comps.P_UnitProdMultiplier.getWithKeys(buildingNextLevelKeys)?.value;
    const upgradeRecipe = getRecipe(buildingTypeEntity, nextLevel);
    const mainBaseLvlReq = comps.P_RequiredBaseLevel.getWithKeys(buildingNextLevelKeys)?.value ?? 1;
    upgrade = {
      unitProduction: unitNextLevelProduction,
      production: nextLevelProduction,
      storages: nextLevelStorages,
      recipe: upgradeRecipe,
      mainBaseLvlReq,
      nextLevelUnitProductionMultiplier,
      requiredDependencies: nextLevelRequiredDependencies,
    };
  }

  return {
    buildingType,
    level,
    maxLevel,
    nextLevel,
    production,
    unitProduction,
    storages,
    position,
    unitProductionMultiplier,
    requiredDependencies,
    upgrade,
  };
};
