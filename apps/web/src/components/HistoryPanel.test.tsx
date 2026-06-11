import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HistoryPanel } from './HistoryPanel';

describe('HistoryPanel', () => {
  it('shows an empty state before any moves', () => {
    render(<HistoryPanel history={[]} />);

    expect(screen.getByText(/no moves yet/i)).toBeInTheDocument();
    expect(screen.getByText('0 moves')).toBeInTheDocument();
  });

  it('lists every applied move in order', () => {
    render(<HistoryPanel history={['F', "R'", 'U2']} />);

    expect(screen.getByText('3 moves')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.getByText("R'")).toBeInTheDocument();
    expect(screen.getByText('U2')).toBeInTheDocument();
  });

  it('uses singular wording for a single move', () => {
    render(<HistoryPanel history={['F']} />);

    expect(screen.getByText('1 move')).toBeInTheDocument();
  });
});
