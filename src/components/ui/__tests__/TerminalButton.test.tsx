import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TerminalButton from '../TerminalButton';

describe('TerminalButton', () => {
  it('renders with label', () => {
    render(<TerminalButton>run</TerminalButton>);
    expect(screen.getByRole('button')).toHaveTextContent('run');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<TerminalButton onClick={onClick}>click me</TerminalButton>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is true', () => {
    render(<TerminalButton disabled>disabled</TerminalButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
