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
      <label className="ml-auto flex items-center gap-1.5 text-sm text-slate-400">
        Size
        <select
          value={size}
          onChange={(event) => onChangeSize(Number(event.target.value))}
          disabled={busy}
          className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm
                     text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-40"
        >
          {SIZES.map((option) => (
            <option key={option} value={option}>
              {option}×{option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
