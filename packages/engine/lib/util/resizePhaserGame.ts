export const resizePhaserGame = (game: Phaser.Game) => {
  const resize = () => {
    const w = window.innerWidth * window.devicePixelRatio;
    const h = window.innerHeight * window.devicePixelRatio;

    game.scale.resize(w, h);
    for (const scene of game.scene.scenes) {
      if (scene.scene.settings.active) {
        // Re-adjust camera viewport
        scene.cameras.main.setViewport(0, 0, game.scale.width, game.scale.height);

        // // Re-center the camera
        // scene.cameras.main.setScroll(
        //   -game.scale.width / 2,
        //   -game.scale.height / 2
        // );
      }
    }
  };

  window.addEventListener("resize", resize.bind(this));

  const dispose = () => {
    window.removeEventListener("resize", resize.bind(this));
  };

  return { dispose };
};
