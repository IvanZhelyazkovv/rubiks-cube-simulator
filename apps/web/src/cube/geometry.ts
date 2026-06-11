import type { CubeState, FaceName } from '../api/types';
import type { Move, TurnDirection } from './notation';

type Vec3 = readonly [number, number, number];

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function negate(a: Vec3): Vec3 {
  return [-a[0], -a[1], -a[2]];
}

/**
 * Each face's outward normal and the directions in which its grid rows and
 * columns grow — the same orientation convention as the server, expressed in
 * scene axes (x → right face, y → up face, z → front face / viewer).
 */
const FACE_BASES: Record<FaceName, { normal: Vec3; rowDir: Vec3; colDir: Vec3 }> = {
  up: { normal: [0, 1, 0], rowDir: [0, 0, 1], colDir: [1, 0, 0] },
  down: { normal: [0, -1, 0], rowDir: [0, 0, -1], colDir: [1, 0, 0] },
  front: { normal: [0, 0, 1], rowDir: [0, -1, 0], colDir: [1, 0, 0] },
  back: { normal: [0, 0, -1], rowDir: [0, -1, 0], colDir: [-1, 0, 0] },
  left: { normal: [-1, 0, 0], rowDir: [0, -1, 0], colDir: [0, 0, 1] },
  right: { normal: [1, 0, 0], rowDir: [0, -1, 0], colDir: [0, 0, -1] },
};

/** Returns the outward normal of a face in scene axes. */
export function faceNormal(face: FaceName): Vec3 {
  return FACE_BASES[face].normal;
}

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
  const normal = FACE_BASES[move.face].normal;
  const axisIndex = normal.findIndex((component) => component !== 0);

  // Layer k counts inwards from the face: grid coordinate m − (k − 1) when the
  // face sits at the positive end of its axis, k − 1 at the negative end.
  const layer = move.layer ?? 1;
  const layerCoordinate = normal[axisIndex] > 0 ? m - (layer - 1) : layer - 1;

  // Clockwise as seen from outside the face is a negative (right-handed)
  // rotation around its outward axis — the same convention as the server.
  const angle =
    move.direction === 'clockwise'
      ? -Math.PI / 2
      : move.direction === 'counterClockwise'
        ? Math.PI / 2
        : -Math.PI;

  return {
    axis: [...normal] as [number, number, number],
    angle,
    affects: (grid) => grid[axisIndex] === layerCoordinate,
  };
}

/** Maps grid coordinates to the cubelet's centre position in scene units. */
export function scenePosition(
  grid: [number, number, number],
  size: number,
): [number, number, number] {
  const offset = (size - 1) / 2;
  return [grid[0] - offset, grid[1] - offset, grid[2] - offset];
}

/** The face whose outward normal points along the given signed axis. */
function faceAlong(axisIndex: number, sign: 1 | -1): FaceName {
  return (Object.keys(FACE_BASES) as FaceName[]).find(
    (candidate) => FACE_BASES[candidate].normal[axisIndex] === sign,
  )!;
}

/**
 * Resolves a drag gesture on a sticker into the layer turn it asks for.
 *
 * Dragging along the grabbed face moves the row or column slice the sticker
 * belongs to: outer layers turn as face moves, inner ones as slice moves
 * (`2L` — the M slice of a 3×3 — when the centre column is dragged). The
 * slice is named after its nearest face; a dead-centre slice ties to the
 * conventional M/E/S reference faces (left, down, front).
 *
 * The turn's direction follows from physics: a clockwise turn about face `f`
 * (seen from outside) moves a sticker at position `p` with velocity
 * `(−n_f) × p`. Whichever sign of the turn moves the sticker along the drag is
 * the turn the user asked for.
 *
 * @param face The face of the grabbed sticker.
 * @param grid The grabbed cubelet's grid coordinates.
 * @param drag The drag vector in scene axes (any magnitude; only direction matters).
 * @param size The cube size.
 * @returns The requested move, or null when the drag does not map to a turn.
 */
export function resolveDragMove(
  face: FaceName,
  grid: [number, number, number],
  drag: Vec3,
  size: number,
): Move | null {
  const { rowDir, colDir } = FACE_BASES[face];
  const m = size - 1;

  const alongRow = dot(drag, rowDir);
  const alongColumn = dot(drag, colDir);
  if (alongRow === 0 && alongColumn === 0) {
    return null;
  }

  // Dragging along the columns turns the sticker's row slice (which lies
  // along the row axis), and vice versa.
  const sliceAxis = Math.abs(alongColumn) >= Math.abs(alongRow) ? rowDir : colDir;
  const axisIndex = sliceAxis.findIndex((component) => component !== 0);
  const coordinate = grid[axisIndex];

  // Name the slice after its nearest face; the z axis breaks dead-centre ties
  // towards the positive face so the conventions match M (left), E (down)
  // and S (front).
  const fromPositive = m - coordinate;
  const fromNegative = coordinate;
  const usePositiveFace =
    fromPositive < fromNegative || (fromPositive === fromNegative && axisIndex === 2);
  const moveFace = faceAlong(axisIndex, usePositiveFace ? 1 : -1);
  const layer = (usePositiveFace ? fromPositive : fromNegative) + 1;

  const position = scenePosition(grid, size);
  const clockwiseVelocity = cross(negate(FACE_BASES[moveFace].normal), position);
  const alignment = dot(drag, clockwiseVelocity);
  if (alignment === 0) {
    return null;
  }

  const direction: TurnDirection = alignment > 0 ? 'clockwise' : 'counterClockwise';
  return layer > 1 ? { face: moveFace, direction, layer } : { face: moveFace, direction };
}
