import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CubeState } from '../api/types';

vi.mock('../api/client');

import * as client from '../api/client';
import { useCubeSession } from './useCubeSession';

function cubeState(overrides: Partial<CubeState> = {}): CubeState {
  return {
    id: 'session-1',
    size: 3,
    isSolved: true,
    faces: {
      up: ['WWW', 'WWW', 'WWW'],
      down: ['YYY', 'YYY', 'YYY'],
      front: ['GGG', 'GGG', 'GGG'],
      back: ['BBB', 'BBB', 'BBB'],
      left: ['OOO', 'OOO', 'OOO'],
      right: ['RRR', 'RRR', 'RRR'],
    },
    history: [],
    ...overrides,
  };
}

describe('useCubeSession', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(client.createCube).mockResolvedValue(cubeState());
    vi.mocked(client.deleteCube).mockResolvedValue(undefined);
  });

  it('creates a session on mount', async () => {
    const { result } = renderHook(() => useCubeSession());

    await waitFor(() => expect(result.current.state).not.toBeNull());
    expect(client.createCube).toHaveBeenCalledWith(3);
  });

  it('stays busy until the animation completes, then commits the server state', async () => {
    const afterMove = cubeState({ isSolved: false, history: ['F'] });
    vi.mocked(client.applyMoves).mockResolvedValue(afterMove);

    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.applySequence('F'));

    await waitFor(() => expect(result.current.animation).not.toBeNull());
    expect(result.current.busy).toBe(true);
    expect(result.current.animation?.move).toEqual({ face: 'front', direction: 'clockwise' });
    // The displayed state is still the pre-move state during the animation.
    expect(result.current.state?.history).toEqual([]);

    act(() => result.current.completeAnimation());

    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.state).toEqual(afterMove);
    expect(result.current.animation).toBeNull();
  });

  it('plays a multi-move sequence one animation at a time', async () => {
    const afterFirst = cubeState({ isSolved: false, history: ['F'] });
    const afterSecond = cubeState({ isSolved: false, history: ['F', "R'"] });
    vi.mocked(client.applyMoves)
      .mockResolvedValueOnce(afterFirst)
      .mockResolvedValueOnce(afterSecond);

    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.applySequence("F R'"));

    await waitFor(() => expect(result.current.animation?.move.face).toBe('front'));
    expect(result.current.progress).toEqual({ done: 0, total: 2 });
    act(() => result.current.completeAnimation());

    await waitFor(() => expect(result.current.animation?.move.face).toBe('right'));
    act(() => result.current.completeAnimation());

    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.state).toEqual(afterSecond);
    expect(client.applyMoves).toHaveBeenNthCalledWith(1, 'session-1', 'F');
    expect(client.applyMoves).toHaveBeenNthCalledWith(2, 'session-1', "R'");
  });

  it('queues moves requested while a run is draining', async () => {
    vi.mocked(client.applyMoves).mockImplementation((_, move) =>
      Promise.resolve(cubeState({ isSolved: false, history: [move] })),
    );

    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.applySequence('F'));
    await waitFor(() => expect(result.current.animation).not.toBeNull());

    // A second request mid-run joins the queue instead of being dropped.
    act(() => result.current.applySequence('R'));
    expect(result.current.progress).toEqual({ done: 0, total: 2 });

    act(() => result.current.completeAnimation());
    await waitFor(() => expect(result.current.animation?.move.face).toBe('right'));
    act(() => result.current.completeAnimation());

    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(client.applyMoves).toHaveBeenCalledTimes(2);
  });

  it('undo plays the inverse of the last move', async () => {
    vi.mocked(client.createCube).mockResolvedValue(cubeState({ isSolved: false, history: ['F'] }));
    vi.mocked(client.undoMove).mockResolvedValue(cubeState());

    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.undo());

    await waitFor(() => expect(result.current.animation).not.toBeNull());
    expect(result.current.animation?.move).toEqual({
      face: 'front',
      direction: 'counterClockwise',
    });

    act(() => result.current.completeAnimation());
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.state?.history).toEqual([]);
  });

  it('rewind undoes the whole history at a faster animation speed', async () => {
    vi.mocked(client.createCube).mockResolvedValue(
      cubeState({ isSolved: false, history: ['F', "R'"] }),
    );
    vi.mocked(client.undoMove)
      .mockResolvedValueOnce(cubeState({ isSolved: false, history: ['F'] }))
      .mockResolvedValueOnce(cubeState());

    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.rewind());

    // R' is undone first (as R), then F (as F').
    await waitFor(() => expect(result.current.animation).not.toBeNull());
    expect(result.current.animation?.move).toEqual({ face: 'right', direction: 'clockwise' });
    expect(result.current.animation?.speed).toBeGreaterThan(1);
    act(() => result.current.completeAnimation());

    await waitFor(() =>
      expect(result.current.animation?.move).toEqual({
        face: 'front',
        direction: 'counterClockwise',
      }),
    );
    act(() => result.current.completeAnimation());

    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.state?.isSolved).toBe(true);
    expect(client.undoMove).toHaveBeenCalledTimes(2);
  });

  it('a failed move clears busy, surfaces the error and flushes the queue', async () => {
    vi.mocked(client.applyMoves).mockRejectedValue(new Error('The cube is gone.'));

    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.applySequence('F R U'));

    await waitFor(() => expect(result.current.error).toBe('The cube is gone.'));
    expect(result.current.busy).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(client.applyMoves).toHaveBeenCalledTimes(1);
  });

  it('invalid notation reports an error without contacting the API', async () => {
    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.applySequence('F X'));

    expect(result.current.error).toContain("Unexpected 'X'");
    expect(client.applyMoves).not.toHaveBeenCalled();
    expect(result.current.busy).toBe(false);

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('changeSize deletes the old session and creates a new one', async () => {
    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.changeSize(4));

    await waitFor(() => expect(client.createCube).toHaveBeenCalledWith(4));
    expect(client.deleteCube).toHaveBeenCalledWith('session-1');
  });

  it('moves requested before the session exists are dropped, and work after it loads', async () => {
    let resolveCreate: (state: CubeState) => void = () => {};
    vi.mocked(client.createCube).mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    vi.mocked(client.applyMoves).mockResolvedValue(cubeState({ isSolved: false, history: ['F'] }));

    const { result } = renderHook(() => useCubeSession());

    // Keyboard mashing while "Creating a cube…" must not latch anything.
    act(() => result.current.applySequence('F'));
    act(() => result.current.applySequence('R U'));

    expect(result.current.busy).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(client.applyMoves).not.toHaveBeenCalled();

    act(() => resolveCreate(cubeState()));
    await waitFor(() => expect(result.current.state).not.toBeNull());

    // The pipeline still works once the session exists.
    act(() => result.current.applySequence('F'));
    await waitFor(() => expect(result.current.animation).not.toBeNull());
    act(() => result.current.completeAnimation());
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(client.applyMoves).toHaveBeenCalledTimes(1);
  });

  it('exposes queueing only while the move drain runs', async () => {
    vi.mocked(client.applyMoves).mockResolvedValue(cubeState({ history: ['F'] }));
    vi.mocked(client.scrambleCube).mockResolvedValue(cubeState({ history: ['F', 'U'] }));

    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.applySequence('F'));
    await waitFor(() => expect(result.current.animation).not.toBeNull());
    expect(result.current.queueing).toBe(true);
    act(() => result.current.completeAnimation());
    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.queueing).toBe(false);

    // Scramble is busy but not queueing — move inputs should disable.
    act(() => result.current.scramble());
    expect(result.current.queueing).toBe(false);
    await waitFor(() => expect(result.current.busy).toBe(false));
  });

  it('rejects a run of more than fifty moves instead of truncating it', async () => {
    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.applySequence(Array(60).fill('F').join(' ')));

    expect(result.current.error).toContain('At most 50 moves');
    expect(result.current.busy).toBe(false);
    expect(client.applyMoves).not.toHaveBeenCalled();
  });

  it('rejects a layer that does not exist on the current cube', async () => {
    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.applySequence('3L'));

    expect(result.current.error).toContain('Layer 3 does not exist on a 3×3 cube');
    expect(client.applyMoves).not.toHaveBeenCalled();
  });

  it('a size change neutralizes an in-flight move from the old session', async () => {
    let resolveMove: (value: CubeState) => void = () => {};
    vi.mocked(client.applyMoves).mockImplementation(
      () => new Promise<CubeState>((resolve) => (resolveMove = resolve)),
    );
    // First create (mount) yields the 3×3, the one after changeSize a 4×4.
    vi.mocked(client.createCube).mockResolvedValueOnce(cubeState());
    vi.mocked(client.createCube).mockResolvedValue(cubeState({ size: 4 }));

    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.applySequence('F'));
    act(() => result.current.changeSize(4));
    await waitFor(() => expect(result.current.state?.size).toBe(4));

    // The old session's response arrives late; it must not clobber anything.
    act(() => resolveMove(cubeState({ isSolved: false, history: ['F'] })));
    await waitFor(() => expect(result.current.busy).toBe(false));

    expect(result.current.state?.size).toBe(4);
    expect(result.current.state?.history).toEqual([]);
    expect(result.current.animation).toBeNull();
  });

  it('scramble and reset reveal the new state without an animation', async () => {
    vi.mocked(client.scrambleCube).mockResolvedValue(
      cubeState({ isSolved: false, history: ['F', 'U2'] }),
    );
    vi.mocked(client.resetCube).mockResolvedValue(cubeState());

    const { result } = renderHook(() => useCubeSession());
    await waitFor(() => expect(result.current.state).not.toBeNull());

    act(() => result.current.scramble());
    await waitFor(() => expect(result.current.state?.history).toEqual(['F', 'U2']));
    expect(result.current.animation).toBeNull();

    act(() => result.current.reset());
    await waitFor(() => expect(result.current.state?.isSolved).toBe(true));
    expect(result.current.animation).toBeNull();
  });
});
