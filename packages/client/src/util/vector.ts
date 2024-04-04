import { Coord } from "@latticexyz/utils";

export const deg2rad = (degrees: number) => degrees * (Math.PI / 180);

export function getPositionByVector(distance: number, direction: number, origin: Coord = { x: 0, y: 0 }) {
  direction = direction % 360;
  const flip = direction >= 180;
  direction = direction % 180;

  const newX = solCosDegrees(direction) * BigInt(distance);
  const newY = solSinDegrees(direction) * BigInt(distance);

  const x = Number(newX / TENe18);
  const y = Number(newY / TENe18);
  return {
    x: (flip ? -x : x) + origin.x,
    y: (flip ? -y : y) + origin.y,
  };
}

export function getAngleBetweenPoints(p1: Coord, p2: Coord) {
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  return (angle * 180) / Math.PI;
}

const TENe18 = BigInt("1000000000000000000");
const TENe13 = BigInt("10000000000000");
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const INDEX_WIDTH = BigInt(8);
const INTERP_WIDTH = BigInt(16);
const INDEX_OFFSET = BigInt(28) - INDEX_WIDTH;
const INTERP_OFFSET: bigint = INDEX_OFFSET - INTERP_WIDTH;
const ANGLES_IN_CYCLE = BigInt(1073741824);
const QUADRANT_HIGH_MASK = BigInt(536870912);
const QUADRANT_LOW_MASK = BigInt(268435456);
const SINE_TABLE_SIZE = BigInt(256);
const PI = BigInt("3141592653589793238");
export const TWO_PI = TWO * PI;
const PI_OVER_TWO: bigint = PI / TWO;

// in radians
export function solSinDegrees(_angle: number): bigint {
  const angle = BigInt(Math.round(_angle) % 360);
  const angleDegsTimes10000 = angle * BigInt(1745);

  const angleRads = angleDegsTimes10000 * TENe13 + TWO_PI;

  const value = solSin(angleRads);
  return value;
}
export function solCosDegrees(_angle: number) {
  const angle = BigInt(Math.round(_angle) % 360);
  const angleDegsTimes10000 = angle * BigInt(1745);

  const angleRads = angleDegsTimes10000 * TENe13 + TWO_PI;

  const value = solCos(angleRads);
  return value;
}

export function solSin(angle: bigint): bigint {
  angle = (ANGLES_IN_CYCLE * (angle % TWO_PI)) / TWO_PI;

  const interp = (angle >> INTERP_OFFSET) & ((ONE << INTERP_WIDTH) - ONE);
  let index = (angle >> INDEX_OFFSET) & ((ONE << INDEX_WIDTH) - ONE);
  const isOddQuadrant = (angle & QUADRANT_LOW_MASK) == ZERO;
  const isNegativeQuadrant = (angle & QUADRANT_HIGH_MASK) != ZERO;
  if (!isOddQuadrant) {
    index = SINE_TABLE_SIZE - index - ONE;
  }
  const x1 = BigInt(sin_table[Number(index)]);
  const x2 = BigInt(sin_table[Number(index) + 1]);
  const approximation = ((x2 - x1) * interp) >> INTERP_WIDTH;
  let sine = isOddQuadrant ? x1 + approximation : x2 - approximation;
  if (isNegativeQuadrant) sine = -sine;

  return (sine * TENe18) / BigInt(2147483647);
}

export function solCos(_angle: bigint) {
  return solSin(_angle + PI_OVER_TWO);
}
const sin_table = [
  0x00000000, 0x00c90f88, 0x01921d20, 0x025b26d7, 0x03242abf, 0x03ed26e6, 0x04b6195d, 0x057f0035, 0x0647d97c,
  0x0710a345, 0x07d95b9e, 0x08a2009a, 0x096a9049, 0x0a3308bc, 0x0afb6805, 0x0bc3ac35, 0x0c8bd35e, 0x0d53db92,
  0x0e1bc2e4, 0x0ee38766, 0x0fab272b, 0x1072a048, 0x1139f0cf, 0x120116d5, 0x12c8106e, 0x138edbb1, 0x145576b1,
  0x151bdf85, 0x15e21444, 0x16a81305, 0x176dd9de, 0x183366e8, 0x18f8b83c, 0x19bdcbf3, 0x1a82a025, 0x1b4732ef,
  0x1c0b826a, 0x1ccf8cb3, 0x1d934fe5, 0x1e56ca1e, 0x1f19f97b, 0x1fdcdc1b, 0x209f701c, 0x2161b39f, 0x2223a4c5,
  0x22e541af, 0x23a6887e, 0x24677757, 0x25280c5d, 0x25e845b6, 0x26a82185, 0x27679df4, 0x2826b928, 0x28e5714a,
  0x29a3c485, 0x2a61b101, 0x2b1f34eb, 0x2bdc4e6f, 0x2c98fbba, 0x2d553afb, 0x2e110a62, 0x2ecc681e, 0x2f875262,
  0x3041c760, 0x30fbc54d, 0x31b54a5d, 0x326e54c7, 0x3326e2c2, 0x33def287, 0x3496824f, 0x354d9056, 0x36041ad9,
  0x36ba2013, 0x376f9e46, 0x382493b0, 0x38d8fe93, 0x398cdd32, 0x3a402dd1, 0x3af2eeb7, 0x3ba51e29, 0x3c56ba70,
  0x3d07c1d5, 0x3db832a5, 0x3e680b2c, 0x3f1749b7, 0x3fc5ec97, 0x4073f21d, 0x4121589a, 0x41ce1e64, 0x427a41d0,
  0x4325c135, 0x43d09aec, 0x447acd50, 0x452456bc, 0x45cd358f, 0x46756827, 0x471cece6, 0x47c3c22e, 0x4869e664,
  0x490f57ee, 0x49b41533, 0x4a581c9d, 0x4afb6c97, 0x4b9e038f, 0x4c3fdff3, 0x4ce10034, 0x4d8162c3, 0x4e210617,
  0x4ebfe8a4, 0x4f5e08e2, 0x4ffb654c, 0x5097fc5e, 0x5133cc94, 0x51ced46e, 0x5269126e, 0x53028517, 0x539b2aef,
  0x5433027d, 0x54ca0a4a, 0x556040e2, 0x55f5a4d2, 0x568a34a9, 0x571deef9, 0x57b0d255, 0x5842dd54, 0x58d40e8c,
  0x59646497, 0x59f3de12, 0x5a827999, 0x5b1035ce, 0x5b9d1153, 0x5c290acc, 0x5cb420df, 0x5d3e5236, 0x5dc79d7b,
  0x5e50015d, 0x5ed77c89, 0x5f5e0db2, 0x5fe3b38d, 0x60686cce, 0x60ec382f, 0x616f146b, 0x61f1003e, 0x6271fa68,
  0x62f201ac, 0x637114cc, 0x63ef328f, 0x646c59bf, 0x64e88925, 0x6563bf91, 0x65ddfbd2, 0x66573cbb, 0x66cf811f,
  0x6746c7d7, 0x67bd0fbc, 0x683257aa, 0x68a69e80, 0x6919e31f, 0x698c246b, 0x69fd614a, 0x6a6d98a3, 0x6adcc964,
  0x6b4af278, 0x6bb812d0, 0x6c24295f, 0x6c8f351b, 0x6cf934fb, 0x6d6227f9, 0x6dca0d14, 0x6e30e349, 0x6e96a99c,
  0x6efb5f11, 0x6f5f02b1, 0x6fc19384, 0x70231099, 0x708378fe, 0x70e2cbc5, 0x71410804, 0x719e2cd1, 0x71fa3948,
  0x72552c84, 0x72af05a6, 0x7307c3cf, 0x735f6625, 0x73b5ebd0, 0x740b53fa, 0x745f9dd0, 0x74b2c883, 0x7504d344,
  0x7555bd4b, 0x75a585ce, 0x75f42c0a, 0x7641af3c, 0x768e0ea5, 0x76d94988, 0x77235f2c, 0x776c4eda, 0x77b417df,
  0x77fab988, 0x78403328, 0x78848413, 0x78c7aba1, 0x7909a92c, 0x794a7c11, 0x798a23b0, 0x79c89f6d, 0x7a05eeac,
  0x7a4210d8, 0x7a7d055a, 0x7ab6cba3, 0x7aef6323, 0x7b26cb4e, 0x7b5d039d, 0x7b920b88, 0x7bc5e28f, 0x7bf8882f,
  0x7c29fbed, 0x7c5a3d4f, 0x7c894bdd, 0x7cb72723, 0x7ce3ceb1, 0x7d0f4217, 0x7d3980eb, 0x7d628ac5, 0x7d8a5f3f,
  0x7db0fdf7, 0x7dd6668e, 0x7dfa98a7, 0x7e1d93e9, 0x7e3f57fe, 0x7e5fe492, 0x7e7f3956, 0x7e9d55fb, 0x7eba3a38,
  0x7ed5e5c5, 0x7ef0585f, 0x7f0991c3, 0x7f2191b3, 0x7f3857f5, 0x7f4de450, 0x7f62368e, 0x7f754e7f, 0x7f872bf2,
  0x7f97cebc, 0x7fa736b3, 0x7fb563b2, 0x7fc25595, 0x7fce0c3d, 0x7fd8878d, 0x7fe1c76a, 0x7fe9cbbf, 0x7ff09477,
  0x7ff62181, 0x7ffa72d0, 0x7ffd8859, 0x7fff6215, 0x7fffffff,
];
