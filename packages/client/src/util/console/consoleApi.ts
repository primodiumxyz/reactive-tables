import { Primodium } from "@game/api";
import { Entity } from "@latticexyz/recs";
import _ from "lodash";
import { components } from "src/network/components";
import { grantAccess, revokeAccess, revokeAllAccess, switchAuthorized } from "src/network/setup/contractCalls/access";
import {
  acceptJoinRequest,
  createAlliance,
  declineInvite,
  grantRole,
  invite,
  joinAlliance,
  kickPlayer,
  leaveAlliance,
  rejectJoinRequest,
  requestToJoin,
} from "src/network/setup/contractCalls/alliance";
import { buildBuilding } from "src/network/setup/contractCalls/buildBuilding";
import { claimObjective } from "src/network/setup/contractCalls/claimObjective";
import { claimUnits } from "src/network/setup/contractCalls/claimUnits";
import { demolishBuilding } from "src/network/setup/contractCalls/demolishBuilding";
import { moveBuilding } from "src/network/setup/contractCalls/moveBuilding";
import { toggleBuilding } from "src/network/setup/contractCalls/toggleBuilding";
import { train } from "src/network/setup/contractCalls/train";
import { upgradeBuilding } from "src/network/setup/contractCalls/upgradeBuilding";
import { upgradeRange } from "src/network/setup/contractCalls/upgradeRange";
import { upgradeUnit } from "src/network/setup/contractCalls/upgradeUnit";
import { MUD } from "src/network/types";
import { getAllianceName, getAllianceNameFromPlayer } from "../alliance";
import { getAsteroidImage, getRockRelationship, getAsteroidInfo, getAsteroidName } from "../asteroid";
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
} from "../building";
import { entityToColor } from "../color";
import {
  BlockIdToKey,
  BuildingEntityLookup,
  BuildingEnumLookup,
  EntityType,
  MULTIPLIER_SCALE,
  MultiplierStorages,
  RESOURCE_SCALE,
  ResourceEntityLookup,
  ResourceEnumLookup,
  ResourceStorages,
  SPEED_SCALE,
  UNIT_SPEED_SCALE,
  UnitEntityLookup,
  UnitEnumLookup,
  UtilityStorages,
} from "../constants";
import { findEntriesWithPrefix, getPrivateKey } from "../localStorage";
import { entityToFleetName, entityToPlayerName, entityToRockName, playerNameToEntity, rockNameToEntity } from "../name";
import { getCanClaimObjective, getIsObjectiveAvailable } from "../objectives";
import { getAsteroidBounds, getAsteroidMaxBounds, outOfBounds } from "../outOfBounds";
import { getRecipe, getRecipeDifference } from "../recipe";
import {
  getAsteroidResourceCount,
  getFullResourceCount,
  getFullResourceCounts,
  getScale,
  isUtility,
} from "../resource";
import { getRewards } from "../reward";
import { getMoveLength, getSlowestUnitSpeed } from "../send";
import { getBuildingAtCoord, getBuildingsOfTypeInRange } from "../tile";
import { getUnitStats, getUnitTrainingTime } from "../unit";
import { getUpgradeInfo } from "../upgrade";
import { solCos, solCosDegrees, solSin, solSinDegrees } from "../vector";

export default function createConsoleApi(mud: MUD, primodium: Primodium) {
  const utils = {
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
      getBuildingImage: (building: Entity) => getBuildingImage(primodium, building),
      getBuildingImageFromType: (buildingType: Entity) => getBuildingImageFromType(primodium, buildingType),
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
      entityToFleetName,
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
    sendUtils: {
      getMoveLength,
      getSlowestUnitSpeed,
    },
    spaceRock: {
      getSpaceRockImage: (rock: Entity) => getAsteroidImage(primodium, rock),
      getSpaceRockName: getAsteroidName,
      getSpaceRockInfo: (rock: Entity) => getAsteroidInfo(primodium, rock),
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

  const contractCalls = {
    grantAccess: _.curry(grantAccess)(mud),
    revokeAccess: _.curry(revokeAccess)(mud),
    revokeAllAccess: () => revokeAllAccess(mud),
    switchAuthorized: _.curry(switchAuthorized)(mud),

    createAlliance: _.curry(createAlliance)(mud),
    leaveAlliance: () => leaveAlliance(mud),
    joinAlliance: _.curry(joinAlliance)(mud),
    declineInvite: _.curry(declineInvite)(mud),
    requestToJoin: _.curry(requestToJoin)(mud),
    kickPlayer: _.curry(kickPlayer)(mud),
    grantRole: _.curry(grantRole)(mud),
    acceptJoinRequest: _.curry(acceptJoinRequest)(mud),
    rejectJoinRequest: _.curry(rejectJoinRequest)(mud),
    invite: _.curry(invite)(mud),

    buildBuilding: _.curry(buildBuilding)(mud),

    claimObjective: _.curry(claimObjective)(mud),
    claimUnits: _.curry(claimUnits)(mud),
    demolishBuilding: _.curry(demolishBuilding)(mud),
    moveBuilding: _.curry(moveBuilding)(mud),
    toggleBuilding: _.curry(toggleBuilding)(mud),
    train: _.curry(train)(mud),
    upgradeBuilding: _.curry(upgradeBuilding)(mud),
    upgradeRange: _.curry(upgradeRange)(mud),
    upgradeUnit: _.curry(upgradeUnit)(mud),
  };

  const constants = {
    SPEED_SCALE,
    RESOURCE_SCALE,
    MULTIPLIER_SCALE,
    UNIT_SPEED_SCALE,
    EntityType,
    BlockIdToKey,
    ResourceStorages: [...ResourceStorages],
    UtilityStorages: [...UtilityStorages],
    MultiplierStorages: [...MultiplierStorages],
    BuildingEnumLookup,
    BuildingEntityLookup,
    ResourceEntityLookup,
    ResourceEnumLookup,
    UnitEntityLookup,
    UnitEnumLookup,
  };

  const ret = {
    priPlayerAccount: mud.playerAccount,
    priComponents: components,
    priContractCalls: contractCalls,
    priUtils: utils,
    priConstants: constants,
  };
  return ret;
}
