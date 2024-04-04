import { components } from "src/network/components";
import { hexToString, Hex } from "viem";
import { Entity } from "@latticexyz/recs";
import { censorText } from "./profanity";

export const getAllianceName = (alliance: Entity, censor = false) => {
  const allianceData = components.Alliance.get(alliance);
  if (!allianceData) return "";

  const allianceName = hexToString(allianceData.name as Hex, { size: 32 });

  return censor ? censorText(allianceName) : allianceName;
};

export const getAllianceNameFromPlayer = (player: Entity, censor = false) => {
  const alliance = components.PlayerAlliance.get(player)?.alliance as Entity;
  const allianceData = components.Alliance.get(alliance);
  if (!allianceData) return "";

  const allianceName = hexToString(allianceData!.name as Hex, { size: 32 });
  return censor ? censorText(allianceName) : allianceName;
};
