import { Entity } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { components } from "src/network/components";
import { hashEntities } from "src/util/encode";

const entityColor = new Map<Entity, string>();
export function entityToColor(entity: Entity | undefined) {
  if (!entity || entity === singletonEntity) return "#999999";
  const alliance = components.PlayerAlliance.get(entity)?.alliance as Entity;
  entity = alliance ?? entity;
  if (entity === components.Account.get()?.value) return "#22d3ee";
  if (entityColor.has(entity)) return entityColor.get(entity) as string;
  const hash = hashEntities(entity);

  // Define the step size for quantization
  const numColors = 256;
  const stepSize = Math.round(256 / numColors); // Adjust this value to control the granularity

  // Extract and quantize characters from the address to create RGB values
  const h = Math.floor((parseInt(hash.substring(60, 66), 16) % 256) / stepSize) * stepSize;
  const s = Math.max(50, Math.floor((parseInt(hash.substring(54, 60), 16) % 100) / stepSize) * stepSize);
  const l = Math.max(60, Math.floor((parseInt(hash.substring(48, 54), 16) % 100) / stepSize) * stepSize);

  const color = hslToHex(h / 360, s / 100, l / 100);
  entityColor.set(entity, color);
  return color;
}

function hslToHex(h: number, s: number, l: number) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
