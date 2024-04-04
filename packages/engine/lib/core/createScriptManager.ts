/**
 * Creates an updater that runs a list of functions on each update call. Functions can be added and removed from the list.
 * @returns {Object} An object with `add`, `remove`, and `update` methods.
 */
export const createScriptManager = (scene: Phaser.Scene) => {
  return {
    add: (updateFunction: (time: number, delta: number) => void) => {
      scene.events.on("update", updateFunction);
    },
    remove: (updateFunction: (time: number, delta: number) => void) => {
      scene.events.removeListener("update", updateFunction);
    },
  };
};
