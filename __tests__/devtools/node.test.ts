// @vitest-environment node
import { describe, it } from "vitest";

// libs
import { padHex, toHex } from "viem";

// src
import { createWrapper, Entity } from "@/index";

import mudConfig from "@test/contracts/mud.config";
import { networkConfig } from "@test/utils";

/* -------------------------------------------------------------------------- */
/*                                    SETUP                                   */
/* -------------------------------------------------------------------------- */

// const emptyData = {
//   __staticData: "0x" as Hex,
//   __encodedLengths: "0x" as Hex,
//   __dynamicData: "0x" as Hex,
//   __lastSyncedAtBlock: BigInt(0),
// };

const setup = () => ({
  ...createWrapper({
    mudConfig,
    devTools: { enabled: true, publicClient: networkConfig.publicClient, worldAddress: networkConfig.worldAddress },
  }),
  entities: ["A", "B", "C", "D", "E"].map((id) => padHex(toHex(`entity${id}`))) as Entity[],
});

/* -------------------------------------------------------------------------- */
/*                                    SETUP                                   */
/* -------------------------------------------------------------------------- */

describe("<TITLE>", () => {
  it("<TITLE>", () => {
    // const { tables } = setup();s
    setup();
  });
});
