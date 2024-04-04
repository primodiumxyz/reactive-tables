// import { SceneConfig } from "../../types";
import { Scenes } from "@game/constants";
import { SceneConfig } from "engine/types";

export const starmapSceneConfig: SceneConfig = {
  key: Scenes.Starmap,
  camera: {
    minZoom: 0.5,
    maxZoom: 3,
    defaultZoom: 1,
    pinchSpeed: 0.01,
    wheelSpeed: 1,
  },
  cullingChunkSize: 128,
  tilemap: {
    tileWidth: 24,
    tileHeight: 24,
  },
};
