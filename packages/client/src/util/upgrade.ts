import { Entity } from "@latticexyz/recs";
import { components } from "src/network/components";
import { Hex } from "viem";
import { getBlockTypeName } from "./common";
import { EntityType } from "./constants";
import { getRecipe } from "./recipe";

export function getUpgradeInfo(research: Entity, asteroid: Entity) {
  const level =
    research === EntityType.Expansion
      ? components.Level.get(asteroid as Entity)?.value ?? 1n
      : components.UnitLevel.getWithKeys({ entity: asteroid as Hex, unit: research as Hex })?.value ?? 0n;
  let nextLevel = level + 1n;

  const maxLevel =
    (research === EntityType.Expansion
      ? components.Asteroid.getWithKeys({ entity: asteroid as Hex })?.maxLevel
      : components.P_MaxLevel.getWithKeys({ prototype: research as Hex })?.value) ?? 0n;

  nextLevel = nextLevel > maxLevel ? maxLevel : nextLevel;

  const recipe = getRecipe(research, nextLevel, true);

  const isResearched = level >= maxLevel;

  const mainBaseLvlReq =
    components.P_RequiredBaseLevel.getWithKeys({ level: nextLevel, prototype: research as Hex })?.value ?? 1n;

  return {
    maxLevel,
    level,
    name: getBlockTypeName(research),
    mainBaseLvlReq,
    isResearched,
    recipe,
  };
}
