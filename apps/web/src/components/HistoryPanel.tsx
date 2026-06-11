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
        <h2 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">History</h2>
        <span className="text-xs text-slate-500">
          {history.length} {history.length === 1 ? 'move' : 'moves'}
        </span>
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-slate-500">No moves yet — the cube is in its starting state.</p>
      ) : (
        <div ref={listRef} className="flex max-h-24 flex-wrap content-start gap-1 overflow-y-auto">
          {history.map((move, index) => (
            <span
              key={`${index}-${move}`}
              className={
                index === history.length - 1
                  ? 'rounded bg-sky-600/70 px-1.5 py-0.5 font-mono text-xs font-semibold text-white'
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
