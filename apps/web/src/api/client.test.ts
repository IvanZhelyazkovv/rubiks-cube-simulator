import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from './client';
import { ApiError } from './types';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** The openapi-fetch client hands a fully-built Request to fetch. */
function sentRequest(fetchMock: ReturnType<typeof vi.fn>): Request {
  return fetchMock.mock.calls[0][0] as Request;
}

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a cube with the requested size', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'abc', size: 4 }));
    vi.stubGlobal('fetch', fetchMock);

    const cube = await client.createCube(4);

    const request = sentRequest(fetchMock);
    expect(new URL(request.url).pathname).toBe('/api/cubes');
    expect(request.method).toBe('POST');
    expect(await request.json()).toEqual({ size: 4 });
    expect(cube.size).toBe(4);
  });

  it('applies moves to the right session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'abc' }));
    vi.stubGlobal('fetch', fetchMock);

    await client.applyMoves('abc', "F R'");

    const request = sentRequest(fetchMock);
    expect(new URL(request.url).pathname).toBe('/api/cubes/abc/moves');
    expect(request.method).toBe('POST');
    expect(await request.json()).toEqual({ moves: "F R'" });
  });

  it.each([
    ['undoMove', '/api/cubes/abc/undo'],
    ['resetCube', '/api/cubes/abc/reset'],
  ] as const)('%s posts to %s', async (method, path) => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'abc' }));
    vi.stubGlobal('fetch', fetchMock);

    await client[method]('abc');

    const request = sentRequest(fetchMock);
    expect(new URL(request.url).pathname).toBe(path);
    expect(request.method).toBe('POST');
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

    const error = await client.applyMoves('abc', 'F').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(502);
  });

  it('deletes a session and tolerates the empty 204 response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await client.deleteCube('abc');

    const request = sentRequest(fetchMock);
    expect(new URL(request.url).pathname).toBe('/api/cubes/abc');
    expect(request.method).toBe('DELETE');
  });
});
