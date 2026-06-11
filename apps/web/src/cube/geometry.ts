import type { CubeState, FaceName } from '../api/types';
import type { Move } from './notation';

/**
 * One small cube of the puzzle, addressed by integer grid coordinates:
 * x grows to the right, y grows upwards, z grows towards the viewer
 * (matching the server's coordinate system). `stickers` holds the colour
 * letter of each of its faces that lie on the puzzle's surface.
 */
export interface Cubelet {
  key: string;
  grid: [number, number, number];
  stickers: Partial<Record<FaceName, string>>;
}

/**
 * Derives the cubelets of the 3D view from the API's face grids. The face/row/column
 * conventions mirror the server's face orientations, so the 3D view and the exploded
 * view are two projections of the same state.
 */
export function buildCubelets(state: Pick<CubeState, 'faces' | 'size'>): Cubelet[] {
  const m = state.size - 1;
  const letterAt = (face: FaceName, row: number, column: number): string =>
    state.faces[face][row][column];

  const cubelets: Cubelet[] = [];

  for (let x = 0; x <= m; x++) {
    for (let y = 0; y <= m; y++) {
      for (let z = 0; z <= m; z++) {
        const stickers: Partial<Record<FaceName, string>> = {};

        if (y === m) stickers.up = letterAt('up', z, x);
        if (y === 0) stickers.down = letterAt('down', m - z, x);
        if (z === m) stickers.front = letterAt('front', m - y, x);
        if (z === 0) stickers.back = letterAt('back', m - y, m - x);
        if (x === 0) stickers.left = letterAt('left', m - y, z);
        if (x === m) stickers.right = letterAt('right', m - y, m - z);

        // Fully internal cubelets are never visible.
        if (Object.keys(stickers).length > 0) {
          cubelets.push({ key: `${x},${y},${z}`, grid: [x, y, z], stickers });
        }
      }
    }
  }

  return cubelets;
}

/** Description of the 3D rotation a move performs. */
export interface MoveRotation {
  /** The outward axis of the turning face. */
  axis: [number, number, number];
  /** The target angle in radians around `axis` (negative = clockwise seen from outside). */
  angle: number;
  /** Whether a cubelet at the given grid position belongs to the turning layer. */
  affects: (grid: [number, number, number]) => boolean;
}

/** Returns the axis, angle and layer of the 3D rotation performed by a move. */
export function rotationFor(move: Move, size: number): MoveRotation {
  const m = size - 1;

  const faceGeometry: Record<
    FaceName,
    { axis: [number, number, number]; inLayer: (g: [number, number, number]) => boolean }
  > = {
    up: { axis: [0, 1, 0], inLayer: ([, y]) => y === m },
    down: { axis: [0, -1, 0], inLayer: ([, y]) => y === 0 },
    front: { axis: [0, 0, 1], inLayer: ([, , z]) => z === m },
    back: { axis: [0, 0, -1], inLayer: ([, , z]) => z === 0 },
    left: { axis: [-1, 0, 0], inLayer: ([x]) => x === 0 },
    right: { axis: [1, 0, 0], inLayer: ([x]) => x === m },
  };

  const { axis, inLayer } = faceGeometry[move.face];

  // Clockwise as seen from outside the face is a negative (right-handed)
  // rotation around its outward axis — the same convention as the server.
  const angle =
    move.direction === 'clockwise'
      ? -Math.PI / 2
      : move.direction === 'counterClockwise'
        ? Math.PI / 2
        : -Math.PI;

  return { axis, angle, affects: inLayer };
}

/** Maps grid coordinates to the cubelet's centre position in scene units. */
export function scenePosition(
  grid: [number, number, number],
  size: number,
): [number, number, number] {
  const offset = (size - 1) / 2;
  return [grid[0] - offset, grid[1] - offset, grid[2] - offset];
}
