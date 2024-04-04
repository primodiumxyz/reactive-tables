import { create } from "zustand";
import { mountStoreDevtool } from "simple-zustand-devtools";
import { Game } from "../types";

type EngineState = {
  instances: Map<string, Game>;
};

type EngineActions = {
  setGame: (key: string, game: Game) => void;
};

const defaults: EngineState = {
  instances: new Map(),
};

export const useEngineStore = create<EngineState & EngineActions>()((set) => ({
  ...defaults,
  setGame: (key: string, game: Game) =>
    set((state) => {
      const instances = new Map<string, Game>(state.instances);
      instances.set(key, game);
      return { instances };
    }),
}));

// store dev tools
if (import.meta.env.VITE_DEV === "true") {
  mountStoreDevtool("EngineStore", useEngineStore);
}
