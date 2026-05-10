import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { createRef, type ReactNode } from 'react';
import i18n from '@/lib/i18n';
import GameField from '../GameField';
import { makeInitialState } from '../gameState';
import type { GameState, ScreenRow } from '../types';
import { ROW_HEIGHT_PX } from '../constants';

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  const base = makeInitialState({ rows: 25, cols: 80 });
  return { ...base, status: 'playing', ...overrides };
}

function makeRow(overrides: Partial<ScreenRow> = {}): ScreenRow {
  return {
    id: 'row-1',
    groupId: 'group-a',
    isLastOfGroup: true,
    lineIndex: 0,
    lineNumber: 1,
    source: null,
    text: 'sample line',
    segments: [],
    topRow: 0,
    ageSec: 0,
    ...overrides,
  };
}

describe('GameField', () => {
  it('renders as an `application` region with the supplied aria-label', () => {
    render(<GameField state={makeState()} ariaLabel="fall -f game" />, { wrapper: Wrapper });
    const region = screen.getByRole('application', { name: 'fall -f game' });
    expect(region).toBeInTheDocument();
  });

  it('reports the current score in the HUD', () => {
    render(<GameField state={makeState({ score: 42 })} />, { wrapper: Wrapper });
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('sets field height to viewport.rows × ROW_HEIGHT_PX', () => {
    render(<GameField state={makeState({ viewport: { rows: 10, cols: 80 } })} />, {
      wrapper: Wrapper,
    });
    const region = screen.getByRole('application');
    expect(region.getAttribute('style') ?? '').toContain(`height: ${10 * ROW_HEIGHT_PX}px`);
  });

  it('renders each row text and its line number gutter when lineNumber > 0', () => {
    const state = makeState({
      rows: [
        makeRow({ id: 'r1', text: 'first', lineNumber: 1, topRow: 0 }),
        makeRow({ id: 'r2', text: 'second', lineNumber: 2, topRow: 1 }),
      ],
    });
    render(<GameField state={state} />, { wrapper: Wrapper });
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('omits the line-number gutter for gap rows (lineNumber === 0)', () => {
    const state = makeState({
      rows: [makeRow({ id: 'gap', groupId: '__gap', text: '', lineNumber: 0, topRow: 0 })],
    });
    render(<GameField state={state} />, { wrapper: Wrapper });
    // No "0" line number rendered (gap rows omit the gutter entirely).
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });

  it('paints the left edge with the destructive color when the player is at x=0', () => {
    const state = makeState({
      player: { x: 0, y: 0, falling: false, input: 'none' },
    });
    const { container } = render(<GameField state={state} />, { wrapper: Wrapper });
    const edge = container.querySelector('[aria-hidden="true"].pointer-events-none.absolute.inset-y-0');
    expect(edge?.className).toContain('bg-destructive');
  });

  it('paints the left edge with the border color when the player is not at x=0', () => {
    const state = makeState({
      player: { x: 4, y: 0, falling: false, input: 'none' },
    });
    const { container } = render(<GameField state={state} />, { wrapper: Wrapper });
    const edge = container.querySelector('[aria-hidden="true"].pointer-events-none.absolute.inset-y-0');
    expect(edge?.className).toContain('bg-border');
  });

  it('renders the player with the segfault glyph when status is dead-segfault', () => {
    const state = makeState({ status: 'dead-segfault' });
    const { container } = render(<GameField state={state} />, { wrapper: Wrapper });
    expect(container.textContent).toContain('*');
  });

  it('renders the player with the timeout glyph when status is dead-timeout', () => {
    const state = makeState({ status: 'dead-timeout' });
    const { container } = render(<GameField state={state} />, { wrapper: Wrapper });
    expect(container.textContent).toContain('x');
  });

  it('forwards the ref to the field root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<GameField ref={ref} state={makeState()} />, { wrapper: Wrapper });
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getAttribute('role')).toBe('application');
  });
});
