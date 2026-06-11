import { useCallback, useEffect, useRef, useState } from 'react';

import * as api from '../api/client';
import type { CubeState } from '../api/types';
import { formatMove, inverseOf, parseNotation, type Move } from '../cube/notation';

/** A move being animated in the 3D view, together with the state to show afterwards. */
export interface PendingAnimation {
  move: Move;
  nextState: CubeState;
}

/** Everything the UI needs to drive one cube session. */
export interface CubeSessionApi {
  /** The state currently shown (the pre-move state while an animation runs). */
  state: CubeState | null;
  /** The animation the 3D view should currently play, if any. */
  animation: PendingAnimation | null;
  /** Whether an operation is in flight — controls should be disabled. */
  busy: boolean;
  /** The most recent error, already in human-readable form. */
  error: string | null;
  /** Applies a notation string, animating each move in order. */
  applySequence: (notation: string) => void;
  /** Undoes the last move with a reverse animation. */
  undo: () => void;
  /** Resets to the solved cube (no animation). */
  reset: () => void;
  /** Applies a random scramble (no animation). */
  scramble: () => void;
  /** Switches to a fresh session with a cube of the given size. */
  changeSize: (size: number) => void;
  /** Must be called by the 3D view when the current animation finishes. */
  completeAnimation: () => void;
}

/**
 * Owns one cube session: creates it on mount, exposes the displayed state and
 * funnels every mutation through the API, animating face turns one at a time.
 * The server is the single source of truth — the hook never mutates cube state
 * locally, it only chooses when to reveal the server's answer.
 */
export function useCubeSession(initialSize = 3): CubeSessionApi {
  const [size, setSize] = useState(initialSize);
  const [state, setState] = useState<CubeState | null>(null);
  const [animation, setAnimation] = useState<PendingAnimation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const animationDone = useRef<(() => void) | null>(null);

  // Callbacks read the latest state through a ref so they can stay stable while
  // sequences of awaited operations run. The ref is synced after every commit.
  const stateRef = useRef<CubeState | null>(null);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let cancelled = false;

    api
      .createCube(size)
      .then((created) => {
        if (!cancelled) {
          setState(created);
        }
      })
      .catch((createError: Error) => {
        if (!cancelled) {
          setError(createError.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [size]);

  /** Shows `move` in the 3D view and resolves once the view reports completion. */
  const animateMove = useCallback(
    (move: Move, nextState: CubeState) =>
      new Promise<void>((resolve) => {
        animationDone.current = resolve;
        setAnimation({ move, nextState });
      }),
    [],
  );

  const completeAnimation = useCallback(() => {
    setAnimation((current) => {
      if (current) {
        setState(current.nextState);
      }
      return null;
    });
    animationDone.current?.();
    animationDone.current = null;
  }, []);

  /** Serializes operations: one at a time, with busy state and error capture. */
  const run = useCallback(
    (operation: () => Promise<void>) => {
      if (busy || !stateRef.current) {
        return;
      }

      setBusy(true);
      setError(null);
      operation()
        .catch((operationError: Error) => setError(operationError.message))
        .finally(() => setBusy(false));
    },
    [busy],
  );

  const applySequence = useCallback(
    (notation: string) =>
      run(async () => {
        const parsed = parseNotation(notation);
        if (!parsed.ok) {
          throw new Error(parsed.message);
        }

        for (const move of parsed.moves) {
          const session = stateRef.current;
          if (!session) {
            return;
          }

          const next = await api.applyMoves(session.id, formatMove(move));
          await animateMove(move, next);
        }
      }),
    [run, animateMove],
  );

  const undo = useCallback(
    () =>
      run(async () => {
        const session = stateRef.current;
        if (!session || session.history.length === 0) {
          return;
        }

        const lastMove = parseNotation(session.history[session.history.length - 1]);
        const next = await api.undoMove(session.id);

        if (lastMove.ok && lastMove.moves.length === 1) {
          await animateMove(inverseOf(lastMove.moves[0]), next);
        } else {
          setState(next);
        }
      }),
    [run, animateMove],
  );

  const reset = useCallback(
    () =>
      run(async () => {
        const session = stateRef.current;
        if (session) {
          setState(await api.resetCube(session.id));
        }
      }),
    [run],
  );

  const scramble = useCallback(
    () =>
      run(async () => {
        const session = stateRef.current;
        if (session) {
          setState(await api.scrambleCube(session.id));
        }
      }),
    [run],
  );

  // Resetting here (in the event handler, not the fetch effect) clears the old
  // cube immediately while the effect creates the new session.
  const changeSize = useCallback((newSize: number) => {
    setState(null);
    setAnimation(null);
    setError(null);
    setSize(newSize);
  }, []);

  return {
    state,
    animation,
    busy,
    error,
    applySequence,
    undo,
    reset,
    scramble,
    changeSize,
    completeAnimation,
  };
}
