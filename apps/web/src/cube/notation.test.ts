import { describe, expect, it } from 'vitest';

import { formatMove, inverseOf, parseNotation, TASK_SEQUENCE } from './notation';

describe('parseNotation', () => {
  it('parses the task sequence', () => {
    const result = parseNotation(TASK_SEQUENCE);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.moves.map(formatMove)).toEqual(['F', "R'", 'U', "B'", 'L', "D'"]);
    }
  });

  it('parses compact notation without spaces', () => {
    const result = parseNotation("FR'U2");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.moves.map(formatMove)).toEqual(['F', "R'", 'U2']);
    }
  });

  it('treats blank input as an empty sequence', () => {
    const result = parseNotation('   ');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.moves).toEqual([]);
    }
  });

  it('parses layer-prefixed slice moves', () => {
    const result = parseNotation("2L 3R' 2F2");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.moves).toEqual([
        { face: 'left', direction: 'clockwise', layer: 2 },
        { face: 'right', direction: 'counterClockwise', layer: 3 },
        { face: 'front', direction: 'half', layer: 2 },
      ]);
      expect(result.moves.map(formatMove)).toEqual(['2L', "3R'", '2F2']);
    }
  });

  it.each([
    ['X', 0],
    ['f', 0],
    ["F R+ U'", 3],
    ['1R', 0], // layer 1 is the face itself, written without a prefix
    ['02L', 0], // leading zeroes are not a spelling anyone intends
    ['123R', 0],
    ['2', 0], // a layer prefix with no face letter
  ])('reports the position of invalid input %s', (notation, position) => {
    const result = parseNotation(notation);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.position).toBe(position);
    }
  });
});

describe('inverseOf', () => {
  it('flips quarter turns and keeps half turns', () => {
    expect(inverseOf({ face: 'front', direction: 'clockwise' }).direction).toBe('counterClockwise');
    expect(inverseOf({ face: 'front', direction: 'counterClockwise' }).direction).toBe('clockwise');
    expect(inverseOf({ face: 'front', direction: 'half' }).direction).toBe('half');
  });

  it('preserves the layer of slice moves', () => {
    expect(inverseOf({ face: 'left', direction: 'clockwise', layer: 2 })).toEqual({
      face: 'left',
      direction: 'counterClockwise',
      layer: 2,
    });
  });
});
