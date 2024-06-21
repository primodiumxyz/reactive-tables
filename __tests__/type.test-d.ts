import { describe, expectTypeOf, it } from "vitest";

import { createLocalCoordTable, createLocalTable, createWorld, Type } from "@/index";
import { OptionalSchema } from "@/lib";

describe("local tables", () => {
  it("should be able to correctly infer the schema based on the persist flag", () => {
    const world = createWorld();
    const persistentTables = {
      regular: createLocalTable(
        world,
        { bool: Type.Boolean, array: Type.EntityArray },
        { id: "persistent.regular", persist: true },
      ),
      coord: createLocalCoordTable(world, { id: "persistent.coord", persist: true }),
    };
    const nonPersistentTables = {
      regular: createLocalTable(world, { bool: Type.Boolean, array: Type.EntityArray }),
      regularFlag: createLocalTable(world, { bool: Type.Boolean, array: Type.EntityArray }, { persist: false }),
      coord: createLocalCoordTable(world),
      coordFlag: createLocalCoordTable(world, { persist: false }),
    };

    expectTypeOf(persistentTables.regular.propertiesSchema).toEqualTypeOf<
      OptionalSchema<{
        bool: Type.Boolean;
        array: Type.EntityArray;
      }>
    >();
    expectTypeOf(persistentTables.coord.propertiesSchema).toEqualTypeOf<
      OptionalSchema<{ x: Type.Number; y: Type.Number }>
    >();

    expectTypeOf(nonPersistentTables.regular.propertiesSchema).toEqualTypeOf<{
      bool: Type.Boolean;
      array: Type.EntityArray;
    }>();
    expectTypeOf(nonPersistentTables.regularFlag.propertiesSchema).toEqualTypeOf<{
      bool: Type.Boolean;
      array: Type.EntityArray;
    }>();
    expectTypeOf(nonPersistentTables.coord.propertiesSchema).toEqualTypeOf<{ x: Type.Number; y: Type.Number }>();
    expectTypeOf(nonPersistentTables.coordFlag.propertiesSchema).toEqualTypeOf<{ x: Type.Number; y: Type.Number }>();
  });
});
