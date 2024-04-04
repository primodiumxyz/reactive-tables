import { Entity } from "@latticexyz/recs";
import { EResource } from "contracts/config/enums";
import { components as comps } from "src/network/components";
import { Hex } from "viem";
import {
  EntityType,
  RESOURCE_SCALE,
  RequirementType,
  ResourceEntityLookup,
  ResourceType,
  UtilityStorages,
} from "./constants";
import { getFullResourceCount } from "./resource";
import { getRewards } from "./reward";

type Requirement = {
  id: Entity;
  requiredValue: bigint;
  currentValue: bigint;
  scale: bigint;
  type: RequirementType;
};

export function getMainBaseRequirement(objective: Entity, asteroid: Entity): Requirement[] | undefined {
  const levelRequirement =
    comps.P_RequiredBaseLevel.getWithKeys({ prototype: objective as Hex, level: 1n })?.value ?? 1n;
  if (!levelRequirement) return;

  const mainBase = comps.Home.get(asteroid)?.value;
  const level = comps.Level.get(mainBase as Entity)?.value ?? 1n;

  return [
    {
      id: objective as Entity,
      requiredValue: levelRequirement,
      currentValue: level,
      scale: 1n,
      type: RequirementType.MainBase,
    },
  ];
}

export function getObjectivesRequirement(objective: Entity): Requirement[] | undefined {
  const objectives = comps.P_RequiredObjectives.get(objective)?.objectives;
  if (!objectives) return;
  const player = comps.Account.get()?.value;
  if (!player) return;

  return objectives.map((objective) => ({
    id: objective as Entity,
    requiredValue: 1n,
    currentValue: comps.CompletedObjective.getWithKeys({ objective: objective as Hex, entity: player as Hex })?.value
      ? 1n
      : 0n,
    scale: 1n,
    type: RequirementType.Objectives,
  }));
}

export function getExpansionRequirement(objective: Entity): Requirement[] | undefined {
  const requiredExpansion = comps.P_RequiredExpansion.get(objective)?.value;
  if (!requiredExpansion) return;
  const player = comps.Account.get()?.value;
  const asteroid = comps.ActiveRock.get()?.value;
  if (!player || !asteroid) return;
  const playerExpansion = comps.Level.get(asteroid as Entity, { value: 0n }).value;

  return [
    {
      id: EntityType.Expansion,
      requiredValue: requiredExpansion,
      currentValue: playerExpansion,
      scale: 1n,
      type: RequirementType.Expansion,
    },
  ];
}

export function getResourceRequirement(objective: Entity): Requirement[] | undefined {
  const rawRequiredProduction = comps.P_ProducedResources.get(objective, {
    resources: [],
    amounts: [],
  });
  if (!rawRequiredProduction) return;
  const player = comps.Account.get()?.value;
  if (!player) return;

  return rawRequiredProduction.resources.map((resource, index) => ({
    id: ResourceEntityLookup[resource as EResource],
    requiredValue: rawRequiredProduction.amounts[index],
    currentValue: comps.ProducedResource?.getWithKeys({ entity: player as Hex, resource })?.value ?? 0n,
    scale: RESOURCE_SCALE,
    type: RequirementType.ProducedResources,
  }));
}

export function getBuildingCountRequirement(objective: Entity): Requirement[] | undefined {
  const rawRequiredBuildings = comps.P_HasBuiltBuildings.get(objective)?.value;
  if (!rawRequiredBuildings) return;

  const player = comps.Account.get()?.value;
  if (!player) return;

  return rawRequiredBuildings.map((building) => ({
    id: building as Entity,
    requiredValue: 1n,
    currentValue: comps.HasBuiltBuilding.getWithKeys({ buildingType: building as Hex, entity: player as Hex })?.value
      ? 1n
      : 0n,
    scale: 1n,
    type: RequirementType.Buildings,
  }));
}

export function getHasDefeatedPirateRequirement(objective: Entity): Requirement[] | undefined {
  const defeatedPirates = comps.P_DefeatedPirates.get(objective)?.value;

  if (!defeatedPirates) return;

  const player = comps.Account.get()?.value;
  if (!player) return;

  return defeatedPirates.map((pirate) => ({
    id: pirate as Entity,
    requiredValue: 1n,
    currentValue: comps.DefeatedPirate.getWithKeys({ pirate: pirate as Hex, entity: player as Hex })?.value ? 1n : 0n,
    scale: 1n,
    type: RequirementType.DefeatedPirates,
  }));
}

export function getRequiredUnitsRequirement(objective: Entity, asteroid: Entity): Requirement[] | undefined {
  const rawRequiredUnits = comps.P_RequiredUnits.get(objective, {
    units: [],
    amounts: [],
  });

  const player = comps.Account.get()?.value;
  if (!player) return;

  const units = comps.Hangar.get(asteroid);

  return rawRequiredUnits.units.map((unit, index) => {
    const playerUnitIndex = units?.units.indexOf(unit as Entity);
    let unitCount = 0n;
    if (units && playerUnitIndex !== undefined && playerUnitIndex !== -1) {
      unitCount = units.counts[playerUnitIndex];
    }
    return {
      id: unit as Entity,
      requiredValue: rawRequiredUnits.amounts[index],
      currentValue: unitCount,
      scale: 1n,
      type: RequirementType.RequiredUnits,
    };
  });
}

export function getProducedUnitsRequirement(objective: Entity): Requirement[] | undefined {
  const producedUnits = comps.P_ProducedUnits.get(objective);
  if (!producedUnits) return;

  const player = comps.Account.get()?.value;
  if (!player) return;

  return producedUnits.units.map((unit, index) => ({
    id: unit as Entity,
    requiredValue: producedUnits.amounts[index],
    currentValue: comps.ProducedUnit.getWithKeys({ unit: unit as Hex, entity: player as Hex })?.value ?? 0n,
    scale: 1n,
    type: RequirementType.ProducedUnits,
  }));
}
export function getRaidRequirement(objective: Entity): Requirement[] | undefined {
  const rawRaid = comps.P_RaidedResources.get(objective, {
    resources: [],
    amounts: [],
  });

  const player = comps.Account.get()?.value;
  if (!player) return;

  return rawRaid.resources.map((resource, index) => ({
    id: ResourceEntityLookup[resource as EResource] as Entity,
    requiredValue: rawRaid.amounts[index],
    currentValue: comps.RaidedResource.getWithKeys({ resource, entity: player as Hex })?.value ?? 0n,
    scale: RESOURCE_SCALE,
    type: RequirementType.RaidedResources,
  }));
}

export function getDestroyedUnitsRequirement(objective: Entity): Requirement[] | undefined {
  const rawRequiredDestroyedUnits = comps.P_DestroyedUnits.get(objective, {
    units: [],
    amounts: [],
  });
  if (!rawRequiredDestroyedUnits) return;

  const player = comps.Account.get()?.value;
  if (!player) return;

  return rawRequiredDestroyedUnits.units.map((unit, index) => ({
    id: unit as Entity,
    requiredValue: rawRequiredDestroyedUnits.amounts[index],
    currentValue: comps.DestroyedUnit.getWithKeys({ unit: unit as Hex, entity: player as Hex })?.value ?? 0n,
    scale: 1n,
    type: RequirementType.DestroyedUnits,
  }));
}

export function getRewardUtilitiesRequirement(objective: Entity, asteroid: Entity): Requirement[] | undefined {
  const requiredUtilities = getRewards(objective).reduce((acc, cur) => {
    if (cur.type !== ResourceType.Utility) return acc;
    const prototype = cur.id as Hex;
    const level = comps.UnitLevel.getWithKeys({ unit: prototype, entity: asteroid as Hex })?.value ?? 0n;
    const requiredResources = comps.P_RequiredResources.getWithKeys({ prototype, level });
    if (!requiredResources) return acc;
    requiredResources.resources.forEach((rawResource, i) => {
      const resource = ResourceEntityLookup[rawResource as EResource];
      const amount = requiredResources.amounts[i] * cur.amount;
      if (!UtilityStorages.has(resource)) return;
      acc[resource] ? (acc[resource] += amount) : (acc[resource] = amount);
    });
    return acc;
  }, {} as Record<Entity, bigint>);

  return Object.entries(requiredUtilities).map(([id, requiredValue]) => {
    const { resourceCount, resourceStorage } = getFullResourceCount(id as Entity, asteroid);
    return {
      id: id as Entity,
      requiredValue: requiredValue + (resourceStorage - resourceCount),
      currentValue: resourceStorage,
      scale: 1n,
      type: RequirementType.RewardUtilities,
    };
  });
}

export const isRequirementMet = (requirement: Requirement | undefined) =>
  !requirement || requirement.currentValue >= requirement.requiredValue;

export const isAllRequirementsMet = (requirements: Requirement[] | undefined) =>
  !requirements || requirements.every(isRequirementMet);

export function getAllRequirements(objective: Entity, asteroid: Entity): Record<RequirementType, Requirement[]> {
  const requirements = {
    [RequirementType.Expansion]: getExpansionRequirement(objective),
    [RequirementType.ProducedResources]: getResourceRequirement(objective),
    [RequirementType.Buildings]: getBuildingCountRequirement(objective),
    [RequirementType.DefeatedPirates]: getHasDefeatedPirateRequirement(objective),
    [RequirementType.RaidedResources]: getRaidRequirement(objective),
    [RequirementType.RequiredUnits]: getRequiredUnitsRequirement(objective, asteroid),
    [RequirementType.ProducedUnits]: getProducedUnitsRequirement(objective),
    [RequirementType.DestroyedUnits]: getDestroyedUnitsRequirement(objective),
    [RequirementType.RewardUtilities]: getRewardUtilitiesRequirement(objective, asteroid),
  };
  return Object.fromEntries(
    Object.entries(requirements).filter(([, value]) => value !== undefined && value.length > 0)
  ) as Record<RequirementType, Requirement[]>;
}

export function getIsObjectiveAvailable(objective: Entity, asteroid: Entity) {
  const requirements = getAllRequirements(objective, asteroid);
  const mainbaseRequirement = getMainBaseRequirement(objective, asteroid);
  const objectivesRequirement = getObjectivesRequirement(objective);
  if (Object.keys(requirements).length == 0) return isAllRequirementsMet(mainbaseRequirement);
  return isAllRequirementsMet(mainbaseRequirement) && isAllRequirementsMet(objectivesRequirement);
}

export function getCanClaimObjective(objective: Entity, asteroid: Entity) {
  const rewards = getRewards(objective);
  const hasEnoughRewardResources = rewards.every((resource) => {
    if (resource.type !== ResourceType.Resource) return true;
    const { resourceCount, resourceStorage } = getFullResourceCount(resource.id, asteroid);
    return resourceCount + resource.amount < resourceStorage;
  });
  return hasEnoughRewardResources && Object.values(getAllRequirements(objective, asteroid)).every(isAllRequirementsMet);
}
