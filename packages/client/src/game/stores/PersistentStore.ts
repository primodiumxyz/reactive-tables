import { create } from "zustand";
import { persist } from "zustand/middleware";

import { mountStoreDevtool } from "simple-zustand-devtools";

import { KeybindActions } from "@game/constants";
import { Coord } from "@latticexyz/utils";
import { Key } from "engine/types";

const VERSION = 5;

type Keybinds = Partial<{
  [key in KeybindActions]: Set<Key>;
}>;

type Panes = Record<
  string,
  | {
      pinned: boolean;
      coord: Coord;
      locked: boolean;
      visible: boolean;
    }
  | undefined
>;

type Volume = {
  master: number;
  music: number;
  sfx: number;
  ui: number;
};

type Channel = "music" | "sfx" | "ui" | "master";

type PersistentState = {
  newPlayer: boolean;
  keybinds: Keybinds;
  volume: Volume;
  allowHackerModal: boolean;
  uiScale: number;
  consoleHistory: { input: string; output: string }[];
  noExternalAccount: boolean;
  panes: Panes;
  fontStyle: string;
  hideHotkeys: boolean;
};

type PersistentActions = {
  replaceKey: (keybindAction: KeybindActions, oldKey: Key, newKey: Key) => void;
  addKey: (keybindAction: KeybindActions, key: Key) => void;
  removeKey: (keybindAction: KeybindActions, key: Key) => void;
  setKeybind: (keybindAction: KeybindActions, keys: Set<Key>) => void;
  setNewPlayer: (val: boolean) => void;
  setVolume: (volume: number, channel: Channel) => void;
  setFontStyle: (style: string) => void;
  toggleAllowHackerModal: () => void;
  setUiScale: (scale: number) => void;
  setConsoleHistory: (history: { input: string; output: string }[]) => void;
  setPane: (id: string, coord: Coord, pinned: boolean, locked: boolean, visible: boolean) => void;
  removePane: (id: string) => void;
  resetPanes: () => void;
  setNoExternalAccount: (value: boolean) => void; // Add this action
  removeNoExternalAccount: () => void; // Add this action
  setHideHotkeys: (val: boolean) => void;
};

const defaults: PersistentState = {
  fontStyle: "font-pixel",
  newPlayer: true,
  allowHackerModal: false,
  uiScale: 1,
  consoleHistory: [],
  noExternalAccount: false,
  panes: {},
  volume: {
    master: 1,
    music: 0.25,
    sfx: 0.5,
    ui: 0.25,
  },
  hideHotkeys: false,
  keybinds: {
    [KeybindActions.RightClick]: new Set(["POINTER_RIGHT"]),
    [KeybindActions.LeftClick]: new Set(["POINTER_LEFT"]),
    [KeybindActions.Up]: new Set(["W", "UP"]),
    [KeybindActions.Down]: new Set(["S", "DOWN"]),
    [KeybindActions.Left]: new Set(["A", "LEFT"]),
    [KeybindActions.Right]: new Set(["D", "RIGHT"]),
    [KeybindActions.Base]: new Set(["SPACE"]),
    [KeybindActions.SpacerockMenu]: new Set(["TAB"]),
    [KeybindActions.ZoomIn]: new Set(["X", "PLUS"]),
    [KeybindActions.ZoomOut]: new Set(["Z", "MINUS"]),
    [KeybindActions.Modifier]: new Set(["SHIFT"]),
    [KeybindActions.Hotbar0]: new Set(["ONE"]),
    [KeybindActions.Hotbar1]: new Set(["TWO"]),
    [KeybindActions.Hotbar2]: new Set(["THREE"]),
    [KeybindActions.Hotbar3]: new Set(["FOUR"]),
    [KeybindActions.Hotbar4]: new Set(["FIVE"]),
    [KeybindActions.Hotbar5]: new Set(["SIX"]),
    [KeybindActions.Hotbar6]: new Set(["SEVEN"]),
    [KeybindActions.Hotbar7]: new Set(["EIGHT"]),
    [KeybindActions.Hotbar8]: new Set(["NINE"]),
    [KeybindActions.Hotbar9]: new Set(["ZERO"]),
    [KeybindActions.NextHotbar]: new Set(["E"]),
    [KeybindActions.PrevHotbar]: new Set(["Q"]),
    [KeybindActions.Esc]: new Set(["ESC"]),
    [KeybindActions.Map]: new Set(["M"]),
    [KeybindActions.Console]: new Set(["BACKTICK"]),
    [KeybindActions.Account]: new Set(["R"]),
    [KeybindActions.Blueprints]: new Set(["T"]),
    [KeybindActions.Objectives]: new Set(["Y"]),
    [KeybindActions.Resources]: new Set(["U"]),
    [KeybindActions.Units]: new Set(["I"]),
    [KeybindActions.Asteroids]: new Set(["O"]),
    [KeybindActions.Fleets]: new Set(["P"]),
    [KeybindActions.Chat]: new Set(["OPEN_BRACKET"]),
    [KeybindActions.HideAll]: new Set(["H"]),
  },
};

export const usePersistentStore = create<PersistentState & PersistentActions>()(
  persist(
    (set, get) => ({
      ...defaults,
      setNewPlayer: (val: boolean) => {
        set({ newPlayer: val });
      },
      replaceKey: (keybindAction, oldKey, newKey) => {
        const set = get().keybinds[keybindAction];

        if (!set) return;

        if (set.delete(oldKey)) set.add(newKey);
      },
      addKey: (keybindAction, key) => {
        const set = get().keybinds[keybindAction];

        if (!set) return;

        set.add(key);
      },
      removeKey: (keybindAction, key) => {
        const set = get().keybinds[keybindAction];

        if (!set) return;

        set.delete(key);
      },
      setFontStyle: (style) => {
        set({ fontStyle: style });
      },
      setKeybind: (keybindAction, keys) => set({ keybinds: { [keybindAction]: keys } }),
      setVolume: (volume, channel) => {
        set({ volume: { ...get().volume, [channel]: volume } });
      },
      toggleAllowHackerModal: () => {
        const allow = get().allowHackerModal === false ? true : false;
        set({ allowHackerModal: allow });
      },
      setUiScale: (scale) => {
        set({ uiScale: scale });
      },
      setConsoleHistory: (history) => {
        set({ consoleHistory: history });
      },
      setPane: (id, coord, pinned, locked, visible) => {
        set({
          panes: {
            ...get().panes,
            [id]: {
              coord,
              pinned,
              locked,
              visible,
            },
          },
        });
      },
      removePane: (id) => {
        const panes = { ...get().panes };
        delete panes[id];
        set({ panes });
      },
      resetPanes: () => {
        set({ panes: {} });
      },
      setNoExternalAccount: (value: boolean) => set({ noExternalAccount: value }),
      removeNoExternalAccount: () => set({ noExternalAccount: false }),
      setHideHotkeys: (val: boolean) => set({ hideHotkeys: val }),
    }),
    {
      name: "persistent-storage",
      // handle parsing of set objects since storing raw sets is not possible due to stringify behavior
      storage: {
        getItem: (key) => {
          const str = localStorage.getItem(key);
          const result: PersistentState["keybinds"] = {};
          const parsed = JSON.parse(str!);
          const version: number = parsed.version;
          const keybinds = parsed.state.keybinds as Partial<{
            [key in KeybindActions]: Key[];
          }>;

          for (const _action in keybinds) {
            const action = parseInt(_action) as KeybindActions;
            const array = keybinds[action];
            const set = new Set(array);
            result[action] = set;
          }

          return {
            version,
            state: {
              ...JSON.parse(str!).state,
              keybinds: result,
            },
          };
        },
        setItem: (key, value) => {
          const result: Partial<{
            [key in KeybindActions]: Key[];
          }> = {};
          const keybinds = value.state.keybinds as Keybinds;
          const version = value.version;

          for (const _action in keybinds) {
            const action = parseInt(_action) as KeybindActions;
            const set = keybinds[action];

            if (!set) continue;

            const array = Array.from(set) as Key[];
            result[action] = array;
          }

          const str = JSON.stringify({
            version,
            state: {
              ...value.state,
              keybinds: result,
            },
          });

          localStorage.setItem(key, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      version: VERSION,
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      migrate: (persistedStore: any, version) => {
        if (version === VERSION) return persistedStore;

        return { ...persistedStore!, ...defaults } as PersistentState & PersistentActions;
      },
    }
  )
);

//store dev tools
if (import.meta.env.VITE_DEV === "true") {
  mountStoreDevtool("SettingsStore", usePersistentStore);
}
