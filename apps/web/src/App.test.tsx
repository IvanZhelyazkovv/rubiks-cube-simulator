import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CubeState } from './api/types';

// jsdom has no WebGL; the 3D view is replaced by a stand-in that completes any
// requested animation immediately, so the full move lifecycle runs in tests.
// The real view's internal logic lives in cube/geometry.ts with its own tests.
vi.mock('./cube/Cube3D', async () => {
  const { useEffect } = await import('react');
  return {
    Cube3D: ({
      animation,
      onAnimationComplete,
    }: {
      animation: unknown;
      onAnimationComplete: () => void;
    }) => {
      useEffect(() => {
        if (animation) {
          onAnimationComplete();
        }
      });
      return <div data-testid="cube-3d" />;
    },
  };
});

vi.mock('./api/client');

import * as client from './api/client';
import App from './App';

const solved: CubeState = {
  id: 'session-1',
  size: 3,
  isSolved: true,
  faces: {
    up: ['WWW', 'WWW', 'WWW'],
    down: ['YYY', 'YYY', 'YYY'],
    front: ['GGG', 'GGG', 'GGG'],
    back: ['BBB', 'BBB', 'BBB'],
    left: ['OOO', 'OOO', 'OOO'],
    right: ['RRR', 'RRR', 'RRR'],
  },
  history: [],
};

describe('App', () => {
  beforeEach(() => {
    vi.mocked(client.createCube).mockResolvedValue(solved);
  });

  it('creates a session on mount and renders the cube', async () => {
    render(<App />);

    expect(await screen.findByTestId('net-view')).toBeInTheDocument();
    expect(screen.getByTestId('cube-3d')).toBeInTheDocument();
    expect(screen.getByTestId('solved-badge')).toBeInTheDocument();
    expect(client.createCube).toHaveBeenCalledWith(3);
  });

  it('applies a pad move end to end: API call, animation, committed history', async () => {
    const afterMove: CubeState = { ...solved, isSolved: false, history: ['F'] };
    vi.mocked(client.applyMoves).mockResolvedValue(afterMove);

    render(<App />);
    await screen.findByTestId('net-view');

    await userEvent.click(screen.getByRole('button', { name: /^F — clockwise/ }));

    await waitFor(() => expect(client.applyMoves).toHaveBeenCalledWith('session-1', 'F'));

    // The stand-in 3D view completes the animation, so the new state commits:
    // the history shows the move and the solved badge disappears.
    expect(await screen.findByText('1 move')).toBeInTheDocument();
    expect(screen.queryByTestId('solved-badge')).not.toBeInTheDocument();
  });

  it('applies keyboard moves, with Shift turning counter-clockwise', async () => {
    const afterMove: CubeState = { ...solved, isSolved: false, history: ["R'"] };
    vi.mocked(client.applyMoves).mockResolvedValue(afterMove);

    render(<App />);
    await screen.findByTestId('net-view');

    await userEvent.keyboard('{Shift>}r{/Shift}');

    await waitFor(() => expect(client.applyMoves).toHaveBeenCalledWith('session-1', "R'"));
  });

  it('shows API failures in the error banner', async () => {
    vi.mocked(client.createCube).mockRejectedValue(new Error('The API is unreachable.'));

    render(<App />);

    expect(await screen.findByTestId('error-banner')).toHaveTextContent('The API is unreachable.');
  });
});
