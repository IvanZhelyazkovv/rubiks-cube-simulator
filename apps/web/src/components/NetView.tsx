import type { CubeState, FaceName } from '../api/types';
import { COLOR_NAMES, colorOf } from '../cube/colors';
import type { ColorLetter } from '../api/types';

interface FaceGridProps {
  face: FaceName;
  rows: string[];
}

function FaceGrid({ face, rows }: FaceGridProps) {
  return (
    <div
      className="grid w-full gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}
      data-testid={`net-face-${face}`}
      aria-label={`${face} face`}
    >
      {rows.flatMap((row, rowIndex) =>
        [...row].map((letter, columnIndex) => (
          <div
            key={`${rowIndex}-${columnIndex}`}
            className="aspect-square rounded-[3px] border border-black/40"
            style={{ backgroundColor: colorOf(letter) }}
            data-testid={`net-${face}-${rowIndex}-${columnIndex}`}
            data-letter={letter}
            title={COLOR_NAMES[letter as ColorLetter]}
          />
        )),
      )}
    </div>
  );
}

export interface NetViewProps {
  state: CubeState;
}

/**
 * The exploded view required by the task: the up face on top; left, front,
 * right and back side by side; the down face at the bottom.
 */
export function NetView({ state }: NetViewProps) {
  const { faces } = state;

  return (
    <div className="grid grid-cols-4 gap-1" data-testid="net-view">
      <div />
      <FaceGrid face="up" rows={faces.up} />
      <div />
      <div />

      <FaceGrid face="left" rows={faces.left} />
      <FaceGrid face="front" rows={faces.front} />
      <FaceGrid face="right" rows={faces.right} />
      <FaceGrid face="back" rows={faces.back} />

      <div />
      <FaceGrid face="down" rows={faces.down} />
      <div />
      <div />
    </div>
  );
}
