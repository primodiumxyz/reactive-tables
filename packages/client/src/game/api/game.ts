import { Game } from "engine/types";

export function createGameApi(game: Game) {
  function setResolution(width: number, height: number) {
    const { phaserGame, sceneManager } = game;

    sceneManager.scenes.forEach((scene) => {
      const camera = scene.phaserScene.cameras.main;

      // Calculate the current center position of the camera's viewport
      const currentCenterX = camera.scrollX + camera.width * 0.5;
      const currentCenterY = camera.scrollY + camera.height * 0.5;

      // Adjust the viewport to the new dimensions
      camera.setViewport(0, 0, width, height);

      // Adjust the camera's scroll position based on the new viewport size
      camera.scrollX = currentCenterX - width * 0.5;
      camera.scrollY = currentCenterY - height * 0.5;
    });

    phaserGame.scale.resize(width, height);
  }

  function setTarget(id: string) {
    const div = game.phaserGame.canvas;

    const target = document.getElementById(id);

    if (target === null) {
      console.warn("No target found with id " + id);
      return;
    }

    target.appendChild(div);

    setResolution(target.offsetWidth * window.devicePixelRatio, target.offsetHeight * window.devicePixelRatio);
  }

  function getConfig() {
    return game.phaserGame.config;
  }

  return {
    setResolution,
    setTarget,
    getConfig,
  };
}
