const FACE_LETTERS = ['U', 'D', 'F', 'B', 'L', 'R'] as const;
const MODIFIERS = ['', "'", '2'] as const;

const MODIFIER_NAMES: Record<(typeof MODIFIERS)[number], string> = {
  '': 'clockwise',
  "'": 'counter-clockwise',
  '2': 'half turn',
};

/**
 * The distinct inner slices of a cube, each named after its nearest face.
 * A dead-centre slice (odd cubes) is named after the conventional M/E/S
 * reference faces — left, down and front — and labelled with the classic
 * letter a cubist expects.
 */
function sliceTokens(size: number): { token: string; classicName?: string }[] {
  const tokens: { token: string; classicName?: string }[] = [];
  for (let layer = 2; layer <= Math.floor(size / 2); layer++) {
    for (const letter of FACE_LETTERS) {
      tokens.push({ token: `${layer}${letter}` });
    }
  }

  if (size % 2 === 1) {
    const middle = (size + 1) / 2;
    tokens.push(
      { token: `${middle}L`, classicName: 'M slice' },
      { token: `${middle}D`, classicName: 'E slice' },
      { token: `${middle}F`, classicName: 'S slice' },
    );
  }

  return tokens;
}

interface TurnButtonProps {
  token: string;
  modifier: (typeof MODIFIERS)[number];
  disabled: boolean;
  title?: string;
  onMove: (notation: string) => void;
}

function TurnButton({ token, modifier, disabled, title, onMove }: TurnButtonProps) {
  const base = modifier ? token.slice(0, -modifier.length) : token;
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-label={`${token} — ${MODIFIER_NAMES[modifier]}`}
      onClick={() => onMove(token)}
      className="focus-ring rounded-md border border-slate-700/80 bg-slate-800/70 px-2 py-2.5
                 font-mono text-sm font-semibold text-slate-100 transition-colors duration-150
                 hover:border-slate-600 hover:bg-slate-700 active:scale-95
                 disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5"
    >
      {base}
      {modifier && <span className="text-sky-300/90">{modifier}</span>}
    </button>
  );
}

/** Labels the three columns of a turn grid: clockwise, counter, half. */
function ColumnHeader() {
  return (
    <div
      aria-hidden
      className="mb-1 grid grid-cols-3 gap-1.5 text-center text-[10px] font-medium
                 tracking-wider text-slate-500 uppercase"
    >
      <span>CW</span>
      <span>CCW</span>
      <span>180°</span>
    </div>
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
      <ColumnHeader />
      <div className="grid grid-cols-3 gap-1.5">
        {FACE_LETTERS.flatMap((letter) =>
          MODIFIERS.map((modifier) => (
            <TurnButton
              key={letter + modifier}
              token={letter + modifier}
              modifier={modifier}
              disabled={disabled}
              onMove={onMove}
            />
          )),
        )}
      </div>

      {slices.length > 0 && (
        <>
          <p className="mt-3 mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Middle layers
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {slices.flatMap((slice) =>
              MODIFIERS.map((modifier) => (
                <TurnButton
                  key={slice.token + modifier}
                  token={slice.token + modifier}
                  modifier={modifier}
                  disabled={disabled}
                  title={slice.classicName}
                  onMove={onMove}
                />
              )),
            )}
          </div>
        </>
      )}
    </div>
  );
}
