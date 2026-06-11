import createClient from 'openapi-fetch';

import type { components, paths } from './schema';
import { ApiError, type CubeState } from './types';

type ProblemDetails = components['schemas']['ProblemDetails'];

/**
 * The HTTP client is generated from the server's OpenAPI document: every path,
 * parameter, body and response below is checked against the real contract at
 * compile time (see `npm run generate:api`). The fetch wrapper is late-bound so
 * the active `globalThis.fetch` is used on every call.
 */
const client = createClient<paths>({
  baseUrl: window.location.origin,
  fetch: (input) => globalThis.fetch(input),
});

function unwrap<T>(result: { data?: T; error?: ProblemDetails; response: Response }): T {
  if (result.error || !result.response.ok) {
    throw new ApiError(
      result.response.status,
      result.error?.title ?? result.response.statusText,
      result.error?.detail ?? '',
    );
  }

  return result.data as T;
}

/** Creates a new solved cube of the given size. */
export async function createCube(size: number): Promise<CubeState> {
  return unwrap(await client.POST('/api/cubes', { body: { size } }));
}

/** Applies moves in Singmaster notation, e.g. `"F R' U2"`. */
export async function applyMoves(id: string, moves: string): Promise<CubeState> {
  return unwrap(
    await client.POST('/api/cubes/{id}/moves', {
      params: { path: { id } },
      body: { moves },
    }),
  );
}

/** Undoes the most recently applied move. */
export async function undoMove(id: string): Promise<CubeState> {
  return unwrap(await client.POST('/api/cubes/{id}/undo', { params: { path: { id } } }));
}

/** Restores the cube to its solved state and clears the history. */
export async function resetCube(id: string): Promise<CubeState> {
  return unwrap(await client.POST('/api/cubes/{id}/reset', { params: { path: { id } } }));
}

/** Applies a random scramble. */
export async function scrambleCube(id: string, length?: number): Promise<CubeState> {
  return unwrap(
    await client.POST('/api/cubes/{id}/scramble', {
      params: { path: { id } },
      body: { length },
    }),
  );
}

/** Deletes a session that is no longer needed. */
export async function deleteCube(id: string): Promise<void> {
  unwrap(await client.DELETE('/api/cubes/{id}', { params: { path: { id } } }));
}
