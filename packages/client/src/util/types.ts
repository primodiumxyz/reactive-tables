import { KeybindActions } from "@game/constants";
import { Entity } from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";
import { Step } from "walktour";
import { Action } from "./constants";

export type ContractCoord = Coord & { parent: Entity };

export type BlockTypeActionComponent = {
  action: () => void;
};

export type SimpleCardinal = "up" | "down" | "left" | "right";

export interface TourStep extends Step {
  narration?: JSX.Element;
  hideUI?: boolean;
}

export type HotbarItem = {
  blockType: Entity;
  keybind: KeybindActions;
  action?: Action;
};

export type Hotbar = {
  name: string;
  icon: string;
  items: HotbarItem[];
};

export enum ActiveButton {
  NONE,
  ORIGIN,
  DESTINATION,
}
