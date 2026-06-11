import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MovePad } from './MovePad';

describe('MovePad', () => {
  it('offers all eighteen face turns', () => {
    render(<MovePad disabled={false} onMove={() => {}} />);

    for (const letter of ['U', 'D', 'F', 'B', 'L', 'R']) {
      for (const modifier of ['', "'", '2']) {
        expect(screen.getByRole('button', { name: letter + modifier })).toBeInTheDocument();
      }
    }
  });

  it('reports the clicked move in notation', async () => {
    const onMove = vi.fn();
    render(<MovePad disabled={false} onMove={onMove} />);

    await userEvent.click(screen.getByRole('button', { name: "R'" }));

    expect(onMove).toHaveBeenCalledWith("R'");
  });

  it('disables every button while busy', () => {
    render(<MovePad disabled onMove={() => {}} />);

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });
});
