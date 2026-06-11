import type { FaceName } from '../api/types';

/** How far, and which way, a face is rotated — as seen looking at that face. */
export type TurnDirection = 'clockwise' | 'counterClockwise' | 'half';

/** A single face rotation. */
export interface Move {
  face: FaceName;
  direction: TurnDirection;
}

const FACE_BY_LETTER: Record<string, FaceName> = {
  U: 'up',
  D: 'down',
  F: 'front',
  B: 'back',
  L: 'left',
  R: 'right',
};

const LETTER_BY_FACE: Record<FaceName, string> = {
  up: 'U',
  down: 'D',
  front: 'F',
  back: 'B',
  left: 'L',
  right: 'R',
};

/** The outcome of parsing a notation string. */
export type ParseResult =
  | { ok: true; moves: Move[] }
  | { ok: false; position: number; message: string };

/**
 * Parses Singmaster notation (`F`, `R'`, `U2`, separated by whitespace or compact).
 * Mirrors the server-side parser so input can be validated before it is sent.
 */
export function parseNotation(notation: string): ParseResult {
  const moves: Move[] = [];
  let position = 0;

  while (position < notation.length) {
    const letter = notation[position];

    if (/\s/.test(letter)) {
      position += 1;
      continue;
    }

    const face = FACE_BY_LETTER[letter];
    if (!face) {
      return {
        ok: false,
        position,
        message: `Unexpected '${letter}' at position ${position + 1} — expected U, D, F, B, L or R.`,
      };
    }

    position += 1;
    let direction: TurnDirection = 'clockwise';
    if (notation[position] === "'") {
      direction = 'counterClockwise';
      position += 1;
    } else if (notation[position] === '2') {
      direction = 'half';
      position += 1;
    }

    moves.push({ face, direction });
  }

  return { ok: true, moves };
}

/** Formats a move in Singmaster notation, e.g. `F`, `R'` or `U2`. */
export function formatMove(move: Move): string {
  const modifier =
    move.direction === 'counterClockwise' ? "'" : move.direction === 'half' ? '2' : '';
  return LETTER_BY_FACE[move.face] + modifier;
}

/** Returns the move that undoes the given one. */
export function inverseOf(move: Move): Move {
  if (move.direction === 'clockwise') {
    return { ...move, direction: 'counterClockwise' };
  }
  if (move.direction === 'counterClockwise') {
    return { ...move, direction: 'clockwise' };
  }
  return move;
}

/** The verification sequence from the task description. */
export const TASK_SEQUENCE = "F R' U B' L D'";
