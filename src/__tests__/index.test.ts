import { describe, it, expect } from "vitest";
import { createWorld, getComponentValue } from "@latticexyz/recs";
import { syncToRecs } from "@latticexyz/store-sync/recs";
import { waitForTransactionReceipt, writeContract } from "viem/actions";

// src
import { tinyBaseWrapper } from "@/index";
// mocks
import { getMockNetworkConfig } from "@/__tests__/mocks";
import mockConfig from "@/__tests__/mocks/contracts/mud.config";

describe("tinyBaseWrapper", () => {
  it("should properly initialize and return expected objects", async () => {
    const world = createWorld();
    const networkConfig = getMockNetworkConfig();

    const { components, tables, publicClient, sync } = await tinyBaseWrapper({
      world,
      mudConfig: mockConfig,
      networkConfig,
    });

    // Sync RECS components for comparison
    const { components: recsComponents } = await syncToRecs({
      world,
      config: mockConfig,
      address: networkConfig.worldAddress,
      publicClient: networkConfig.publicClient,
      startBlock: networkConfig.initialBlockNumber,
    });

    // Test function to update an entity's position
    const move = async () => {
      const txHash = await writeContract(networkConfig.publicClient, {
        ...networkConfig.worldContract,
        chain: networkConfig.chain,
        account: networkConfig.burnerAccount.address,
        functionName: "move",
        args: [10, 10],
      });
      await waitForTransactionReceipt(networkConfig.publicClient, { hash: txHash });
    };

    await move();
    console.log(
      // Current account as bytes32
      getComponentValue(recsComponents.Position, "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266"),
    );

    // Verify the existence of the result
    expect(components).toBeDefined();
    expect(tables).toBeDefined();
    expect(publicClient).toBeDefined();
    expect(sync).toBeDefined();
  });
});
