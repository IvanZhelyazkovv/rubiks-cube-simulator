const FACE_LETTERS = ['U', 'D', 'F', 'B', 'L', 'R'] as const;
const MODIFIERS = ['', "'", '2'] as const;

export interface MovePadProps {
  disabled: boolean;
  onMove: (notation: string) => void;
}

/**
 * One button per possible face turn: clockwise, counter-clockwise (') and
 * half turn (2) for each of the six faces.
 */
export function MovePad({ disabled, onMove }: MovePadProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5" data-testid="move-pad">
      {FACE_LETTERS.flatMap((letter) =>
        MODIFIERS.map((modifier) => {
          const token = letter + modifier;
          return (
            <button
              key={token}
              type="button"
              disabled={disabled}
              onClick={() => onMove(token)}
              className="rounded-md bg-slate-700/70 px-2 py-2.5 font-mono text-sm font-semibold
                         text-slate-100 transition hover:bg-slate-600 active:scale-95
                         disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5"
            >
              {token}
            </button>
          );
        }),
      )}
    </div>
  );
}
