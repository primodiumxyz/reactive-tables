import { Entity, defineComponentSystem, namespaceWorld } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { world } from "src/network/world";
import { components } from "../components";
import { MUD } from "../types";

export const setupAllianceLeaderboard = (mud: MUD) => {
  const systemWorld = namespaceWorld(world, "systems");
  const leaderboardMap = new Map<Entity, bigint>();

  defineComponentSystem(systemWorld, components.Alliance, (update) => {
    const { entity } = update;

    if (!update.value[0]) {
      leaderboardMap.delete(entity);
    } else {
      const score = components.Alliance.get(entity)?.score ?? 0n;
      leaderboardMap.set(entity, score);
    }

    const leaderboardArray = [...leaderboardMap.entries()].sort((a, b) => Number(b[1]) - Number(a[1]));
    const scores = leaderboardArray.map((entry) => entry[1]);
    const alliances = leaderboardArray.map((entry) => entry[0]);

    const player = mud.playerAccount.entity;
    const playerAlliance = components.PlayerAlliance.get(player)?.alliance as Entity | undefined;

    const playerAllianceIndex = alliances.indexOf(playerAlliance ?? singletonEntity);
    const playerAllianceRank = playerAllianceIndex !== -1 ? playerAllianceIndex + 1 : leaderboardArray.length + 1;

    if (alliances.length === 0) {
      components.AllianceLeaderboard.remove();
      return;
    }

    components.AllianceLeaderboard.set({
      scores,
      alliances,
      playerAllianceRank,
    });
  });

  return leaderboardMap;
};
