import { useMemo, useState } from 'react';

import { parseNotation } from '../cube/notation';

export interface SequenceInputProps {
  disabled: boolean;
  onApply: (notation: string) => void;
}

/**
 * Free-text input for whole sequences in Singmaster notation, validated as the
 * user types and applied as one animated run.
 */
export function SequenceInput({ disabled, onApply }: SequenceInputProps) {
  const [notation, setNotation] = useState('');

  const validation = useMemo(() => parseNotation(notation), [notation]);
  const canApply = !disabled && notation.trim().length > 0 && validation.ok;

  const submit = () => {
    if (canApply) {
      onApply(notation);
      setNotation('');
    }
  };

  return (
    <div data-testid="sequence-input">
      <div className="flex gap-1.5">
        <input
          type="text"
          value={notation}
          onChange={(event) => setNotation(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
          placeholder="e.g. F R' U2"
          disabled={disabled}
          aria-label="Move sequence"
          aria-invalid={!validation.ok}
          aria-describedby={validation.ok ? undefined : 'sequence-input-error'}
          className="min-w-0 flex-1 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5
                     font-mono text-sm text-slate-100 placeholder:text-slate-500
                     focus:border-sky-500 focus:outline-none disabled:opacity-40"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canApply}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white
                     transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Apply
        </button>
      </div>
      {!validation.ok && (
        <p id="sequence-input-error" className="mt-1 text-xs text-rose-400" role="alert">
          {validation.message}
        </p>
      )}
    </div>
  );
}
