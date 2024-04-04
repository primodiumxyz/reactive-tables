import { Coord, uuid } from "@latticexyz/utils";
import { GameObjectComponent } from "engine/types";

function getRelativeCoord(gameObject: Phaser.GameObjects.Graphics, coord: Coord) {
  return {
    x: coord.x - gameObject.x,
    y: coord.y - gameObject.y,
  };
}

function drawLine(
  gameObject: Phaser.GameObjects.Graphics,
  start: Coord,
  end: Coord,
  color: number,
  alpha: number,
  thickness: number
) {
  const startPos = getRelativeCoord(gameObject, start);
  const endPos = getRelativeCoord(gameObject, end);

  gameObject.lineStyle(thickness, color, alpha);
  gameObject.beginPath();
  gameObject.moveTo(startPos.x, startPos.y);
  gameObject.lineTo(endPos.x, endPos.y);
  gameObject.closePath();
  gameObject.strokePath();
}

function drawCircle(
  gameObject: Phaser.GameObjects.Graphics,
  options: {
    position: Coord;
    radius: number;
    color: number | undefined;
    strokeColor: number | undefined;
    alpha: number;
    borderAlpha?: number;
    borderThickness: number;
  }
) {
  const fillColor = options.color;
  const borderColor = options.strokeColor ?? options.color;
  const pos = getRelativeCoord(gameObject, options.position);

  fillColor && gameObject.fillStyle(fillColor, options.alpha);
  borderColor && gameObject.lineStyle(options.borderThickness, borderColor, options.borderAlpha);
  gameObject.strokeCircle(pos.x, pos.y, options.radius);
  gameObject.fillCircle(pos.x, pos.y, options.radius);
}

function calculateTrianglePoints(width: number, height: number, directionDegrees: number, centroid: Coord) {
  const directionRadians = (directionDegrees * Math.PI) / 180;

  // Calculate the height of the equilateral triangle that forms two halves of the given triangle
  const equilateralHeight = Math.sqrt(height * height + (width / 2) * (width / 2));

  // Calculate the centroid offsets for an equilateral triangle
  const centroidOffsetX = (equilateralHeight / 3) * Math.sin(directionRadians);
  const centroidOffsetY = (equilateralHeight / 3) * Math.cos(directionRadians);

  // Adjust the origin based on the centroid position and the calculated offsets
  const origin = {
    x: centroid.x - centroidOffsetX,
    y: centroid.y - centroidOffsetY,
  };

  // Calculate the three points of the triangle using the adjusted origin
  const baseMidpoint = {
    x: origin.x + height * Math.sin(directionRadians),
    y: origin.y + height * Math.cos(directionRadians),
  };

  const deltaX = (width / 2) * Math.cos(directionRadians);
  const deltaY = (width / 2) * Math.sin(directionRadians);

  const pointA = { x: baseMidpoint.x - deltaX, y: baseMidpoint.y + deltaY };
  const pointB = { x: baseMidpoint.x + deltaX, y: baseMidpoint.y - deltaY };
  const pointC = { x: origin.x, y: origin.y };

  return { a: pointA, b: pointB, c: pointC };
}

function drawTriangle(
  gameObject: Phaser.GameObjects.Graphics,
  {
    position,
    width,
    height,
    directionDegrees = 0,
    color,
    alpha,
    borderThickness,
  }: {
    position: Coord;
    width: number;
    height: number;
    directionDegrees?: number;
    color: number;
    alpha: number;
    borderThickness: number;
  }
) {
  gameObject.fillStyle(color, alpha);
  gameObject.lineStyle(borderThickness, color);
  // this should take in 3 points
  const pos = getRelativeCoord(gameObject, position);

  const pts = calculateTrianglePoints(width, height, directionDegrees, pos);

  gameObject.fillStyle(color, alpha);
  gameObject.lineStyle(borderThickness, color);
  gameObject.strokeTriangle(pts.a.x, pts.a.y, pts.b.x, pts.b.y, pts.c.x, pts.c.y);
  gameObject.fillTriangle(pts.a.x, pts.a.y, pts.b.x, pts.b.y, pts.c.x, pts.c.y);
}

function drawSquare(
  gameObject: Phaser.GameObjects.Graphics,
  position: Coord,
  width: number,
  height: number,
  color: number,
  alpha: number,
  borderThickness: number,
  rotate: number,
  center?: boolean
) {
  const pos = getRelativeCoord(gameObject, position);

  gameObject.fillStyle(color, alpha);
  gameObject.lineStyle(borderThickness, color);
  if (center === true) {
    pos.x = pos.x - width / 2;
    pos.y = pos.y - height / 2;
  }
  gameObject.strokeRect(pos.x, pos.y, width, height);
  gameObject.fillRect(pos.x, pos.y, width, height);
  gameObject.setAngle(rotate);
}

export const Line = (
  end: Coord,
  options: {
    id?: string;
    color?: number;
    alpha?: number;
    thickness?: number;
  } = {}
): GameObjectComponent<"Graphics"> => {
  const { id, color = 0xffffff, alpha = 0.3, thickness = 1 } = options;

  return {
    id: id ?? `line_${uuid()}`,
    once: (gameObject) => {
      drawLine(gameObject, { x: gameObject.x, y: gameObject.y }, end, color, alpha, thickness);
    },
  };
};

export const Square = (
  width: number,
  height: number,
  options: {
    position?: Coord;
    id?: string;
    color?: number;
    alpha?: number;
    borderThickness?: number;
    center?: boolean;
    rotate?: number;
  } = {}
): GameObjectComponent<"Graphics"> => {
  const { position, id, color = 0xffffff, alpha = 0.3, borderThickness = 1 } = options;

  return {
    id: id ?? `square_${uuid()}`,
    once: (gameObject) => {
      drawSquare(
        gameObject,
        position ?? { x: gameObject.x, y: gameObject.y },
        width,
        height,
        color,
        alpha,
        borderThickness,
        options.rotate ?? 0,
        options.center
      );
    },
  };
};

export const Circle = (
  radius: number,
  options: {
    position?: Coord;
    id?: string;
    color?: number;
    borderColor?: number;
    alpha?: number;
    borderThickness?: number;
    borderAlpha?: number;
  } = {}
): GameObjectComponent<"Graphics"> => {
  const { position, id, color, borderColor, alpha = 0.3, borderThickness = 1 } = options;

  return {
    id: id ?? `circle_${uuid()}`,
    once: (gameObject) => {
      drawCircle(gameObject, {
        strokeColor: borderColor,
        position: position ?? { x: gameObject.x, y: gameObject.y },
        radius,
        color,
        alpha,
        borderThickness,
        borderAlpha: options.borderAlpha,
      });
    },
  };
};

export const Triangle = (
  width: number,
  height: number,
  options: {
    position?: Coord;
    direction?: number;
    id?: string;
    color?: number;
    alpha?: number;
    borderThickness?: number;
  } = {}
): GameObjectComponent<"Graphics"> => {
  const { position, id, color = 0xffffff, alpha = 0.3, borderThickness = 1, direction = 0 } = options;

  return {
    id: id ?? `triangle_${uuid()}`,
    once: (gameObject) => {
      drawTriangle(gameObject, {
        position: position ?? { x: gameObject.x, y: gameObject.y },
        width,
        height,
        directionDegrees: direction,
        color,
        alpha,
        borderThickness,
      });
    },
  };
};

export const Shield = (
  width: number,
  height: number,
  options: {
    position?: Coord;
    id?: string;
    color?: number;
    alpha?: number;
    borderThickness?: number;
    center?: boolean;
  } = {}
): GameObjectComponent<"Graphics"> => {
  const { position, id, color = 0xffffff, alpha = 0.3, borderThickness = 1 } = options;

  return {
    id: id ?? `shield_${uuid()}`,
    once: (gameObject) => {
      drawShield(
        gameObject,
        position ?? { x: gameObject.x, y: gameObject.y },
        width,
        height,
        color,
        alpha,
        borderThickness,
        options.center
      );
    },
  };
};

function drawShield(
  gameObject: Phaser.GameObjects.Graphics,
  position: Coord,
  width: number,
  height: number,
  color: number,
  alpha: number,
  borderThickness: number,
  center?: boolean
) {
  gameObject.fillStyle(color, alpha);
  gameObject.lineStyle(borderThickness, color);
  // Calculate the center position if needed
  const pos = getRelativeCoord(gameObject, position);
  let centerX = pos.x;
  let centerY = pos.y;
  if (center) {
    centerX -= width / 2;
    centerY -= height / 2;
  }
  // Start drawing the shield shape
  gameObject.beginPath();

  // Top arc (half-circle)
  gameObject.arc(centerX + width / 2, centerY + height * 0.3, width / 2, Math.PI, 0, false);

  // Right side down to the bottom point
  gameObject.lineTo(centerX + width, centerY + height);

  // Bottom line back to the left bottom point
  gameObject.lineTo(centerX, centerY + height);

  // Close path back to the start point of the top arc
  gameObject.closePath();

  // Apply styles
  gameObject.strokePath();
  gameObject.fillPath();
}
