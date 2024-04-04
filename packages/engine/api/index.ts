import { createGame as _createGame } from "../lib/core/createGame";
import { useEngineStore } from "../store/EngineStore";
import { Game, GameConfig } from "../types";

export const initializeContext = (key: string, game: Game) => {
  const setGame = useEngineStore.getState().setGame;

  setGame(key, game);
};

export const getGame = () => {
  return useEngineStore.getState().instances;
};

export const createGame = async (config: GameConfig) => {
  return await _createGame(config);
};
