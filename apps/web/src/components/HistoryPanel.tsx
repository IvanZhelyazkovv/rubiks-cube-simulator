import { useEffect, useRef } from 'react';

export interface HistoryPanelProps {
  history: string[];
}

/**
 * The moves applied since the cube was created or last reset, oldest first.
 * The newest move is highlighted and kept scrolled into view.
 */
export function HistoryPanel({ history }: HistoryPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // scrollTo is absent in some environments (e.g. jsdom).
    listRef.current?.scrollTo?.({ top: listRef.current.scrollHeight });
  }, [history.length]);

  return (
    <div data-testid="history-panel">
      <div className="mb-1.5 flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          History
        </h2>
        <span className="text-xs text-slate-500 tabular-nums">
          {history.length} {history.length === 1 ? 'move' : 'moves'}
        </span>
      </div>
      {history.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-800 px-3 py-2.5 text-xs text-slate-500">
          No moves yet — turn a face to start.
        </p>
      ) : (
        <div ref={listRef} className="flex max-h-24 flex-wrap content-start gap-1 overflow-y-auto">
          {history.map((move, index) => (
            <span
              key={`${index}-${move}`}
              className={
                index === history.length - 1
                  ? 'rounded bg-sky-500/20 px-1.5 py-0.5 font-mono text-xs font-semibold text-sky-300 ring-1 ring-sky-500/40'
                  : 'rounded bg-slate-700/60 px-1.5 py-0.5 font-mono text-xs text-slate-200'
              }
            >
              {move}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
