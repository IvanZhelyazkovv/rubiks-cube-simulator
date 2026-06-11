import type { ReactNode } from 'react';

import { Cube3D } from './cube/Cube3D';
import { HistoryPanel } from './components/HistoryPanel';
import { MovePad } from './components/MovePad';
import { NetView } from './components/NetView';
import { SequenceInput } from './components/SequenceInput';
import { Toolbar } from './components/Toolbar';
import { TASK_SEQUENCE } from './cube/notation';
import { useCubeSession } from './state/useCubeSession';
import { useKeyboardMoves } from './state/useKeyboardMoves';

/** A tiny pure-CSS 2×2 cube as the app's mark. */
function LogoMark() {
  return (
    <div aria-hidden className="grid grid-cols-2 gap-px rounded-[5px] bg-slate-800 p-[3px]">
      <span className="size-2 rounded-[2px] bg-emerald-500" />
      <span className="size-2 rounded-[2px] bg-red-500" />
      <span className="size-2 rounded-[2px] bg-sky-500" />
      <span className="size-2 rounded-[2px] bg-amber-400" />
    </div>
  );
}

/** A section card in the control sidebar. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
      <h2 className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        {title}
      </h2>
      {children}
    </div>
  );
}

/**
 * The simulator page: the animated 3D cube on the left, and on the right the
 * exploded view required by the task together with all controls.
 */
export default function App() {
  const session = useCubeSession();

  // Keyboard turns reuse the queueing sequence path, so quick key presses
  // play back-to-back instead of being dropped.
  useKeyboardMoves(session.applySequence);

  return (
    <div className="flex h-dvh flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <h1 className="text-lg font-bold tracking-tight">Rubik's Cube Simulator</h1>
        </div>
        <div className="flex items-center gap-3">
          {session.progress && (
            <span
              className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium
                         text-sky-300 ring-1 ring-sky-500/30 tabular-nums"
              data-testid="run-progress"
              role="status"
            >
              applying {Math.min(session.progress.done + 1, session.progress.total)}/
              {session.progress.total}
            </span>
          )}
          {session.state?.isSolved && (
            <span
              className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold
                         text-emerald-400 ring-1 ring-emerald-500/30"
              data-testid="solved-badge"
            >
              Solved
            </span>
          )}
        </div>
      </header>

      {session.error && (
        <div
          className="flex items-center justify-between border-b border-rose-900/50 bg-rose-950/60
                     px-5 py-2 text-sm text-rose-300"
          role="alert"
          data-testid="error-banner"
        >
          <span>{session.error}</span>
          <button
            type="button"
            onClick={session.clearError}
            aria-label="Dismiss error"
            className="focus-ring ml-4 rounded-md p-1 px-2 text-rose-300 hover:bg-rose-900/40"
          >
            ✕
          </button>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section
          className="relative h-[38dvh] min-h-52 shrink-0
                     bg-[radial-gradient(ellipse_60%_55%_at_50%_42%,#16213c_0%,#0b1220_55%,#020617_100%)]
                     lg:h-auto lg:min-h-64 lg:flex-1"
          aria-label="3D cube"
        >
          {session.state && (
            <Cube3D
              state={session.state}
              animation={session.animation}
              onAnimationComplete={session.completeAnimation}
              onMove={session.applySequence}
            />
          )}
          <div
            className="pointer-events-none absolute bottom-3 left-3 hidden rounded-full
                       bg-slate-900/70 px-3 py-1 text-xs text-slate-400 ring-1
                       ring-slate-700/60 backdrop-blur-sm sm:block"
          >
            green front · red right · white up
          </div>
        </section>

        <aside
          className="flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto border-t
                     border-slate-800 bg-slate-900/40 p-3 lg:w-96 lg:flex-none lg:border-t-0
                     lg:border-l lg:p-4"
        >
          {session.state ? (
            <>
              <Toolbar
                size={session.state.size}
                busy={session.busy}
                canUndo={session.state.history.length > 0}
                onChangeSize={session.changeSize}
                onRunTaskSequence={() => session.applySequence(TASK_SEQUENCE)}
                onScramble={session.scramble}
                onUndo={session.undo}
                onRewind={session.rewind}
                onReset={session.reset}
              />

              <Section title="Exploded view">
                <NetView state={session.animation?.nextState ?? session.state} />
              </Section>

              <Section title="Rotate a layer">
                <MovePad
                  size={session.state.size}
                  disabled={session.busy && !session.queueing}
                  onMove={session.applySequence}
                />
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Drag a sticker on the cube to turn its layer — middle layers too.
                  <span className="hidden sm:inline">
                    {' '}
                    Or press <kbd>U</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>B</kbd> <kbd>L</kbd>{' '}
                    <kbd>R</kbd> — <kbd>Shift</kbd> reverses.
                  </span>
                </p>
              </Section>

              <Section title="Apply a sequence">
                <SequenceInput
                  disabled={session.busy && !session.queueing}
                  onApply={session.applySequence}
                />
              </Section>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
                <HistoryPanel
                  history={session.animation?.nextState.history ?? session.state.history}
                />
              </div>
            </>
          ) : (
            !session.error && (
              <div
                className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-500"
                role="status"
              >
                <div
                  aria-hidden
                  className="size-6 animate-spin rounded-full border-2 border-slate-700
                             border-t-sky-500"
                />
                <p className="text-sm">Creating a cube…</p>
              </div>
            )
          )}
        </aside>
      </main>
    </div>
  );
}
