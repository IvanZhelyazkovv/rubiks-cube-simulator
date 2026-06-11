import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SequenceInput } from './SequenceInput';

describe('SequenceInput', () => {
  it('applies a valid sequence and clears the input', async () => {
    const onApply = vi.fn();
    render(<SequenceInput disabled={false} onApply={onApply} />);

    const input = screen.getByLabelText('Move sequence');
    await userEvent.type(input, "F R' U2");
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onApply).toHaveBeenCalledWith("F R' U2");
    expect(input).toHaveValue('');
  });

  it('submits on Enter', async () => {
    const onApply = vi.fn();
    render(<SequenceInput disabled={false} onApply={onApply} />);

    await userEvent.type(screen.getByLabelText('Move sequence'), 'F{Enter}');

    expect(onApply).toHaveBeenCalledWith('F');
  });

  it('flags invalid notation and blocks applying it', async () => {
    const onApply = vi.fn();
    render(<SequenceInput disabled={false} onApply={onApply} />);

    await userEvent.type(screen.getByLabelText('Move sequence'), 'F X');

    expect(screen.getByRole('alert')).toHaveTextContent("Unexpected 'X'");
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Move sequence'), '{Enter}');
    expect(onApply).not.toHaveBeenCalled();
  });

  it('is fully disabled while busy', () => {
    render(<SequenceInput disabled onApply={() => {}} />);

    expect(screen.getByLabelText('Move sequence')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });
});
