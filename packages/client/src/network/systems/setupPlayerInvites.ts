import { Entity, defineComponentSystem, namespaceWorld } from "@latticexyz/recs";
import { toast } from "react-toastify";
import { decodeEntity } from "src/util/encode";
import { Hex, hexToString, padHex, zeroAddress } from "viem";
import { components } from "../components";
import { MUD } from "../types";
import { world } from "../world";

export function setupInvitations(mud: MUD) {
  const { AllianceInvitation, PlayerInvite, Alliance, AllianceJoinRequest, AllianceRequest } = components;
  const systemWorld = namespaceWorld(world, "systems");
  const playerEntity = mud.playerAccount.entity;

  defineComponentSystem(systemWorld, AllianceInvitation, ({ entity, value }) => {
    const { alliance, entity: player } = decodeEntity(AllianceInvitation.metadata.keySchema, entity);

    if (value[0]?.inviter === padHex(zeroAddress, { size: 32 })) {
      PlayerInvite.remove(entity);
      return;
    }

    PlayerInvite.set(
      {
        target: player as Entity,
        alliance: alliance as Entity,
        player: value[0]?.inviter as Entity,
        timestamp: value[0]?.timeStamp ?? 0n,
      },
      entity
    );
  });

  defineComponentSystem(systemWorld, AllianceJoinRequest, ({ entity, value }) => {
    const { alliance, entity: player } = decodeEntity({ entity: "bytes32", alliance: "bytes32" }, entity);

    if (!value[0]?.timeStamp) {
      AllianceRequest.remove(entity);
      return;
    }

    AllianceRequest.set(
      {
        player: player as Entity,
        alliance: alliance as Entity,
        timestamp: value[0]?.timeStamp ?? 0n,
      },
      entity
    );
  });

  defineComponentSystem(systemWorld, PlayerInvite, ({ entity, value }) => {
    if (!value[0]) return;

    if (value[0]?.player === padHex(zeroAddress, { size: 32 })) {
      return;
    }

    // 30 sec buffer
    const now = components.Time.get()?.value ?? 0n;
    if (value[0]?.timestamp + 30n < now) return;

    const invite = PlayerInvite.get(entity);
    const inviteAlliance = Alliance.get(invite?.alliance as Entity)?.name as Hex | undefined;

    if (!inviteAlliance || invite?.target !== playerEntity) return;

    const allianceName = hexToString(inviteAlliance, { size: 32 });

    toast.info(`You have been invited to join [${allianceName}]`);
  });
}
