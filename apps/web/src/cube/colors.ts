import type { ColorLetter } from '../api/types';

/** The display colour of each sticker letter — the single source of cube colours. */
export const STICKER_COLORS: Record<ColorLetter, string> = {
  W: '#f3f4f6',
  Y: '#fbbf24',
  G: '#16a34a',
  B: '#2563eb',
  R: '#dc2626',
  O: '#f97316',
};

/** Human-readable colour names, e.g. for accessibility labels. */
export const COLOR_NAMES: Record<ColorLetter, string> = {
  W: 'white',
  Y: 'yellow',
  G: 'green',
  B: 'blue',
  R: 'red',
  O: 'orange',
};

/** Returns the display colour for a sticker letter. */
export function colorOf(letter: string): string {
  const color = STICKER_COLORS[letter as ColorLetter];
  if (!color) {
    throw new Error(`Unknown sticker letter '${letter}'.`);
  }
  return color;
}
