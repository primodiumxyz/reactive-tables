import { Entity } from "@latticexyz/recs";
import { EResource } from "contracts/config/enums";
import { components } from "src/network/components";
import { ResourceEntityLookup, ResourceType } from "./constants";

export function getRewards(entityId: Entity) {
  const { P_ResourceReward, P_UnitReward } = components;
  const rawResourceRewards = P_ResourceReward.get(entityId, {
    resources: [],
    amounts: [],
  });

  const rawUnitRewards = P_UnitReward.get(entityId, {
    units: [],
    amounts: [],
  });

  const resourceRewards = rawResourceRewards.resources.map((resource, index) => ({
    id: ResourceEntityLookup[resource as EResource],
    type: ResourceType.Resource,
    amount: rawResourceRewards.amounts[index],
  }));

  const unitRewards = rawUnitRewards.units.map((unit, index) => ({
    id: unit as Entity,
    type: ResourceType.Utility,
    amount: rawUnitRewards.amounts[index],
  }));

  return [...resourceRewards, ...unitRewards];
}
