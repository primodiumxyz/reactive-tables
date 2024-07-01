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

describe("Dev Tools", () => {
  it("should correctly render the button to visit dev tools on the original app", () => {
    setup();
  });

  it("should directly render dev tools if the flag is set to true", () => {
    setup();
  });
  it("should be able to refresh on the dev tools page and keep the context", () => {
    setup();
  });
});
