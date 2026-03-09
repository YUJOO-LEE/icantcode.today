import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import TerminalInput from '../TerminalInput';

describe('TerminalInput', () => {
  it('renders with default prompt', () => {
    render(<TerminalInput placeholder="type here" />);
    expect(screen.getByPlaceholderText('type here')).toBeInTheDocument();
  });

  it('renders custom prompt symbol', () => {
    const { container } = render(<TerminalInput prompt="$" />);
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('$');
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<TerminalInput placeholder="type" />);
    const input = screen.getByPlaceholderText('type');
    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });
});
