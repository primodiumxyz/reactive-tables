import { Entity } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { EResource } from "contracts/config/enums";
import { components } from "src/network/components";
import { Hex } from "viem";
import { distanceBI } from "./common";
import { ResourceEntityLookup, SPEED_SCALE, UNIT_SPEED_SCALE } from "./constants";

export function toUnitCountArray(map: Map<Entity, bigint>): bigint[] {
  const prototypes = components.P_UnitPrototypes.get()?.value ?? [];
  const arr = Array.from({ length: prototypes.length }, () => 0n);
  prototypes.forEach((entity, index) => {
    const count = map.get(entity as Entity);
    if (count && count > 0n) arr[index] = count;
  });
  return arr;
}

export function toTransportableResourceArray(map: Map<Entity, bigint>): bigint[] {
  const transportables = components.P_Transportables.get()?.value ?? [];
  const arr = Array.from({ length: transportables.length }, () => 0n);
  transportables.forEach((enumValue, index) => {
    const entity = ResourceEntityLookup[enumValue as EResource];
    const count = map.get(entity as Entity);
    if (!count || count === 0n) return;
    arr[index] = count;
  });
  return arr;
}

export function getMoveLength(origin: Coord, destination: Coord, playerEntity: Entity, units: Record<Entity, bigint>) {
  const arrivalTime = getArrivalTime(origin, destination, playerEntity, units);
  if (arrivalTime == 0n) return 0;
  const now = components.Time.get()?.value ?? 0n;
  return Number(arrivalTime - now);
}
export function getArrivalTime(origin: Coord, destination: Coord, playerEntity: Entity, units: Record<Entity, bigint>) {
  const config = components.P_GameConfig.get();
  const unitSpeed = getSlowestUnitSpeed(playerEntity, units);
  if (!config) throw new Error("[getMoveLength] No config");

  const time = components.Time.get()?.value ?? 0n;
  if (unitSpeed == 0n) return 0n;
  return (
    time +
    (distanceBI(origin, destination) * config.travelTime * SPEED_SCALE * UNIT_SPEED_SCALE) /
      (config.worldSpeed * unitSpeed)
  );
}

export function getSlowestUnitSpeed(playerEntity: Entity, unitCounts: Record<Entity, bigint>) {
  let slowestSpeed = -1n;
  const unitPrototypes = components.P_UnitPrototypes.get()?.value as Entity[];
  if (unitPrototypes == undefined) throw new Error("[getSlowestUnitSpeed] no UnitPrototypes");

  Object.keys(unitCounts).forEach((rawEntity) => {
    const entity = rawEntity as Entity;
    const unitLevel =
      components.UnitLevel.getWithKeys({ entity: playerEntity as Hex, unit: entity as Hex })?.value ?? 0n;
    const speed = components.P_Unit.getWithKeys({ entity: entity as Hex, level: unitLevel })?.speed ?? 0n;
    if (speed < slowestSpeed || slowestSpeed == -1n) {
      slowestSpeed = speed;
    }
  });
  if (slowestSpeed == -1n) return 0n;
  return slowestSpeed;
}
