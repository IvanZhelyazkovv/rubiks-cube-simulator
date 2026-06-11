import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CubeState } from './api/types';

// jsdom has no WebGL; the 3D view is replaced by a marker. Its internal logic
// lives in cube/geometry.ts, which has its own tests.
vi.mock('./cube/Cube3D', () => ({
  Cube3D: () => <div data-testid="cube-3d" />,
}));

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

  it('sends a move to the API when a pad button is clicked', async () => {
    const afterMove: CubeState = { ...solved, isSolved: false, history: ['F'] };
    vi.mocked(client.applyMoves).mockResolvedValue(afterMove);

    render(<App />);
    await screen.findByTestId('net-view');

    await userEvent.click(screen.getByRole('button', { name: 'F' }));

    await waitFor(() => expect(client.applyMoves).toHaveBeenCalledWith('session-1', 'F'));
  });

  it('shows API failures in the error banner', async () => {
    vi.mocked(client.createCube).mockRejectedValue(new Error('The API is unreachable.'));

    render(<App />);

    expect(await screen.findByTestId('error-banner')).toHaveTextContent('The API is unreachable.');
  });
});
