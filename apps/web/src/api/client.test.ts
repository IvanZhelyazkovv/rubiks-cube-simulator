import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from './client';
import { ApiError } from './types';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a cube with the requested size', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'abc', size: 4 }));
    vi.stubGlobal('fetch', fetchMock);

    const cube = await client.createCube(4);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/cubes',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ size: 4 }) }),
    );
    expect(cube.size).toBe(4);
  });

  it('applies moves to the right session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'abc' }));
    vi.stubGlobal('fetch', fetchMock);

    await client.applyMoves('abc', "F R'");

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/cubes/abc/moves',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ moves: "F R'" }) }),
    );
  });

  it.each([
    ['undoMove', '/api/cubes/abc/undo'],
    ['resetCube', '/api/cubes/abc/reset'],
  ] as const)('%s posts to %s', async (method, url) => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'abc' }));
    vi.stubGlobal('fetch', fetchMock);

    await client[method]('abc');

    expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ method: 'POST' }));
  });

  it('turns problem-details responses into ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ title: 'Invalid move notation', detail: "Bad token 'X'." }, 400),
        ),
    );

    const error = await client.applyMoves('abc', 'X').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).message).toBe("Bad token 'X'.");
  });

  it('survives error responses without a problem-details body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('oops', { status: 502, statusText: 'Bad Gateway' })),
    );

    const error = await client.getCube('abc').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).title).toBe('Bad Gateway');
  });
});
