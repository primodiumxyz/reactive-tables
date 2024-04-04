// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { PrimodiumSystem } from "systems/internal/PrimodiumSystem.sol";
import { UserDelegationControl } from "@latticexyz/world/src/codegen/index.sol";
import { SystemCall } from "@latticexyz/world/src/SystemCall.sol";
import { getSystemResourceId } from "src/utils.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { WorldRegistrationSystem } from "@latticexyz/world/src/modules/core/implementations/WorldRegistrationSystem.sol";
import { CORE_SYSTEM_ID } from "@latticexyz/world/src/modules/core/constants.sol";

contract DelegationSystem is PrimodiumSystem {
  function unregisterDelegation(address authorizedAddress) public {
    bytes32 playerEntity = _player();
    UserDelegationControl.deleteRecord({ delegator: _msgSender(), delegatee: authorizedAddress });
  }

  function switchDelegation(
    address oldAuthorizedAddress,
    address newAuthorizedAddress,
    ResourceId delegationControlId,
    bytes memory initCallData
  ) public {
    bytes32 playerEntity = _player();
    unregisterDelegation(oldAuthorizedAddress);
    SystemCall.callWithHooksOrRevert(
      _msgSender(),
      CORE_SYSTEM_ID,
      abi.encodeCall(
        WorldRegistrationSystem.registerDelegation,
        (newAuthorizedAddress, delegationControlId, initCallData)
      ),
      0
    );
  }
}
