import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Toolbar, type ToolbarProps } from './Toolbar';

function renderToolbar(overrides: Partial<ToolbarProps> = {}) {
  const props: ToolbarProps = {
    size: 3,
    busy: false,
    canUndo: true,
    onChangeSize: vi.fn(),
    onRunTaskSequence: vi.fn(),
    onScramble: vi.fn(),
    onUndo: vi.fn(),
    onRewind: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };
  render(<Toolbar {...props} />);
  return props;
}

describe('Toolbar', () => {
  it('offers every session action', () => {
    renderToolbar();

    expect(screen.getByRole('button', { name: "Run F R' U B' L D'" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scramble' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rewind' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /size/i })).toBeInTheDocument();
  });

  it('fires the matching callback per button', async () => {
    const props = renderToolbar();

    await userEvent.click(screen.getByRole('button', { name: 'Scramble' }));
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Rewind' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(props.onScramble).toHaveBeenCalledTimes(1);
    expect(props.onUndo).toHaveBeenCalledTimes(1);
    expect(props.onRewind).toHaveBeenCalledTimes(1);
    expect(props.onReset).toHaveBeenCalledTimes(1);
  });

  it('reports a numeric size on selection and marks the active size', async () => {
    const props = renderToolbar();

    expect(screen.getByRole('button', { name: '3×3' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: '4×4' }));

    expect(props.onChangeSize).toHaveBeenCalledWith(4);
  });

  it('ignores a click on the size that is already active', async () => {
    const props = renderToolbar();

    await userEvent.click(screen.getByRole('button', { name: '3×3' }));

    expect(props.onChangeSize).not.toHaveBeenCalled();
  });

  it('disables undo and rewind when there is no history', () => {
    renderToolbar({ canUndo: false });

    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rewind' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeEnabled();
  });

  it('disables everything while busy', () => {
    renderToolbar({ busy: true });

    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });
});
