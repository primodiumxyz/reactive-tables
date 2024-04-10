import { defineWorld } from "@latticexyz/world";

export default defineWorld({
  tables: {
    Counter: {
      schema: {
        value: "uint32",
      },
      key: [],
    },
    Position: {
      schema: {
        id: "bytes32",
        x: "int32",
        y: "int32",
      },
      key: ["id"],
      codegen: {
        dataStruct: false,
      },
    },
    Inventory: {
      schema: {
        id: "bytes32",
        items: "uint32[]",
      },
      key: ["id"],
    },
  },
});
