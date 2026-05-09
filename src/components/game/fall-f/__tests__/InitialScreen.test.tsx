import type { ComponentProps } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createTestWrapper } from '@/tests/wrappers';
import InitialScreen from '../InitialScreen';

function renderScreen(props: Partial<ComponentProps<typeof InitialScreen>> = {}) {
  const onStart = props.onStart ?? vi.fn();
  const { Wrapper } = createTestWrapper({ withI18n: true });
  const view = render(
    <InitialScreen best={props.best ?? 0} hasBest={props.hasBest ?? false} onStart={onStart} />,
    { wrapper: Wrapper },
  );
  return { ...view, onStart };
}

describe('InitialScreen', () => {
  it('renders the fall -f prompt and movement keys', () => {
    renderScreen();
    expect(screen.getByText('$ fall -f')).toBeInTheDocument();
    expect(screen.getByText(/follow the fall/)).toBeInTheDocument();
    expect(screen.getByText(/←\/→/)).toBeInTheDocument();
    expect(screen.getByText('[TIMEOUT]')).toBeInTheDocument();
    expect(screen.getByText('[SEGFAULT]')).toBeInTheDocument();
  });

  it('hides best row when no session record', () => {
    renderScreen({ hasBest: false, best: 0 });
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('shows best row when there is a session record', () => {
    renderScreen({ hasBest: true, best: 42 });
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('triggers onStart when Enter is pressed', () => {
    const { onStart } = renderScreen();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('ignores non-Enter keys', () => {
    const { onStart } = renderScreen();
    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onStart).not.toHaveBeenCalled();
  });

  it('renders the mobile $ start button when pointer is coarse', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: q === '(pointer: coarse)',
      media: q,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    try {
      const { onStart } = renderScreen();
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(onStart).toHaveBeenCalledOnce();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
