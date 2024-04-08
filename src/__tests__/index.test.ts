import { describe, it, expect } from "vitest";
import { createWorld } from "@latticexyz/recs";

// src
import { tinyBaseWrapper } from "../index";
// mocks
import { getMockNetworkConfig } from "./mocks";
import mockConfig from "./mocks/mud.config";

describe("tinyBaseWrapper", () => {
  it("should properly initialize and return expected objects", async () => {
    const world = createWorld();
    const networkConfig = getMockNetworkConfig();

    const { store, tables, publicClient, sync } = await tinyBaseWrapper({
      world,
      mudConfig: mockConfig,
      networkConfig,
    });

    // Verify the existence and basic structure of the returned objects
    expect(store).toBeDefined();
    expect(tables).toBeDefined();
    expect(publicClient).toBeDefined();
    expect(sync).toBeDefined();
  });
});
