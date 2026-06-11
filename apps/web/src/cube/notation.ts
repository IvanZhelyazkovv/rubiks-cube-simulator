import type { FaceName } from '../api/types';

/** How far, and which way, a face is rotated — as seen looking at that face. */
export type TurnDirection = 'clockwise' | 'counterClockwise' | 'half';

/** A single layer rotation: a face turn, or a deeper slice when `layer` > 1. */
export interface Move {
  face: FaceName;
  direction: TurnDirection;
  /** The layer to turn, counted from `face`; 1 (the face itself) when omitted. */
  layer?: number;
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
 * Parses Singmaster notation (`F`, `R'`, `U2`, slice moves like `2L`, separated
 * by whitespace or compact). Mirrors the server-side parser so input can be
 * validated before it is sent.
 */
export function parseNotation(notation: string): ParseResult {
  const moves: Move[] = [];
  let position = 0;

  while (position < notation.length) {
    if (/\s/.test(notation[position])) {
      position += 1;
      continue;
    }

    let layer = 1;
    if (/[0-9]/.test(notation[position])) {
      const digitStart = position;
      while (position < notation.length && /[0-9]/.test(notation[position])) {
        position += 1;
      }

      // Layer 1 is the face itself and is written without a prefix; two
      // digits cover every supported cube size, and a leading zero is not
      // a spelling anyone intends.
      layer = Number(notation.slice(digitStart, position));
      if (position - digitStart > 2 || notation[digitStart] === '0' || layer < 2) {
        return {
          ok: false,
          position: digitStart,
          message: `Invalid layer at position ${digitStart + 1} — slice moves use 2 or higher, like 2L.`,
        };
      }
    }

    const letter = notation[position];
    const face = letter ? FACE_BY_LETTER[letter] : undefined;
    if (!face) {
      return {
        ok: false,
        position,
        message: `Unexpected '${letter ?? 'end of input'}' at position ${position + 1} — expected U, D, F, B, L or R.`,
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

    moves.push(layer > 1 ? { face, direction, layer } : { face, direction });
  }

  return { ok: true, moves };
}

/** Formats a move in Singmaster notation, e.g. `F`, `R'`, `U2` or `2L'`. */
export function formatMove(move: Move): string {
  const modifier =
    move.direction === 'counterClockwise' ? "'" : move.direction === 'half' ? '2' : '';
  const prefix = move.layer && move.layer > 1 ? String(move.layer) : '';
  return prefix + LETTER_BY_FACE[move.face] + modifier;
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
