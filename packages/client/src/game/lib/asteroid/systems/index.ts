import { Scene } from "engine/types";
import { MUD } from "src/network/types";
import { focusMainbase } from "./focusMainbase";
import { renderBuilding } from "./renderBuilding";
import { renderBuildingMoveTool } from "./renderBuildingMoveTool";
import { renderBuildingPlacementTool } from "./renderBuildingPlacementTool";
import { renderTilemap } from "./renderTilemap";
import { renderHoverTile } from "./renderHoverTile";
import { renderQueuedBuildings } from "./renderQueuedBuildings";
import { renderResources } from "./renderResources";
import { renderBounds } from "./renderBounds";

export const runSystems = (scene: Scene, mud: MUD) => {
  //Render world entity's sprites
  renderTilemap(scene);
  renderResources(scene);
  renderBuilding(scene);

  // Render map utility elements, placement indicators, etc
  renderBounds(scene);
  renderHoverTile(scene);
  renderBuildingPlacementTool(scene, mud);
  renderBuildingMoveTool(scene, mud);
  focusMainbase(scene);
  renderQueuedBuildings(scene);
};
