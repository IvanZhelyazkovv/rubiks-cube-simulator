import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MovePad } from './MovePad';

describe('MovePad', () => {
  it('offers all eighteen face turns', () => {
    render(<MovePad size={3} disabled={false} onMove={() => {}} />);

    for (const letter of ['U', 'D', 'F', 'B', 'L', 'R']) {
      for (const modifier of ['', "'", '2']) {
        expect(screen.getByRole('button', { name: letter + modifier })).toBeInTheDocument();
      }
    }
  });

  it('offers the M, E and S slices on a 3x3', () => {
    render(<MovePad size={3} disabled={false} onMove={() => {}} />);

    for (const slice of ['2L', "2L'", '2L2', '2D', '2F']) {
      expect(screen.getByRole('button', { name: slice })).toBeInTheDocument();
    }
  });

  it('offers every inner layer of a 4x4 and the middle of a 5x5', () => {
    const { rerender } = render(<MovePad size={4} disabled={false} onMove={() => {}} />);
    for (const slice of ['2U', '2D', '2F', '2B', '2L', '2R']) {
      expect(screen.getByRole('button', { name: slice })).toBeInTheDocument();
    }

    rerender(<MovePad size={5} disabled={false} onMove={() => {}} />);
    expect(screen.getByRole('button', { name: '3L' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2R' })).toBeInTheDocument();
  });

  it('hides the middle-layer section on a 2x2, which has none', () => {
    render(<MovePad size={2} disabled={false} onMove={() => {}} />);

    expect(screen.queryByText('Middle layers')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(18);
  });

  it('reports the clicked move in notation', async () => {
    const onMove = vi.fn();
    render(<MovePad size={3} disabled={false} onMove={onMove} />);

    await userEvent.click(screen.getByRole('button', { name: "R'" }));
    await userEvent.click(screen.getByRole('button', { name: "2L'" }));

    expect(onMove).toHaveBeenNthCalledWith(1, "R'");
    expect(onMove).toHaveBeenNthCalledWith(2, "2L'");
  });

  it('disables every button while busy', () => {
    render(<MovePad size={3} disabled onMove={() => {}} />);

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });
});
