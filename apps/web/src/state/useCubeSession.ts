import { useCallback, useEffect, useRef, useState } from 'react';

import * as api from '../api/client';
import type { CubeState } from '../api/types';
import { formatMove, inverseOf, parseNotation, type Move } from '../cube/notation';

/** A move being animated in the 3D view, together with the state to show afterwards. */
export interface PendingAnimation {
  move: Move;
  nextState: CubeState;
  /** Playback-speed multiplier; rewinding plays faster than normal turns. */
  speed: number;
}

/** Progress of a multi-move run, e.g. “applying 3 of 6”. */
export interface RunProgress {
  done: number;
  total: number;
}

/** Everything the UI needs to drive one cube session. */
export interface CubeSessionApi {
  /** The state currently shown (the pre-move state while an animation runs). */
  state: CubeState | null;
  /** The animation the 3D view should currently play, if any. */
  animation: PendingAnimation | null;
  /** Whether an operation is in flight — non-queueable controls should be disabled. */
  busy: boolean;
  /**
   * Whether the in-flight operation is the move drain, which accepts further
   * moves into its queue — move inputs stay enabled while this is true.
   */
  queueing: boolean;
  /** Progress through the current queue of moves, when more than one is pending. */
  progress: RunProgress | null;
  /** The most recent error, already in human-readable form. */
  error: string | null;
  /**
   * Applies a notation string, animating each move in order. Moves requested
   * while a run is in progress are queued and played afterwards.
   */
  applySequence: (notation: string) => void;
  /** Undoes the last move with a reverse animation. */
  undo: () => void;
  /** Replays the inverse of the whole history, rewinding the cube back to solved. */
  rewind: () => void;
  /** Resets to the solved cube (no animation). */
  reset: () => void;
  /** Applies a random scramble (no animation). */
  scramble: () => void;
  /** Switches to a fresh session with a cube of the given size. */
  changeSize: (size: number) => void;
  /** Clears the current error message. */
  clearError: () => void;
  /** Must be called by the 3D view when the current animation finishes. */
  completeAnimation: () => void;
}

const REWIND_SPEED = 2.4;

/** The most moves that may wait in the input queue — key autorepeat, not malice. */
const MaxQueuedMoves = 50;

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
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
  const [queueing, setQueueing] = useState(false);
  const [progress, setProgress] = useState<RunProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The busy guard and the animation handshake live in refs: they must be
  // checked and settled synchronously, independent of React's render timing.
  const busyRef = useRef(false);
  // True only while the move-queue drain runs — the one operation that accepts
  // additional moves; everything else (scramble, undo, …) ignores new input.
  const drainingRef = useRef(false);
  const animationRef = useRef<PendingAnimation | null>(null);
  const animationDone = useRef<(() => void) | null>(null);
  const queueRef = useRef<Move[]>([]);
  const runTotals = useRef({ done: 0, total: 0 });
  const stateRef = useRef<CubeState | null>(null);
  // Incremented when the session is replaced (size change). Async operations
  // capture the epoch they started under and stop acting after any await that
  // outlived it, so a late API response can never clobber the new session.
  const epochRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Best-effort cleanup: tell the server when the tab abandons its session.
  // keepalive lets the request outlive the page; eviction on the server covers
  // whatever this cannot (crashes, lost connectivity).
  useEffect(() => {
    const releaseSession = () => {
      const session = stateRef.current;
      if (session) {
        void fetch(`/api/cubes/${session.id}`, { method: 'DELETE', keepalive: true }).catch(
          () => undefined,
        );
      }
    };

    window.addEventListener('pagehide', releaseSession);
    return () => window.removeEventListener('pagehide', releaseSession);
  }, []);

  useEffect(() => {
    let cancelled = false;

    api
      .createCube(size)
      .then((created) => {
        if (cancelled) {
          // A duplicate dev-mode mount (StrictMode) or a quick size change
          // raced this create; release the session it produced.
          void api.deleteCube(created.id).catch(() => undefined);
          return;
        }
        setState(created);
      })
      .catch((createError: unknown) => {
        if (!cancelled) {
          setError(messageOf(createError));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [size]);

  /**
   * Shows `move` in the 3D view and resolves once the view reports completion.
   * Honours the user's reduced-motion preference by committing immediately.
   */
  const animateMove = useCallback((move: Move, nextState: CubeState, speed = 1) => {
    if (prefersReducedMotion()) {
      setState(nextState);
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      animationDone.current = resolve;
      const pending = { move, nextState, speed };
      animationRef.current = pending;
      setAnimation(pending);
    });
  }, []);

  const completeAnimation = useCallback(() => {
    const current = animationRef.current;
    if (!current) {
      return;
    }

    animationRef.current = null;
    setState(current.nextState);
    setAnimation(null);
    animationDone.current?.();
    animationDone.current = null;
  }, []);

  /** Abandons any in-flight animation handshake so awaited promises can't dangle. */
  const releaseAnimation = useCallback(() => {
    animationRef.current = null;
    setAnimation(null);
    animationDone.current?.();
    animationDone.current = null;
  }, []);

  /**
   * Serializes operations: one at a time, with busy state and error capture.
   * Returns whether the operation was accepted — callers that set up state of
   * their own (like the queue drain) must roll it back on rejection.
   */
  const run = useCallback((operation: () => Promise<void>): boolean => {
    if (busyRef.current || !stateRef.current) {
      return false;
    }

    busyRef.current = true;
    setBusy(true);
    setError(null);
    operation()
      .catch((operationError: unknown) => {
        queueRef.current = [];
        setError(messageOf(operationError));
      })
      .finally(() => {
        busyRef.current = false;
        setBusy(false);
        setProgress(null);
        runTotals.current = { done: 0, total: 0 };
      });

    return true;
  }, []);

  const applySequence = useCallback(
    (notation: string) => {
      const parsed = parseNotation(notation);
      if (!parsed.ok) {
        setError(parsed.message);
        return;
      }
      if (parsed.moves.length === 0) {
        return;
      }

      // The same instant feedback invalid letters get: a layer that does not
      // exist on this cube never reaches the server.
      const cubeSize = stateRef.current?.size;
      const badLayer = cubeSize
        ? parsed.moves.find((move) => (move.layer ?? 1) >= cubeSize)
        : undefined;
      if (badLayer) {
        setError(
          `Layer ${badLayer.layer} does not exist on a ${cubeSize}×${cubeSize} cube; ` +
            `layers run from 1 to ${(cubeSize ?? 0) - 1}.`,
        );
        return;
      }

      // A drain is already running — it picks the new moves up, as long as
      // they fit the bounded queue. Nothing is ever truncated silently.
      if (drainingRef.current) {
        const space = MaxQueuedMoves - queueRef.current.length;
        if (parsed.moves.length > space) {
          setError(`At most ${MaxQueuedMoves} moves can be queued per run.`);
          return;
        }

        queueRef.current.push(...parsed.moves);
        runTotals.current.total += parsed.moves.length;
        setProgress({ ...runTotals.current });
        return;
      }

      // Some other operation (scramble, undo, …) is running; those cannot
      // absorb queued moves, so the input is ignored like a disabled button.
      if (busyRef.current) {
        return;
      }

      if (parsed.moves.length > MaxQueuedMoves) {
        setError(`At most ${MaxQueuedMoves} moves can be queued per run.`);
        return;
      }

      // Stage the queue and flags before starting the drain — it reads the
      // queue synchronously. Rolled back below if `run` rejects the operation.
      queueRef.current = [...parsed.moves];
      runTotals.current = { done: 0, total: queueRef.current.length };
      drainingRef.current = true;

      const epoch = epochRef.current;
      const accepted = run(async () => {
        try {
          let session = stateRef.current;
          for (
            let move = queueRef.current.shift();
            move && session;
            move = queueRef.current.shift()
          ) {
            if (runTotals.current.total > 1) {
              setProgress({ ...runTotals.current });
            }

            const next = await api.applyMoves(session.id, formatMove(move));
            if (epoch !== epochRef.current) {
              return;
            }
            await animateMove(move, next);
            if (epoch !== epochRef.current) {
              return;
            }

            session = next;
            runTotals.current.done += 1;
          }
        } finally {
          drainingRef.current = false;
          setQueueing(false);
        }
      });

      if (accepted) {
        setQueueing(true);
        return;
      }

      // Input before the session exists (still loading, failed create) is
      // dropped like any other disabled control — nothing may latch.
      queueRef.current = [];
      runTotals.current = { done: 0, total: 0 };
      drainingRef.current = false;
    },
    [run, animateMove],
  );

  const undo = useCallback(() => {
    const epoch = epochRef.current;
    run(async () => {
      const session = stateRef.current;
      if (!session || session.history.length === 0) {
        return;
      }

      const lastMove = parseNotation(session.history[session.history.length - 1]);
      const next = await api.undoMove(session.id);
      if (epoch !== epochRef.current) {
        return;
      }

      if (lastMove.ok && lastMove.moves.length === 1) {
        await animateMove(inverseOf(lastMove.moves[0]), next);
      } else {
        setState(next);
      }
    });
  }, [run, animateMove]);

  const rewind = useCallback(() => {
    const epoch = epochRef.current;
    run(async () => {
      let session = stateRef.current;
      runTotals.current = { done: 0, total: session?.history.length ?? 0 };

      while (session && session.history.length > 0) {
        if (runTotals.current.total > 1) {
          setProgress({ ...runTotals.current });
        }

        const lastMove = parseNotation(session.history[session.history.length - 1]);
        const next = await api.undoMove(session.id);
        if (epoch !== epochRef.current) {
          return;
        }

        if (lastMove.ok && lastMove.moves.length === 1) {
          await animateMove(inverseOf(lastMove.moves[0]), next, REWIND_SPEED);
        } else {
          setState(next);
        }

        session = next;
        runTotals.current.done += 1;
      }
    });
  }, [run, animateMove]);

  const reset = useCallback(() => {
    const epoch = epochRef.current;
    run(async () => {
      const session = stateRef.current;
      if (session) {
        const next = await api.resetCube(session.id);
        if (epoch === epochRef.current) {
          setState(next);
        }
      }
    });
  }, [run]);

  const scramble = useCallback(() => {
    const epoch = epochRef.current;
    run(async () => {
      const session = stateRef.current;
      if (session) {
        const next = await api.scrambleCube(session.id);
        if (epoch === epochRef.current) {
          setState(next);
        }
      }
    });
  }, [run]);

  const changeSize = useCallback(
    (newSize: number) => {
      // The old session is gone from the UI's point of view; tell the server
      // too (best effort) and abandon any in-flight animation handshake.
      const previous = stateRef.current;
      if (previous) {
        void api.deleteCube(previous.id).catch(() => undefined);
      }

      epochRef.current += 1;
      queueRef.current = [];
      drainingRef.current = false;
      setQueueing(false);
      runTotals.current = { done: 0, total: 0 };
      releaseAnimation();
      setState(null);
      setError(null);
      setSize(newSize);
    },
    [releaseAnimation],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    state,
    animation,
    busy,
    queueing,
    progress,
    error,
    applySequence,
    undo,
    rewind,
    reset,
    scramble,
    changeSize,
    clearError,
    completeAnimation,
  };
}
