import { Scene } from "engine/types";
// import { focusAsteroid } from "./focusAsteroid";
import { MUD } from "src/network/types";
import { renderAsteroid } from "./renderAsteroid";
import { renderAttackLine } from "./renderAttackLine";
import { renderBattle } from "./renderBattle";
import { renderFleetsInOrbit } from "./renderFleetsInOrbit";
import { renderFleetsInTransit } from "./renderFleetsInTransit";
import { renderMoveLine } from "./renderMoveLine";
import { renderPirateAsteroid } from "./renderPirateAsteroid";

export const runSystems = (scene: Scene, mud: MUD) => {
  // focusAsteroid(scene, mud);

  renderAsteroid(scene);
  renderPirateAsteroid(scene);

  renderMoveLine(scene, mud);
  renderAttackLine(scene, mud);

  renderFleetsInTransit(scene);
  renderFleetsInOrbit(scene);

  renderBattle(scene);
};
