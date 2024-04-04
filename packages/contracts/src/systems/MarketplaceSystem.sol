// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

// external
import { PrimodiumSystem } from "systems/internal/PrimodiumSystem.sol";

import { EResource } from "src/Types.sol";
import { BuildingType, OwnedBy, Reserves, ReservesData, P_MarketplaceConfig, Swap } from "codegen/index.sol";
import { LibMarketplace } from "libraries/LibMarketplace.sol";

import { MarketPrototypeId } from "codegen/Prototypes.sol";

contract MarketplaceSystem is PrimodiumSystem {
  modifier onlyUnlocked() {
    require(!P_MarketplaceConfig.getLock(), "[Marketplace] Marketplace is locked");
    _;
  }

  function toggleMarketplaceLock() public onlyAdmin {
    bool wasLocked = P_MarketplaceConfig.getLock();
    P_MarketplaceConfig.setLock(!wasLocked);
  }

  function addLiquidity(
    EResource resourceA,
    EResource resourceB,
    uint256 liquidityA,
    uint256 liquidityB
  ) public onlyAdmin {
    require(resourceA != resourceB, "[Marketplace] Cannot add liquidity for same resource");
    require(liquidityA > 0 || liquidityB > 0, "[Marketplace] Cannot add 0 liquidity");

    ReservesData memory reserves = Reserves.get(uint8(resourceA), uint8(resourceB));
    Reserves.set(uint8(resourceA), uint8(resourceB), reserves.amountA + liquidityA, reserves.amountB + liquidityB);
  }

  function removeLiquidity(
    EResource resourceA,
    EResource resourceB,
    uint256 liquidityA,
    uint256 liquidityB
  ) public onlyAdmin {
    require(resourceA != resourceB, "[Marketplace] Cannot remove liquidity for same resource");
    require(liquidityA > 0 || liquidityB > 0, "[Marketplace] Cannot remove 0 liquidity");

    ReservesData memory reserves = Reserves.get(uint8(resourceA), uint8(resourceB));
    require(reserves.amountA >= liquidityA && reserves.amountB >= liquidityB, "[Marketplace] Not enough liquidity");
    Reserves.set(uint8(resourceA), uint8(resourceB), reserves.amountA - liquidityA, reserves.amountB - liquidityB);
  }

  function swap(
    bytes32 marketEntity,
    EResource[] memory path,
    uint256 amountIn,
    uint256 amountOutMin
  ) public onlyUnlocked _claimResources(OwnedBy.get(marketEntity)) {
    require(BuildingType.get(marketEntity) == MarketPrototypeId, "[Marketplace] Building is not a marketplace");

    bytes32 spaceRockEntity = OwnedBy.get(marketEntity);
    require(OwnedBy.get(spaceRockEntity) == _player(), "[Marketplace] Not owned by player");

    uint256 amountOut = LibMarketplace.swap(spaceRockEntity, path, amountIn, amountOutMin);
    Swap.set(_player(), uint8(path[0]), uint8(path[path.length - 1]), amountIn, amountOut);
  }
}
