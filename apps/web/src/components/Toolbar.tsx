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
  'focus-ring w-full rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 ' +
  'text-sm font-medium text-slate-100 transition-colors duration-150 hover:border-slate-600 ' +
  'hover:bg-slate-700/80 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40';

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
    <div className="flex flex-col gap-2" data-testid="toolbar">
      <button
        type="button"
        onClick={onRunTaskSequence}
        disabled={busy}
        className="focus-ring w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold
                   text-white shadow-sm shadow-emerald-950/50 transition-colors duration-150
                   hover:bg-emerald-500 active:translate-y-px disabled:cursor-not-allowed
                   disabled:opacity-40"
        title="Apply the verification sequence from the task"
      >
        Run {TASK_SEQUENCE}
      </button>

      <div className="grid grid-cols-4 gap-1.5">
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
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span id="size-label">Cube size</span>
        <div
          role="group"
          aria-labelledby="size-label"
          className="inline-flex gap-0.5 rounded-lg bg-slate-800/80 p-0.5"
        >
          {SIZES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => option !== size && onChangeSize(option)}
              disabled={busy}
              aria-pressed={option === size}
              className={`focus-ring rounded-md px-2.5 py-1 text-xs font-medium transition-colors
                          duration-150 disabled:cursor-not-allowed disabled:opacity-40
                          ${
                            option === size
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'text-slate-300 hover:bg-slate-700/70 hover:text-slate-100'
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
