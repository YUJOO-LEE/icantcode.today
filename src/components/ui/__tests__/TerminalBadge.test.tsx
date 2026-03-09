import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TerminalBadge from '../TerminalBadge';

describe('TerminalBadge', () => {
  it('renders with bracket notation', () => {
    render(<TerminalBadge variant="error">DOWN</TerminalBadge>);
    expect(screen.getByText('[DOWN]')).toBeInTheDocument();
  });

  it('renders success variant', () => {
    render(<TerminalBadge variant="success">OK</TerminalBadge>);
    expect(screen.getByText('[OK]')).toBeInTheDocument();
  });
});
