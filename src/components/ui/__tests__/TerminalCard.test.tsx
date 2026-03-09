import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TerminalCard from '../TerminalCard';

describe('TerminalCard', () => {
  it('renders children', () => {
    render(
      <TerminalCard>Test content</TerminalCard>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders as a box with border and no rounded corners', () => {
    const { container } = render(
      <TerminalCard>Content</TerminalCard>
    );
    const card = container.firstElementChild;
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('bg-card');
    expect(card).toHaveClass('p-4');
  });

  it('applies custom className', () => {
    const { container } = render(
      <TerminalCard className="mt-4">Content</TerminalCard>
    );
    expect(container.firstElementChild).toHaveClass('mt-4');
  });
});
