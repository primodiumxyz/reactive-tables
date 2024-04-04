// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

// tables
import { ProducedUnit, P_ProducedUnits, OwnedBy, UnitCount, P_RequiredExpansion, P_ProducedUnitsData, DefeatedPirate, P_DefeatedPirates, P_RequiredUnits, P_RequiredUnitsData, DestroyedUnit, P_DestroyedUnits, P_DestroyedUnitsData, P_ProducedResources, P_ProducedResourcesData, ProducedResource, RaidedResource, P_RaidedResources, P_RaidedResourcesData, P_EnumToPrototype, HasBuiltBuilding, P_HasBuiltBuildings, P_RequiredObjectives, CompletedObjective, P_RequiredBaseLevel, Level } from "codegen/index.sol";

// libraries
import { LibUnit } from "libraries/LibUnit.sol";
import { LibBuilding } from "libraries/LibBuilding.sol";

// types
import { ObjectiveKey } from "src/Keys.sol";
import { EObjectives } from "src/Types.sol";

library LibObjectives {
  function checkObjectiveRequirements(
    bytes32 playerEntity,
    bytes32 spaceRockEntity,
    EObjectives objectiveType
  ) internal view {
    bytes32 spaceRockOwner = OwnedBy.get(spaceRockEntity);
    require(spaceRockOwner == playerEntity, "[LibObjectives] Player does not own the space rock");
    checkIsValidObjective(objectiveType);

    bytes32 objectivePrototype = P_EnumToPrototype.get(ObjectiveKey, uint8(objectiveType));

    checkHasNotCompletedObjective(playerEntity, objectivePrototype);
    checkHasCompletedRequiredObjectives(playerEntity, objectivePrototype);
    checkObjectiveMainBaseLevelRequirement(playerEntity, spaceRockEntity, objectivePrototype);
    checkObjectiveExpansionRequirement(playerEntity, spaceRockEntity, objectivePrototype);
    checkHasBuiltRequiredBuildings(playerEntity, objectivePrototype);
    checkProducedResources(playerEntity, objectivePrototype);
    checkRaidedResources(playerEntity, objectivePrototype);
    checkDestroyedUnits(playerEntity, objectivePrototype);
    checkProducedUnits(playerEntity, objectivePrototype);
    checkHasRequiredUnits(playerEntity, spaceRockEntity, objectivePrototype);
    checkDefeatedPirateAsteroidRequirement(playerEntity, objectivePrototype);
  }

  function checkIsValidObjective(EObjectives objectiveType) internal pure {
    require(
      objectiveType > EObjectives.NULL && objectiveType < EObjectives.LENGTH,
      "[LibObjectives] Invalid objective"
    );
  }

  function checkHasNotCompletedObjective(bytes32 playerEntity, bytes32 objectivePrototype) internal view {
    require(
      !CompletedObjective.get(playerEntity, objectivePrototype),
      "[LibObjectives] Player has already completed objective"
    );
  }

  function checkHasCompletedRequiredObjectives(bytes32 playerEntity, bytes32 objective) internal view {
    bytes32[] memory requiredObjectives = P_RequiredObjectives.get(objective);
    for (uint256 i = 0; i < requiredObjectives.length; i++) {
      require(
        CompletedObjective.get(playerEntity, requiredObjectives[i]),
        "[LibObjectives] Player has not completed required objective"
      );
    }
  }

  function checkObjectiveMainBaseLevelRequirement(
    bytes32 playerEntity,
    bytes32 spaceRockEntity,
    bytes32 objective
  ) internal view {
    uint256 requiredMainBaseLevel = P_RequiredBaseLevel.get(objective, 1);
    if (requiredMainBaseLevel > 1) {
      require(
        LibBuilding.getBaseLevel(spaceRockEntity) >= requiredMainBaseLevel,
        "[LibObjectives] MainBase level requirement not met"
      );
    }
  }

  function checkObjectiveExpansionRequirement(
    bytes32 playerEntity,
    bytes32 spaceRockEntity,
    bytes32 objective
  ) internal view {
    uint256 requiredExpansionLevel = P_RequiredExpansion.get(objective);
    if (requiredExpansionLevel == 0) return;
    uint256 playerExpansion = Level.get(spaceRockEntity);
    require(playerExpansion >= requiredExpansionLevel, "[LibObjectives] Expansion level requirement not met");
  }

  function checkHasBuiltRequiredBuildings(bytes32 playerEntity, bytes32 objective) internal view {
    bytes32[] memory requiredBuiltBuildings = P_HasBuiltBuildings.get(objective);
    for (uint256 i = 0; i < requiredBuiltBuildings.length; i++) {
      require(
        HasBuiltBuilding.get(playerEntity, requiredBuiltBuildings[i]),
        "[LibObjectives] Player has not built the required buildings"
      );
    }
  }

  function checkProducedResources(bytes32 playerEntity, bytes32 objective) internal view {
    P_ProducedResourcesData memory producedResources = P_ProducedResources.get(objective);
    for (uint256 i = 0; i < producedResources.resources.length; i++) {
      require(
        ProducedResource.get(playerEntity, producedResources.resources[i]) >= producedResources.amounts[i],
        "[LibObjectives] Player has not produced the required resources"
      );
    }
  }

  function checkRaidedResources(bytes32 playerEntity, bytes32 objective) internal view {
    P_RaidedResourcesData memory raidedResources = P_RaidedResources.get(objective);
    for (uint256 i = 0; i < raidedResources.resources.length; i++) {
      require(
        RaidedResource.get(playerEntity, raidedResources.resources[i]) >= raidedResources.amounts[i],
        "[LibObjectives] Player has not raided the required resources"
      );
    }
  }

  function checkDestroyedUnits(bytes32 playerEntity, bytes32 objective) internal view {
    P_DestroyedUnitsData memory destroyedUnits = P_DestroyedUnits.get(objective);
    for (uint256 i = 0; i < destroyedUnits.units.length; i++) {
      require(
        DestroyedUnit.get(playerEntity, destroyedUnits.units[i]) >= destroyedUnits.amounts[i],
        "[LibObjectives] Player has not destroyed the required units"
      );
    }
  }

  function checkProducedUnits(bytes32 playerEntity, bytes32 objective) internal view {
    P_ProducedUnitsData memory producedUnits = P_ProducedUnits.get(objective);
    for (uint256 i = 0; i < producedUnits.units.length; i++) {
      require(
        ProducedUnit.get(playerEntity, producedUnits.units[i]) >= producedUnits.amounts[i],
        "[LibObjectives] Player has not produced the required units"
      );
    }
  }

  function checkHasRequiredUnits(bytes32 playerEntity, bytes32 spaceRockEntity, bytes32 objective) internal view {
    P_RequiredUnitsData memory requiredUnits = P_RequiredUnits.get(objective);
    for (uint256 i = 0; i < requiredUnits.units.length; i++) {
      require(
        UnitCount.get(spaceRockEntity, requiredUnits.units[i]) >= requiredUnits.amounts[i],
        "[LibObjectives] Player does not have the required units"
      );
    }
  }

  function checkDefeatedPirateAsteroidRequirement(bytes32 playerEntity, bytes32 objective) internal view {
    bytes32[] memory requiredDefeatedPirates = P_DefeatedPirates.get(objective);
    for (uint256 i = 0; i < requiredDefeatedPirates.length; i++) {
      require(
        DefeatedPirate.get(playerEntity, requiredDefeatedPirates[i]),
        "[LibObjectives] Player has not defeated the required pirates"
      );
    }
  }
}
