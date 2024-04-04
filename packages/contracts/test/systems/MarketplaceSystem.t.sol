// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";

contract MarketplaceSystemTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
  }

  EResource[] path;

  /* --------------------------------- Helpers -------------------------------- */

  function buildMarketplace(address player) public returns (bytes32, bytes32) {
    bytes32 homeAsteroid = spawn(player);
    vm.startPrank(creator);
    P_RequiredBaseLevel.deleteRecord(MarketPrototypeId, 1);
    P_RequiredResources.deleteRecord(MarketPrototypeId, 1);
    vm.stopPrank();
    bytes32 playerEntity = addressToEntity(player);
    vm.startPrank(player);
    PositionData memory position = getTilePosition(homeAsteroid, EBuilding.Market);
    bytes32 marketEntity = world.build(EBuilding.Market, getTilePosition(homeAsteroid, EBuilding.Market));
    vm.stopPrank();
    return (homeAsteroid, marketEntity);
  }

  function testSwapSanityCheck() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);

    path.push(EResource.Iron);
    path.push(RESERVE_CURRENCY_RESOURCE);
    path.push(EResource.Iron);

    uint256 amountIn = 10e18;
    uint256 reserveOut = LibMarketplace.getAmountOut(
      amountIn,
      Reserves.getAmountA(Iron, RESERVE_CURRENCY),
      Reserves.getAmountB(Iron, RESERVE_CURRENCY)
    );
    uint256 expectedAmountOut = LibMarketplace.getAmountOut(
      reserveOut,
      Reserves.getAmountB(Iron, RESERVE_CURRENCY),
      Reserves.getAmountA(Iron, RESERVE_CURRENCY)
    );

    console.log("Reserve out: %s", reserveOut);
    console.log("Expected amount out: %s", expectedAmountOut);

    MaxResourceCount.set(asteroid, Iron, MAX_INT);
    ResourceCount.set(asteroid, Iron, amountIn);

    MaxResourceCount.set(asteroid, RESERVE_CURRENCY, MAX_INT);

    world.swap(market, path, amountIn, 0);

    console.log(ResourceCount.get(asteroid, Iron) / 1e18);
  }

  /* ---------------------------------- Swap ---------------------------------- */
  function testSwapFailNotMarket() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);
    vm.expectRevert("[Marketplace] Building is not a marketplace");

    path.push(EResource.Iron);
    path.push(EResource.Copper);
    world.swap(asteroid, path, 1, 1);
  }

  function testSwapMarketNotOwned() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(alice);
    vm.startPrank(creator);
    vm.expectRevert("[Marketplace] Not owned by player");
    path.push(EResource.Iron);
    path.push(EResource.Copper);

    world.swap(market, path, 1, 1);
  }

  function testSwapReserveCurrencyOut() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);

    ReservesData memory reserves = Reserves.get(Iron, RESERVE_CURRENCY);
    uint256 amountIn = 1000;
    uint256 expectedAmountOut = LibMarketplace.getAmountOut(amountIn, reserves.amountA, reserves.amountB);

    MaxResourceCount.set(asteroid, Iron, amountIn);
    ResourceCount.set(asteroid, Iron, amountIn);
    MaxResourceCount.set(asteroid, RESERVE_CURRENCY, 2 ** 256 - 1);

    uint256 prevIron = ResourceCount.get(asteroid, Iron);
    path.push(EResource.Iron);
    path.push(RESERVE_CURRENCY_RESOURCE);
    world.swap(market, path, amountIn, expectedAmountOut);

    // iron should go up
    assertEq(Reserves.getAmountA(Iron, RESERVE_CURRENCY), reserves.amountA + amountIn, "new reserve A");
    // reserve currency should go down
    assertEq(Reserves.getAmountB(Iron, RESERVE_CURRENCY), reserves.amountB - expectedAmountOut, "new reserve B");

    // iron should go down
    assertEq(ResourceCount.get(asteroid, Iron), prevIron - amountIn, "new iron count");
    // reserve currency should go up
    assertEq(ResourceCount.get(asteroid, RESERVE_CURRENCY), expectedAmountOut, "new reserve resource count");
  }

  function testSwapReserveCurrencyIn() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);

    ReservesData memory reserves = Reserves.get(Iron, RESERVE_CURRENCY);
    uint256 amountIn = 1e18;
    uint256 expectedAmountOut = LibMarketplace.getAmountOut(amountIn, reserves.amountB, reserves.amountA);

    MaxResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    ResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    MaxResourceCount.set(asteroid, Iron, 2 ** 256 - 1);

    uint256 prevIron = ResourceCount.get(asteroid, Iron);
    uint256 prevReserveCurrency = ResourceCount.get(asteroid, RESERVE_CURRENCY);

    path.push(RESERVE_CURRENCY_RESOURCE);
    path.push(EResource.Iron);

    world.swap(market, path, amountIn, expectedAmountOut);

    // iron should go up
    assertEq(Reserves.getAmountA(Iron, RESERVE_CURRENCY), reserves.amountA - expectedAmountOut, "new reserve A");
    // reserve currency should go down
    assertEq(Reserves.getAmountB(Iron, RESERVE_CURRENCY), reserves.amountB + amountIn, "new reserve B");

    // iron should go down
    assertEq(ResourceCount.get(asteroid, Iron), prevIron + expectedAmountOut, "new iron count");
    // reserve currency should go up
    assertEq(
      ResourceCount.get(asteroid, RESERVE_CURRENCY),
      prevReserveCurrency - amountIn,
      "new reserve resource count"
    );
  }

  function testSwapFailInvalidAmount() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);

    ReservesData memory reserves = Reserves.get(Iron, RESERVE_CURRENCY);
    path.push(RESERVE_CURRENCY_RESOURCE);
    path.push(EResource.Iron);

    vm.expectRevert("[Marketplace] Invalid amount");
    world.swap(market, path, 0, 0);
  }

  function testSwapFailInvalidResource() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);

    ReservesData memory reserves = Reserves.get(Iron, RESERVE_CURRENCY);
    uint256 amountIn = 1e18;
    uint256 expectedAmountOut = LibMarketplace.getAmountOut(amountIn, reserves.amountB, reserves.amountA);

    MaxResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    ResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    MaxResourceCount.set(asteroid, Iron, 2 ** 256 - 1);

    path.push(RESERVE_CURRENCY_RESOURCE);
    path.push(EResource.U_Electricity);
    path.push(RESERVE_CURRENCY_RESOURCE);

    vm.expectRevert("[Marketplace] Invalid resource");
    world.swap(market, path, amountIn, expectedAmountOut);

    path = new EResource[](2);
    path.push(EResource.U_Electricity);
    path.push(RESERVE_CURRENCY_RESOURCE);

    vm.expectRevert("[Marketplace] Invalid resource");
    world.swap(market, path, amountIn, expectedAmountOut);
  }

  function testSwapFailInvalidPath() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);

    ReservesData memory reserves = Reserves.get(Iron, RESERVE_CURRENCY);

    vm.expectRevert("[Marketplace] Invalid amount");
    world.swap(market, path, 0, 0);

    path.push(EResource.Iron);
    vm.expectRevert("[Marketplace] Invalid amount");
    world.swap(market, path, 0, 0);
  }

  function testSwapFailSameResource() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);
    ReservesData memory reserves = Reserves.get(Iron, RESERVE_CURRENCY);
    uint256 amountIn = 1e18;
    uint256 expectedAmountOut = LibMarketplace.getAmountOut(amountIn, reserves.amountB, reserves.amountA);

    MaxResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    ResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    MaxResourceCount.set(asteroid, Iron, 2 ** 256 - 1);

    MaxResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    ResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    MaxResourceCount.set(asteroid, Iron, 2 ** 256 - 1);

    path.push(RESERVE_CURRENCY_RESOURCE);
    path.push(EResource.Iron);
    path.push(EResource.Iron);

    vm.expectRevert("[Marketplace] Cannot swap for same resource");
    world.swap(market, path, 1, 0);
  }

  function testSwapFailMinAmountOutTooSmall() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);

    ReservesData memory reserves = Reserves.get(Iron, RESERVE_CURRENCY);
    uint256 amountIn = 1e18;
    uint256 expectedAmountOut = LibMarketplace.getAmountOut(amountIn, reserves.amountB, reserves.amountA);

    MaxResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    ResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    MaxResourceCount.set(asteroid, Iron, 2 ** 256 - 1);

    MaxResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    ResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    MaxResourceCount.set(asteroid, Iron, 2 ** 256 - 1);

    path.push(RESERVE_CURRENCY_RESOURCE);
    path.push(EResource.Iron);

    vm.expectRevert("[Marketplace] Insufficient output amount");
    world.swap(market, path, amountIn, expectedAmountOut + 1);
  }

  function testSwapFailInsufficientLiquidity() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);

    ReservesData memory reserves = Reserves.get(Iron, RESERVE_CURRENCY);
    uint256 inLiquidity = reserves.amountA;
    uint256 amountIn = inLiquidity + 1;

    MaxResourceCount.set(asteroid, Iron, inLiquidity + 1000);
    ResourceCount.set(asteroid, Iron, inLiquidity + 1);
    MaxResourceCount.set(asteroid, RESERVE_CURRENCY, 10000);

    path.push(EResource.Iron);
    path.push(RESERVE_CURRENCY_RESOURCE);

    vm.expectRevert("[Marketplace] Insufficient liquidity");
    world.swap(market, path, amountIn, 0);
  }

  function testSwapAcrossCurves() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);

    path.push(EResource.Iron);
    path.push(RESERVE_CURRENCY_RESOURCE);
    path.push(EResource.Copper);

    uint256 amountIn = 1e6;
    uint256 reserveOut = LibMarketplace.getAmountOut(
      amountIn,
      Reserves.getAmountA(Iron, RESERVE_CURRENCY),
      Reserves.getAmountB(Iron, RESERVE_CURRENCY)
    );
    uint256 expectedAmountOut = LibMarketplace.getAmountOut(
      reserveOut,
      Reserves.getAmountB(Copper, RESERVE_CURRENCY),
      Reserves.getAmountA(Copper, RESERVE_CURRENCY)
    );
    console.log("Reserve out: %s", reserveOut);
    console.log("Expected amount out: %s", expectedAmountOut);

    MaxResourceCount.set(asteroid, Iron, amountIn);
    ResourceCount.set(asteroid, Iron, amountIn);
    MaxResourceCount.set(asteroid, Copper, MAX_INT);
    MaxResourceCount.set(asteroid, RESERVE_CURRENCY, MAX_INT);

    world.swap(market, path, amountIn, 0);

    assertEq(ResourceCount.get(asteroid, Iron), 0, "iron");
    assertEq(ResourceCount.get(asteroid, RESERVE_CURRENCY), 0, "reserve");
    assertEq(ResourceCount.get(asteroid, Copper), expectedAmountOut, "copper");
  }

  /* ---------------------------------- Admin --------------------------------- */

  function testLock() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);

    world.toggleMarketplaceLock();
    vm.expectRevert("[Marketplace] Marketplace is locked");

    world.swap(market, path, 0, 0);
  }

  function testUnlock() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);

    vm.startPrank(creator);
    world.toggleMarketplaceLock();
    world.toggleMarketplaceLock();
    ReservesData memory reserves = Reserves.get(Iron, RESERVE_CURRENCY);
    uint256 amountIn = 1e18;
    uint256 expectedAmountOut = LibMarketplace.getAmountOut(amountIn, reserves.amountB, reserves.amountA);

    MaxResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    ResourceCount.set(asteroid, RESERVE_CURRENCY, amountIn);
    MaxResourceCount.set(asteroid, Iron, 2 ** 256 - 1);

    uint256 prevIron = ResourceCount.get(asteroid, Iron);
    uint256 prevReserveCurrency = ResourceCount.get(asteroid, RESERVE_CURRENCY);

    path.push(RESERVE_CURRENCY_RESOURCE);
    path.push(EResource.Iron);

    world.swap(market, path, amountIn, expectedAmountOut);
  }

  function testLockFailNotAdmin() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(alice);
    vm.expectRevert("[Primodium] Only admin");
    world.toggleMarketplaceLock();
  }

  function testAddLiquidity() public {
    vm.startPrank(creator);
    world.addLiquidity(EResource.Iron, EResource.Copper, 1000, 1000);
    assertEq(Reserves.getAmountA(Iron, Copper), 1000);
    assertEq(Reserves.getAmountB(Iron, Copper), 1000);
  }

  function testIsolatedPairReserves() public {
    (bytes32 asteroid, bytes32 market) = buildMarketplace(creator);
    vm.startPrank(creator);

    world.addLiquidity(EResource.Iron, EResource.Copper, 1000, 1000);
    world.addLiquidity(EResource.Copper, EResource.Lithium, 1000, 1000);
    assertEq(Reserves.getAmountA(Iron, Copper), 1000);
    assertEq(Reserves.getAmountB(Iron, Copper), 1000);
  }

  function testAddLiquidityFailNotAdmin() public {
    vm.startPrank(alice);
    vm.expectRevert("[Primodium] Only admin");
    world.addLiquidity(EResource.Iron, EResource.Copper, 1000, 1000);
  }

  function testRemoveLiquidity() public {
    vm.startPrank(creator);
    world.addLiquidity(EResource.Iron, EResource.Copper, 1000, 1000);
    world.removeLiquidity(EResource.Iron, EResource.Copper, 1000, 1000);
    assertEq(Reserves.getAmountA(Iron, Copper), 0);
    assertEq(Reserves.getAmountB(Iron, Copper), 0);
  }

  function testRemoveLiquidityFailNotAdmin() public {
    vm.startPrank(alice);
    vm.expectRevert("[Primodium] Only admin");
    world.removeLiquidity(EResource.Iron, EResource.Copper, 1000, 1000);
  }
}
