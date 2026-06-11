/** The six face names used by the API. */
export type FaceName = 'up' | 'down' | 'front' | 'back' | 'left' | 'right';

/** All face names in a stable order. */
export const FACE_NAMES: readonly FaceName[] = ['up', 'down', 'front', 'back', 'left', 'right'];

/** A single sticker colour, as the letter codes used by the API: W Y G B R O. */
export type ColorLetter = 'W' | 'Y' | 'G' | 'B' | 'R' | 'O';

/**
 * The API's representation of a cube session — mirrors `CubeStateDto` on the server.
 * Each face is a list of rows (top to bottom) of colour letters (left to right).
 */
export interface CubeState {
  id: string;
  size: number;
  isSolved: boolean;
  faces: Record<FaceName, string[]>;
  history: string[];
}

/** An error returned by the API as an RFC 9457 problem-details body. */
export class ApiError extends Error {
  readonly status: number;
  readonly title: string;

  constructor(status: number, title: string, detail: string) {
    super(detail || title);
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
  }
}
