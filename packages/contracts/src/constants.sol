// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { EResource } from "codegen/common.sol";

uint256 constant UNIT_SPEED_SCALE = 100;
uint256 constant WORLD_SPEED_SCALE = 100;
uint256 constant MULTIPLIER_SCALE = 100;

address constant DUMMY_ADDRESS = 0x1234567890AbcdEF1234567890aBcdef12345678;
EResource constant RESERVE_CURRENCY_RESOURCE = EResource.Kimberlite;
uint8 constant RESERVE_CURRENCY = uint8(RESERVE_CURRENCY_RESOURCE);
