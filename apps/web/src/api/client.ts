import { ApiError, type CubeState } from './types';

const BASE_URL = '/api/cubes';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    // The API responds with problem-details bodies; fall back gracefully when
    // something upstream (proxy, network) answers with a different shape.
    const problem = (await response.json().catch(() => ({}))) as {
      title?: string;
      detail?: string;
    };
    throw new ApiError(response.status, problem.title ?? response.statusText, problem.detail ?? '');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Creates a new solved cube of the given size. */
export function createCube(size: number): Promise<CubeState> {
  return request(BASE_URL, { method: 'POST', body: JSON.stringify({ size }) });
}

/** Reads the current state of a cube. */
export function getCube(id: string): Promise<CubeState> {
  return request(`${BASE_URL}/${id}`);
}

/** Applies moves in Singmaster notation, e.g. `"F R' U2"`. */
export function applyMoves(id: string, moves: string): Promise<CubeState> {
  return request(`${BASE_URL}/${id}/moves`, { method: 'POST', body: JSON.stringify({ moves }) });
}

/** Undoes the most recently applied move. */
export function undoMove(id: string): Promise<CubeState> {
  return request(`${BASE_URL}/${id}/undo`, { method: 'POST' });
}

/** Restores the cube to its solved state and clears the history. */
export function resetCube(id: string): Promise<CubeState> {
  return request(`${BASE_URL}/${id}/reset`, { method: 'POST' });
}

/** Applies a random scramble. */
export function scrambleCube(id: string, length?: number): Promise<CubeState> {
  return request(`${BASE_URL}/${id}/scramble`, {
    method: 'POST',
    body: JSON.stringify({ length }),
  });
}
