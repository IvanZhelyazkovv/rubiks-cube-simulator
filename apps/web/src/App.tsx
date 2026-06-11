import { Cube3D } from './cube/Cube3D';
import { HistoryPanel } from './components/HistoryPanel';
import { MovePad } from './components/MovePad';
import { NetView } from './components/NetView';
import { SequenceInput } from './components/SequenceInput';
import { Toolbar } from './components/Toolbar';
import { TASK_SEQUENCE } from './cube/notation';
import { useCubeSession } from './state/useCubeSession';

/**
 * The simulator page: the animated 3D cube on the left, and on the right the
 * exploded view required by the task together with all controls.
 */
export default function App() {
  const session = useCubeSession();

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold tracking-tight">Rubik's Cube Simulator</h1>
          <p className="hidden text-sm text-slate-400 sm:block">
            green front · red right · white up
          </p>
        </div>
        {session.state?.isSolved && (
          <span
            className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold
                       text-emerald-400 ring-1 ring-emerald-500/30"
            data-testid="solved-badge"
          >
            Solved
          </span>
        )}
      </header>

      {session.error && (
        <div
          className="border-b border-rose-900/50 bg-rose-950/60 px-5 py-2 text-sm text-rose-300"
          role="alert"
          data-testid="error-banner"
        >
          {session.error}
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="min-h-64 flex-1" aria-label="3D cube">
          {session.state && (
            <Cube3D
              state={session.state}
              animation={session.animation}
              onAnimationComplete={session.completeAnimation}
            />
          )}
        </section>

        <aside
          className="flex w-full flex-col gap-4 overflow-y-auto border-t border-slate-800 p-4
                     lg:w-96 lg:border-t-0 lg:border-l"
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
                onReset={session.reset}
              />

              <div>
                <h2 className="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  Exploded view
                </h2>
                <NetView state={session.animation?.nextState ?? session.state} />
              </div>

              <div>
                <h2 className="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  Rotate a face
                </h2>
                <MovePad disabled={session.busy} onMove={(token) => session.applySequence(token)} />
              </div>

              <div>
                <h2 className="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  Apply a sequence
                </h2>
                <SequenceInput disabled={session.busy} onApply={session.applySequence} />
              </div>

              <HistoryPanel
                history={session.animation?.nextState.history ?? session.state.history}
              />
            </>
          ) : (
            !session.error && <p className="text-sm text-slate-500">Creating a cube…</p>
          )}
        </aside>
      </main>
    </div>
  );
}
