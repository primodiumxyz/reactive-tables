import { Entity } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { isPlayer } from "./common";
import { hashEntities } from "./encode";

const adjectives = [
  "Stellar",
  "Cosmic",
  "Galactic",
  "Lunar",
  "Solar",
  "Stellar",
  "Celestial",
  "Orbital",
  "Astral",
  "Starlit",
  "Meteoric",
  "Nebular",
  "Quantum",
  "Void",
  "Shining",
  "Eclipse",
  "Astric",
  "Supernovic",
  "Planetary",
  "Gravity",
  "Milky",
  "Photonic",
  "Dark",
  "Space",
  "Space",
  "Astro",
  "Nebulaic",
];

const nouns = [
  "Voyager",
  "Orion",
  "Andromeda",
  "Pulsar",
  "Quasar",
  "BlackHole",
  "Spacecraft",
  "Asteroid",
  "Galaxy",
  "Nebula",
  "Starship",
  "Meteorite",
  "Cosmonaut",
  "Astronaut",
  "Satellite",
  "Comet",
  "Planetoid",
  "Star",
  "Moon",
  "Sun",
  "Universe",
  "Wormhole",
  "Spacesuit",
  "Telescope",
  "Astrolab",
  "Rocket",
  "Mars",
  "Venus",
  "Mercury",
  "Jupiter",
];

const entityPlayerName = new Map<Entity, string>();
export const entityToPlayerName = (entity: Entity | undefined) => {
  if (!entity || entity == singletonEntity) return "Nobody";
  if (!isPlayer(entity)) return "Pirate";
  if (entityPlayerName.has(entity)) return entityPlayerName.get(entity) as string;

  const hash = hashEntities(entity);

  const adjIndex = parseInt(hash.substring(0, 8), 16) % adjectives.length;
  const nounIndex = parseInt(hash.substring(8, 16), 16) % nouns.length;
  const number = parseInt(hash.substring(16, 20), 16) % 100;

  const name = `${adjectives[adjIndex]}.${nouns[nounIndex]}-${number}`;

  entityPlayerName.set(entity, name);
  return name;
};

export const playerNameToEntity = (name: string) => {
  return [...entityPlayerName.entries()].find(([, v]) => v === name)?.[0];
};

const entityRockname = new Map<Entity, string>();
export const entityToRockName = (entity: Entity) => {
  if (entityRockname.has(entity)) return entityRockname.get(entity) as string;

  const hash = hashEntities(entity);

  const prefix1 = parseInt(hash.substring(0, 4), 16) % 26;
  const prefix2 = parseInt(hash.substring(4, 8), 16) % 26;
  const number = parseInt(hash.substring(8, 12), 16) % 251;
  const suffix = parseInt(hash.substring(12, 16), 16) % 26;

  const name = `${String.fromCharCode(65 + prefix1)}${String.fromCharCode(
    65 + prefix2
  )} ${number} ${String.fromCharCode(65 + suffix)}`;

  entityRockname.set(entity, name);

  return name;
};

export const rockNameToEntity = (name: string) => {
  return [...entityRockname.entries()].find(([, v]) => v === name)?.[0];
};

const phoneticAlphabet: Record<string, string> = {
  A: "Alpha",
  B: "Bravo",
  C: "Charlie",
  D: "Delta",
  E: "Echo",
  F: "Foxtrot",
  G: "Golf",
  H: "Hotel",
  I: "India",
  J: "Juliet",
  K: "Kilo",
  L: "Lima",
  M: "Mike",
  N: "Nova",
  O: "Oscar",
  P: "Papa",
  Q: "Quebec",
  R: "Romeo",
  S: "Sierra",
  T: "Tango",
  U: "Uniform",
  V: "Victor",
  W: "Whiskey",
  X: "Xray",
  Y: "Yankee",
  Z: "Zulu",
};

const getAlphabetLetter = (index: number) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[index % 26];

const extendName = (name: string) => {
  return `${phoneticAlphabet[name[0]]} ${phoneticAlphabet[name[1]]} ${phoneticAlphabet[name[2]]}`;
};

const entityFleetName = new Map<Entity, string>();
export const entityToFleetName = (entity: Entity, shorten?: boolean) => {
  const fetched = entityFleetName.get(entity);
  if (fetched) return shorten ? fetched : extendName(fetched);

  const hash = hashEntities(entity);
  const index1 = parseInt(hash.substring(0, 8), 16) % 26;
  const index2 = parseInt(hash.substring(8, 16), 16) % 26;
  let index3 = parseInt(hash.substring(16, 32), 16) % 26;
  let name = `${getAlphabetLetter(index1)}${getAlphabetLetter(index2)}${getAlphabetLetter(index3)}`;
  while (fleetNameToEntity(name)) {
    index3 = (index3 + 1) % 26;
    name = `${getAlphabetLetter(index1)}${getAlphabetLetter(index2)}${getAlphabetLetter(index3)}`;
  }
  entityFleetName.set(entity, name);
  return shorten ? name : extendName(name);
};

export const fleetNameToEntity = (name: string) => {
  return [...entityFleetName.entries()].find(([, v]) => v === name)?.[0];
};
