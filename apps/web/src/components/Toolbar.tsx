import { TASK_SEQUENCE } from '../cube/notation';

export interface ToolbarProps {
  size: number;
  busy: boolean;
  canUndo: boolean;
  onChangeSize: (size: number) => void;
  onRunTaskSequence: () => void;
  onScramble: () => void;
  onUndo: () => void;
  onRewind: () => void;
  onReset: () => void;
}

const SIZES = [2, 3, 4, 5];

const secondaryButton =
  'rounded-md bg-slate-700/70 px-3 py-1.5 text-sm font-medium text-slate-100 ' +
  'transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40';

/** Session-level actions: run the task's sequence, scramble, undo, rewind, reset, cube size. */
export function Toolbar({
  size,
  busy,
  canUndo,
  onChangeSize,
  onRunTaskSequence,
  onScramble,
  onUndo,
  onRewind,
  onReset,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid="toolbar">
      <button
        type="button"
        onClick={onRunTaskSequence}
        disabled={busy}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white
                   transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
        title="Apply the verification sequence from the task"
      >
        Run {TASK_SEQUENCE}
      </button>
      <button type="button" onClick={onScramble} disabled={busy} className={secondaryButton}>
        Scramble
      </button>
      <button
        type="button"
        onClick={onUndo}
        disabled={busy || !canUndo}
        className={secondaryButton}
      >
        Undo
      </button>
      <button
        type="button"
        onClick={onRewind}
        disabled={busy || !canUndo}
        className={secondaryButton}
        title="Replay the inverse of every move back to the solved cube"
      >
        Rewind
      </button>
      <button type="button" onClick={onReset} disabled={busy} className={secondaryButton}>
        Reset
      </button>
      <div className="ml-auto flex items-center gap-1.5 text-sm text-slate-400">
        <span id="size-label">Size</span>
        <div
          role="group"
          aria-labelledby="size-label"
          className="flex overflow-hidden rounded-md border border-slate-600"
        >
          {SIZES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => option !== size && onChangeSize(option)}
              disabled={busy}
              aria-pressed={option === size}
              className={`px-2 py-1 text-sm font-medium transition focus-visible:outline-none
                          disabled:cursor-not-allowed disabled:opacity-40
                          ${
                            option === size
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
            >
              {option}×{option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
