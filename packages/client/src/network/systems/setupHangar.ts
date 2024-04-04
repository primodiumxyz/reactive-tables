import { Entity, Has, HasValue, defineComponentSystem, namespaceWorld, runQuery } from "@latticexyz/recs";
import { getUnitTrainingTime } from "src/util/unit";
import { Hex } from "viem";
import { components } from "../components";
import { world } from "../world";
// import { SetupResult } from "../types";
export function createHangar(spaceRock: Entity) {
  const units: Map<Entity, bigint> = new Map();

  // get all units and find their counts on the space rock
  components.P_UnitPrototypes.get()?.value.forEach((entity) => {
    const unitCount = components.UnitCount.getWithKeys({
      entity: spaceRock as Hex,
      unit: entity as Hex,
    })?.value;

    if (!unitCount) return;
    const prev = units.get(entity as Entity) || 0n;
    units.set(entity as Entity, prev + unitCount);
  });

  const trainedUnclaimedUnits = getTrainedUnclaimedUnits(spaceRock);
  Array.from(trainedUnclaimedUnits).map(([unit, count]) => {
    units.set(unit as Entity, (units.get(unit as Entity) ?? 0n) + count);
  });

  const value = { units: [...units.keys()], counts: [...units.values()] };
  components.Hangar.set(value, spaceRock);
  return units;
}

function getTrainedUnclaimedUnits(spaceRock: Entity) {
  const units = new Map<Entity, bigint>();
  const query = [
    Has(components.TrainingQueue),
    HasValue(components.Position, {
      parent: spaceRock,
    }),
  ];
  const buildings = runQuery(query);
  const config = components.P_GameConfig.get();
  if (!config) return units;
  buildings.forEach((building) => {
    const owner = components.OwnedBy.get(building)?.value;

    let startTime =
      components.LastClaimedAt.get(building, { value: 0n }).value -
      components.ClaimOffset.get(building, { value: 0n }).value;

    const queueUnits = components.QueueUnits.getWithKeys({ entity: building as Hex });
    if (!queueUnits || !owner || !startTime) return components.Hangar.remove(building);
    for (let i = queueUnits.front; i <= queueUnits.back; i++) {
      const update = components.QueueItemUnits.getWithKeys({ entity: building as Hex, index: i });
      if (!update) continue;

      const trainingTime = getUnitTrainingTime(owner as Entity, building, update.unitId as Entity);
      let trainedUnits = update.quantity;
      const now = components.Time.get()?.value ?? 0n;
      if (trainingTime > 0) trainedUnits = (now - startTime) / trainingTime;

      if (trainedUnits == 0n) return;

      if (trainedUnits > update.quantity) {
        trainedUnits = update.quantity;
      }
      units.set(update.unitId as Entity, trainedUnits);

      startTime += trainingTime * trainedUnits;
    }
  });
  return units;
}
export function setupHangar() {
  const systemWorld = namespaceWorld(world, "systems");

  defineComponentSystem(systemWorld, components.SelectedRock, ({ value: [value] }) => {
    if (!value?.value) return;
    createHangar(value.value);
  });

  defineComponentSystem(systemWorld, components.HoverEntity, ({ value: [value] }) => {
    const entity = value?.value;
    if (!entity) return;
    if (components.Asteroid.has(entity)) createHangar(entity);
  });

  defineComponentSystem(systemWorld, components.Time, () => {
    const selectedRock = components.ActiveRock.get()?.value as Entity;
    if (selectedRock) createHangar(selectedRock);
    const hoverEntity = components.HoverEntity.get()?.value as Entity;
    if (components.Asteroid.has(hoverEntity)) createHangar(hoverEntity);
  });
}
