// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "codegen/common.sol";
import { PositionData } from "codegen/index.sol";

struct Bounds {
  int32 minX;
  int32 minY;
  int32 maxX;
  int32 maxY;
}
