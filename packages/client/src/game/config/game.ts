import { ASSET_PACK, KEY } from "@game/constants";
import { GameConfig } from "engine/types";

const gameConfig: GameConfig = {
  key: KEY,
  type: Phaser.WEBGL,
  parent: "phaser-container",
  backgroundColor: "64748b",
  width: window.innerWidth,
  height: window.innerHeight,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  antialias: false,
  antialiasGL: false,
  roundPixels: true,
  desynchronized: true,
  autoMobilePipeline: true,
  premultipliedAlpha: true,
  transparent: true,
  pixelArt: true,
  assetPackUrl: ASSET_PACK,
  dom: {
    createContainer: true,
    pointerEvents: "none",
  },
};

export default gameConfig;
