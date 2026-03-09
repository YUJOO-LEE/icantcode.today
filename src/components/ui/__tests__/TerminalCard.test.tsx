import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TerminalCard from '../TerminalCard';

describe('TerminalCard', () => {
  it('renders children', () => {
    render(
      <TerminalCard>
        <TerminalCard.Body>Test content</TerminalCard.Body>
      </TerminalCard>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders box-drawing characters as aria-hidden', () => {
    const { container } = render(
      <TerminalCard>
        <TerminalCard.Body>Content</TerminalCard.Body>
      </TerminalCard>
    );
    const hiddenChars = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenChars.length).toBeGreaterThanOrEqual(4);
  });

  it('renders compound components', () => {
    render(
      <TerminalCard>
        <TerminalCard.Header>Header</TerminalCard.Header>
        <TerminalCard.Divider />
        <TerminalCard.Body>Body</TerminalCard.Body>
        <TerminalCard.Divider />
        <TerminalCard.Footer>Footer</TerminalCard.Footer>
      </TerminalCard>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
