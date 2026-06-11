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

  it.each([
    ['X', 0],
    ['f', 0],
    ["F R+ U'", 3],
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
});
