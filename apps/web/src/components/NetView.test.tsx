import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { CubeState } from '../api/types';
import { NetView } from './NetView';

/** The task scenario's expected state, as returned by the API. */
const taskResultState: CubeState = {
  id: 'test',
  size: 3,
  isSolved: false,
  faces: {
    up: ['ROG', 'BWW', 'BBB'],
    front: ['ORR', 'OGW', 'WWW'],
    right: ['YBO', 'RRW', 'OYR'],
    back: ['YBW', 'OBY', 'YYW'],
    left: ['GYY', 'OOG', 'BGO'],
    down: ['GGB', 'RYR', 'RGG'],
  },
  history: ['F', "R'", 'U', "B'", 'L', "D'"],
};

describe('NetView', () => {
  it('renders all six faces with one cell per sticker', () => {
    render(<NetView state={taskResultState} />);

    for (const face of ['up', 'down', 'front', 'back', 'left', 'right']) {
      expect(screen.getByTestId(`net-face-${face}`).children).toHaveLength(9);
    }
  });

  it('shows each sticker with its colour letter from the state', () => {
    render(<NetView state={taskResultState} />);

    expect(screen.getByTestId('net-up-0-0')).toHaveAttribute('data-letter', 'R');
    expect(screen.getByTestId('net-up-1-1')).toHaveAttribute('data-letter', 'W');
    expect(screen.getByTestId('net-front-2-0')).toHaveAttribute('data-letter', 'W');
    expect(screen.getByTestId('net-back-0-2')).toHaveAttribute('data-letter', 'W');
    expect(screen.getByTestId('net-down-2-2')).toHaveAttribute('data-letter', 'G');
  });

  it('scales to other cube sizes', () => {
    const twoByTwo: CubeState = {
      ...taskResultState,
      size: 2,
      faces: {
        up: ['WW', 'WW'],
        down: ['YY', 'YY'],
        front: ['GG', 'GG'],
        back: ['BB', 'BB'],
        left: ['OO', 'OO'],
        right: ['RR', 'RR'],
      },
    };

    render(<NetView state={twoByTwo} />);

    expect(screen.getByTestId('net-face-front').children).toHaveLength(4);
  });
});
