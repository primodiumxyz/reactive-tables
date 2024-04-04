import { resourceToHex } from "@latticexyz/common";

const UserDelegationControlTableId = resourceToHex({ type: "table", namespace: "", name: "UserDelegationControl" });

export const otherTables = {
  UserDelegationControl: {
    namespace: "world",
    name: "UserDelegationControl",
    tableId: UserDelegationControlTableId,
    keySchema: {
      delegator: { type: "address" },
      delegatee: { type: "address" },
    },
    valueSchema: {
      delegationControlId: {
        type: "bytes32",
      },
    },
  },
} as const;
