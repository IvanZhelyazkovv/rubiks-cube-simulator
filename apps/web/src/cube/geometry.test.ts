import { describe, expect, it } from 'vitest';

import type { CubeState, FaceName } from '../api/types';
import { buildCubelets, resolveDragMove, rotationFor, scenePosition } from './geometry';

/** A solved 3×3 in the API's shape: green front, red right, white up. */
function solvedFaces(): Pick<CubeState, 'faces' | 'size'> {
  const face = (letter: string) => [letter.repeat(3), letter.repeat(3), letter.repeat(3)];
  return {
    size: 3,
    faces: {
      up: face('W'),
      down: face('Y'),
      front: face('G'),
      back: face('B'),
      left: face('O'),
      right: face('R'),
    },
  };
}

describe('buildCubelets', () => {
  it('produces 26 visible cubelets for a 3x3 (the hidden core is skipped)', () => {
    expect(buildCubelets(solvedFaces())).toHaveLength(26);
  });

  it('gives corner cubelets three stickers, edges two and centers one', () => {
    const counts = buildCubelets(solvedFaces())
      .map((cubelet) => Object.keys(cubelet.stickers).length)
      .reduce<Record<number, number>>((acc, count) => {
        acc[count] = (acc[count] ?? 0) + 1;
        return acc;
      }, {});

    expect(counts).toEqual({ 3: 8, 2: 12, 1: 6 });
  });

  it('maps every face of a solved cube to its scheme colour', () => {
    const expectations: Record<FaceName, string> = {
      up: 'W',
      down: 'Y',
      front: 'G',
      back: 'B',
      left: 'O',
      right: 'R',
    };

    for (const cubelet of buildCubelets(solvedFaces())) {
      for (const [face, letter] of Object.entries(cubelet.stickers)) {
        expect(letter).toBe(expectations[face as FaceName]);
      }
    }
  });

  it('reads asymmetric states with the correct orientation per face', () => {
    // Mark single corner stickers and check they land on the right cubelets.
    const state = solvedFaces();
    state.faces.front = ['GGG', 'GGG', 'RGG']; // bottom-left of front marked
    state.faces.up = ['WWB', 'WWW', 'WWW']; // top-right of up marked

    const cubelets = buildCubelets(state);
    const at = (x: number, y: number, z: number) =>
      cubelets.find((cubelet) => cubelet.key === `${x},${y},${z}`)!;

    // Front face, row 2 (bottom), column 0 (left) → cubelet x=0, y=0, z=2.
    expect(at(0, 0, 2).stickers.front).toBe('R');
    // Up face, row 0 (back), column 2 (right) → cubelet x=2, y=2, z=0.
    expect(at(2, 2, 0).stickers.up).toBe('B');
  });
});

describe('rotationFor', () => {
  it.each([
    ['front', [0, 0, 1]],
    ['back', [0, 0, -1]],
    ['up', [0, 1, 0]],
    ['down', [0, -1, 0]],
    ['left', [-1, 0, 0]],
    ['right', [1, 0, 0]],
  ] as const)('rotates %s around its outward axis', (face, axis) => {
    const rotation = rotationFor({ face, direction: 'clockwise' }, 3);

    expect(rotation.axis).toEqual(axis);
    expect(rotation.angle).toBeCloseTo(-Math.PI / 2);
  });

  it('selects only the turning layer', () => {
    const rotation = rotationFor({ face: 'front', direction: 'clockwise' }, 3);

    expect(rotation.affects([0, 0, 2])).toBe(true);
    expect(rotation.affects([1, 2, 2])).toBe(true);
    expect(rotation.affects([1, 1, 1])).toBe(false);
    expect(rotation.affects([0, 0, 0])).toBe(false);
  });

  it('maps directions to signed angles', () => {
    const cw = rotationFor({ face: 'up', direction: 'clockwise' }, 3);
    const ccw = rotationFor({ face: 'up', direction: 'counterClockwise' }, 3);
    const half = rotationFor({ face: 'up', direction: 'half' }, 3);

    expect(cw.angle).toBeCloseTo(-Math.PI / 2);
    expect(ccw.angle).toBeCloseTo(Math.PI / 2);
    expect(half.angle).toBeCloseTo(-Math.PI);
  });
});

describe('scenePosition', () => {
  it('centres the cube on the origin', () => {
    expect(scenePosition([0, 0, 0], 3)).toEqual([-1, -1, -1]);
    expect(scenePosition([1, 1, 1], 3)).toEqual([0, 0, 0]);
    expect(scenePosition([2, 2, 2], 3)).toEqual([1, 1, 1]);
    expect(scenePosition([0, 0, 0], 2)).toEqual([-0.5, -0.5, -0.5]);
  });
});

describe('resolveDragMove', () => {
  // Each expectation below was verified against a physical cube.

  it('dragging the front top-right sticker to the right turns the up face counter-clockwise', () => {
    // U moves the front's top row to the left, so rightwards is U'.
    expect(resolveDragMove('front', [2, 2, 2], [1, 0, 0], 3)).toEqual({
      face: 'up',
      direction: 'counterClockwise',
    });
  });

  it('dragging the front top-right sticker upwards turns the right face clockwise', () => {
    // R carries the front's right column up to the up face.
    expect(resolveDragMove('front', [2, 2, 2], [0, 1, 0], 3)).toEqual({
      face: 'right',
      direction: 'clockwise',
    });
  });

  it('dragging the up face left column towards the viewer turns the left face clockwise', () => {
    // L carries the up face's left column down to the front.
    expect(resolveDragMove('up', [0, 2, 0], [0, 0, 1], 3)).toEqual({
      face: 'left',
      direction: 'clockwise',
    });
  });

  it('dragging the front bottom row to the left turns the down face counter-clockwise', () => {
    // D (clockwise seen from below) carries the front's bottom row towards
    // the right face, so a drag to the left asks for D'.
    expect(resolveDragMove('front', [1, 0, 2], [-1, 0, 0], 3)).toEqual({
      face: 'down',
      direction: 'counterClockwise',
    });
  });

  it('returns null on middle slices, which have no face turn', () => {
    // The centre column of the front face lies on no outer layer vertically.
    expect(resolveDragMove('front', [1, 1, 2], [0, 1, 0], 3)).toBeNull();
    // The centre row, dragged horizontally, likewise.
    expect(resolveDragMove('front', [1, 1, 2], [1, 0, 0], 3)).toBeNull();
  });

  it('returns null when the drag has no in-plane component', () => {
    expect(resolveDragMove('front', [2, 2, 2], [0, 0, 1], 3)).toBeNull();
  });

  it('resolves inner-grid stickers on larger cubes only at the outer layers', () => {
    // On a 4×4 the second column from the left is an inner slice.
    expect(resolveDragMove('front', [1, 3, 3], [0, 1, 0], 4)).toBeNull();
    // The outermost column still turns the right face.
    expect(resolveDragMove('front', [3, 3, 3], [0, 1, 0], 4)).toEqual({
      face: 'right',
      direction: 'clockwise',
    });
  });
});
