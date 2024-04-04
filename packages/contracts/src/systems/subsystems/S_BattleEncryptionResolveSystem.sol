// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { PrimodiumSystem } from "systems/internal/PrimodiumSystem.sol";
import { LibFleetCombat } from "libraries/fleet/LibFleetCombat.sol";

contract S_BattleEncryptionResolveSystem is PrimodiumSystem {
  function resolveBattleEncryption(bytes32 battleId, bytes32 targetSpaceRock, bytes32 aggressorEntity) public {
    LibFleetCombat.resolveBattleEncryption(battleId, targetSpaceRock, aggressorEntity);
  }
}
