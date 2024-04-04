import { Entity } from "@latticexyz/recs";
import { EResource } from "contracts/config/enums"; // Assuming EResource is imported this way
import { components } from "src/network/components";
import { Hex } from "viem";
import { MULTIPLIER_SCALE } from "./constants";

export function getRockDefense(rockEntity: Entity) {
  const player = components.OwnedBy.get(rockEntity)?.value as Hex | undefined;
  const units = components.Hangar.get(rockEntity);
  if (!player || !units) return { points: 0n, multiplier: MULTIPLIER_SCALE };

  let defensePoints = 0n;

  units.units.forEach((unit, i) => {
    const count = units.counts[i];
    const level = components.UnitLevel.getWithKeys({ entity: player, unit: unit as Hex })?.value ?? 0n;
    const unitInfo = components.P_Unit.getWithKeys({ entity: unit as Hex, level });
    if (unitInfo) {
      defensePoints += count * unitInfo.defense;
    }
  });

  let multiplier = MULTIPLIER_SCALE;
  if (components.Home.get(player as Entity)?.value === rockEntity) {
    const rawMultiplier = components.ResourceCount.getWithKeys({
      entity: rockEntity as Hex,
      resource: EResource.M_DefenseMultiplier,
    })?.value;

    multiplier = (rawMultiplier ?? 0n) + 100n;

    defensePoints +=
      components.ResourceCount.getWithKeys({ entity: rockEntity as Hex, resource: EResource.U_Defense })?.value ?? 0n;
    defensePoints = (defensePoints * multiplier) / MULTIPLIER_SCALE;
  }

  return { points: defensePoints, multiplier };
}

export const getInGracePeriod = (entity: Entity) => {
  const time = components.Time.get()?.value ?? 0n;
  const endTime = components.GracePeriod.get(entity)?.value ?? 0n;
  const inGracePeriod = time < endTime;
  if (!inGracePeriod) return { inGracePeriod: false, duration: 0 };
  return { inGracePeriod, duration: endTime - time };
};

export const getInCooldownEnd = (entity: Entity) => {
  const time = components.Time.get()?.value ?? 0n;
  const endTime = components.CooldownEnd.get(entity)?.value ?? 0n;
  const inCooldown = time < endTime;
  if (!inCooldown) return { inCooldown: false, duration: 0 };
  return { inCooldown, duration: endTime - time };
};
