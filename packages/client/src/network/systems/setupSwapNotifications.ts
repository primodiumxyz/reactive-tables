// import { SyncState } from "@latticexyz/network";
import { defineComponentSystem, namespaceWorld } from "@latticexyz/recs";
import { EResource } from "contracts/config/enums";
import { toast } from "react-toastify";
import { getBlockTypeName } from "src/util/common";
import { ResourceEntityLookup } from "src/util/constants";
import { formatResourceCount } from "src/util/number";
import { components } from "../components";
import { MUD } from "../types";
import { world } from "../world";

export function setupSwapNotifications(mud: MUD) {
  const systemWorld = namespaceWorld(world, "systems");

  defineComponentSystem(
    systemWorld,
    components.Swap,
    ({ entity: swapper, value }) => {
      const player = mud.playerAccount.entity;
      const swap = value[0];
      if (!swap || swapper !== player) return;

      const inResource = ResourceEntityLookup[swap.resourceIn as EResource];
      const outResource = ResourceEntityLookup[swap.resourceOut as EResource];
      const formattedIn = formatResourceCount(inResource, swap.amountIn, { fractionDigits: 2 });
      const formattedOut = formatResourceCount(outResource, swap.amountOut, { fractionDigits: 2 });
      toast.success(
        `Swap success! ${formattedIn} ${getBlockTypeName(inResource)} swapped for ${formattedOut} ${getBlockTypeName(
          outResource
        )}.`
      );
    },
    { runOnInit: false }
  );
}
