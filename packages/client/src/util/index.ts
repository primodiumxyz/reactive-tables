import { getAllianceName, getAllianceNameFromPlayer } from "./alliance";
import {
  calcDims,
  getBuildingDimensions,
  getBuildingImage,
  getBuildingImageFromType,
  getBuildingInfo,
  getBuildingLevelStorageUpgrades,
  getBuildingName,
  getBuildingOrigin,
  getBuildingStorages,
  relCoordToAbs,
} from "./building";
import { entityToColor } from "./color";
import { findEntriesWithPrefix, getPrivateKey } from "./localStorage";
import { entityToPlayerName, entityToRockName, playerNameToEntity, rockNameToEntity } from "./name";
import { getCanClaimObjective, getIsObjectiveAvailable } from "./objectives";
import { getAsteroidBounds, getAsteroidMaxBounds, outOfBounds } from "./outOfBounds";
import { getRecipe, getRecipeDifference } from "./recipe";
import { getAsteroidResourceCount, getFullResourceCount, getFullResourceCounts, getScale, isUtility } from "./resource";
import { getRewards } from "./reward";
import { getMoveLength, getSlowestUnitSpeed } from "./send";
import { getRockRelationship, getAsteroidImage, getAsteroidInfo, getAsteroidName } from "./asteroid";
import { getBuildingAtCoord, getBuildingsOfTypeInRange } from "./tile";
import { getUnitStats, getUnitTrainingTime } from "./unit";
import { getUpgradeInfo } from "./upgrade";
import { solCos, solCosDegrees, solSin, solSinDegrees } from "./vector";

export default {
  alliance: {
    getAllianceName,
    getAllianceNameFromPlayer,
  },
  building: {
    calcDims,
    relCoordToAbs,
    getBuildingOrigin,
    getBuildingDimensions,
    getBuildingName,
    getBuildingImage,
    getBuildingImageFromType,
    getBuildingStorages,
    getBuildingLevelStorageUpgrades,
    getBuildingInfo,
    getBuildingAtCoord,
    getBuildingsOfTypeInRange,
  },
  color: {
    entityToColor,
  },
  localStorage: {
    findEntriesWithPrefix,
    getPrivateKey,
  },
  name: {
    entityToPlayerName,
    entityToRockName,
    playerNameToEntity,
    rockNameToEntity,
  },
  objective: {
    getIsObjectiveAvailable,
    getCanClaimObjective,
  },
  bounds: {
    outOfBounds,
    getAsteroidBounds,
    getAsteroidMaxBounds,
  },
  recipe: {
    getRecipe,
    getRecipeDifference,
  },
  resource: {
    getScale,
    isUtility,
    getFullResourceCount,
    getAsteroidResourceCount,
    getFullResourceCounts,
  },
  reward: {
    getRewards,
  },
  send: {
    getMoveLength,
    getSlowestUnitSpeed,
  },
  spaceRock: {
    getSpaceRockImage: getAsteroidImage,
    getSpaceRockName: getAsteroidName,
    getSpaceRockInfo: getAsteroidInfo,
    getRockRelationship,
  },
  units: {
    getUnitStats,
    getUnitTrainingTime,
  },
  upgrade: {
    getUpgradeInfo,
  },
  vector: {
    solSin,
    solCos,
    solSinDegrees,
    solCosDegrees,
  },
};
