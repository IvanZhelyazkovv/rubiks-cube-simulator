const FACE_LETTERS = ['U', 'D', 'F', 'B', 'L', 'R'] as const;
const MODIFIERS = ['', "'", '2'] as const;

/** The M/E/S names a cubist expects for the middle slices of a 3×3. */
const CLASSIC_SLICE_NAMES: Record<string, string> = {
  '2L': 'M slice',
  '2D': 'E slice',
  '2F': 'S slice',
};

/**
 * The distinct inner slices of a cube, each named after its nearest face.
 * A dead-centre slice (odd cubes) is named after the conventional M/E/S
 * reference faces: left, down and front.
 */
function sliceTokens(size: number): string[] {
  const tokens: string[] = [];
  for (let layer = 2; layer <= Math.floor(size / 2); layer++) {
    for (const letter of FACE_LETTERS) {
      tokens.push(`${layer}${letter}`);
    }
  }

  if (size % 2 === 1) {
    const middle = (size + 1) / 2;
    for (const letter of ['L', 'D', 'F']) {
      tokens.push(`${middle}${letter}`);
    }
  }

  return tokens;
}

interface TurnButtonProps {
  token: string;
  disabled: boolean;
  title?: string;
  onMove: (notation: string) => void;
}

function TurnButton({ token, disabled, title, onMove }: TurnButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={() => onMove(token)}
      className="rounded-md bg-slate-700/70 px-2 py-2.5 font-mono text-sm font-semibold
                 text-slate-100 transition hover:bg-slate-600 active:scale-95
                 disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5"
    >
      {token}
    </button>
  );
}

export interface MovePadProps {
  size: number;
  disabled: boolean;
  onMove: (notation: string) => void;
}

/**
 * One button per possible turn: clockwise, counter-clockwise (') and half
 * turn (2) for each of the six faces, plus the cube's middle layers (slice
 * moves such as 2L — the M slice of a 3×3) when the size has any.
 */
export function MovePad({ size, disabled, onMove }: MovePadProps) {
  const slices = sliceTokens(size);

  return (
    <div data-testid="move-pad">
      <div className="grid grid-cols-3 gap-1.5">
        {FACE_LETTERS.flatMap((letter) =>
          MODIFIERS.map((modifier) => {
            const token = letter + modifier;
            return <TurnButton key={token} token={token} disabled={disabled} onMove={onMove} />;
          }),
        )}
      </div>

      {slices.length > 0 && (
        <>
          <p className="mt-3 mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Middle layers
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {slices.flatMap((slice) =>
              MODIFIERS.map((modifier) => {
                const token = slice + modifier;
                return (
                  <TurnButton
                    key={token}
                    token={token}
                    disabled={disabled}
                    title={CLASSIC_SLICE_NAMES[slice]}
                    onMove={onMove}
                  />
                );
              }),
            )}
          </div>
        </>
      )}
    </div>
  );
}
