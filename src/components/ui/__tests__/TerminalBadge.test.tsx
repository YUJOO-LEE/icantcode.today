import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TerminalBadge from '../TerminalBadge';

describe('TerminalBadge', () => {
  it('renders text in brackets', () => {
    render(<TerminalBadge variant="error">DOWN</TerminalBadge>);
    expect(screen.getByText('[DOWN]')).toBeInTheDocument();
  });

  it('renders success variant with primary color', () => {
    render(<TerminalBadge variant="success">OK</TerminalBadge>);
    const badge = screen.getByText('[OK]');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-primary');
  });

  it('renders error variant with destructive color', () => {
    render(<TerminalBadge variant="error">FAIL</TerminalBadge>);
    const badge = screen.getByText('[FAIL]');
    expect(badge.className).toContain('text-destructive');
  });

  it('renders warning variant with amber color', () => {
    render(<TerminalBadge variant="warning">WARN</TerminalBadge>);
    const badge = screen.getByText('[WARN]');
    expect(badge.className).toContain('text-amber-500');
  });

  it('renders info variant with foreground color', () => {
    render(<TerminalBadge variant="info">INFO</TerminalBadge>);
    const badge = screen.getByText('[INFO]');
    expect(badge.className).toContain('text-foreground');
  });
});
