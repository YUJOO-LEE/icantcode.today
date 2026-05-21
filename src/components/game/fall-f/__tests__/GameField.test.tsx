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
    contentOffsetX: 0,
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

  it('renders the line-number gutter for gap rows too (terminals number every line)', () => {
    const state = makeState({
      rows: [
        makeRow({ id: 'r1', text: 'first', lineNumber: 1, topRow: 0 }),
        makeRow({ id: 'gap', groupId: '__gap', text: '', lineNumber: 2, topRow: 1 }),
        makeRow({ id: 'r3', text: 'third', lineNumber: 3, topRow: 2 }),
      ],
    });
    render(<GameField state={state} />, { wrapper: Wrapper });
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('still skips the gutter when a row has lineNumber === 0 (defensive guard)', () => {
    const state = makeState({
      rows: [makeRow({ id: 'r0', text: 'zero', lineNumber: 0, topRow: 0 })],
    });
    render(<GameField state={state} />, { wrapper: Wrapper });
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });

  it('paints the left edge with the destructive color when the player is at x=0', () => {
    const state = makeState({
      player: {
        x: 0,
        y: 0,
        falling: false,
        input: 'none',
        velocityY: 0,
        fellAtMs: null,
        groundY: 0,
        dashRemainingMs: 0,
        dashCooldownMs: 0,
        dashDirection: null,
      },
    });
    const { container } = render(<GameField state={state} />, { wrapper: Wrapper });
    const edge = container.querySelector('[aria-hidden="true"].pointer-events-none.absolute.inset-y-0');
    expect(edge?.className).toContain('bg-destructive');
  });

  it('paints the left edge with the border color when the player is not at x=0', () => {
    const state = makeState({
      player: {
        x: 4,
        y: 0,
        falling: false,
        input: 'none',
        velocityY: 0,
        fellAtMs: null,
        groundY: 0,
        dashRemainingMs: 0,
        dashCooldownMs: 0,
        dashDirection: null,
      },
    });
    const { container } = render(<GameField state={state} />, { wrapper: Wrapper });
    const edge = container.querySelector('[aria-hidden="true"].pointer-events-none.absolute.inset-y-0');
    expect(edge?.className).toContain('bg-border');
  });

  it('forwards the ref to the field root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<GameField ref={ref} state={makeState()} />, { wrapper: Wrapper });
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getAttribute('role')).toBe('application');
  });

  it('uses muted color for line numbers when no level-up is active', () => {
    const state = makeState({
      elapsedMs: 5_000,
      level: 0,
      levelUpAtMs: 0,
      rows: [makeRow({ id: 'r1', text: 'hello', lineNumber: 1, topRow: 0 })],
    });
    render(<GameField state={state} />, { wrapper: Wrapper });
    const [first] = screen.getAllByTestId('ff-line-number');
    expect(first!.className).toContain('text-muted-foreground/70');
    expect(first!.className).not.toContain('text-primary');
  });

  it('pulses line numbers to primary during the FX window after a level-up', () => {
    // 200 ms after the stamp; well inside LEVEL_UP_FX_DURATION_MS = 1000.
    const state = makeState({
      elapsedMs: 10_200,
      level: 1,
      levelUpAtMs: 10_000,
      rows: [makeRow({ id: 'r1', text: 'hello', lineNumber: 1, topRow: 0 })],
    });
    render(<GameField state={state} />, { wrapper: Wrapper });
    const [first] = screen.getAllByTestId('ff-line-number');
    expect(first!.className).toContain('text-primary');
  });

  it('restores muted line-number color after the FX window expires', () => {
    // 1500 ms after the stamp; outside the FX window.
    const state = makeState({
      elapsedMs: 11_500,
      level: 1,
      levelUpAtMs: 10_000,
      rows: [makeRow({ id: 'r1', text: 'hello', lineNumber: 1, topRow: 0 })],
    });
    render(<GameField state={state} />, { wrapper: Wrapper });
    const [first] = screen.getAllByTestId('ff-line-number');
    expect(first!.className).toContain('text-muted-foreground/70');
    expect(first!.className).not.toContain('text-primary');
  });

  it('tints the HUD score with primary during level-up and keeps left edge border color', () => {
    const state = makeState({
      elapsedMs: 10_200,
      level: 1,
      levelUpAtMs: 10_000,
      player: {
        x: 4,
        y: 0,
        falling: false,
        input: 'none',
        velocityY: 0,
        fellAtMs: null,
        groundY: 0,
        dashRemainingMs: 0,
        dashCooldownMs: 0,
        dashDirection: null,
      },
      rows: [makeRow({ id: 'r1', text: 'hello', lineNumber: 1, topRow: 0 })],
    });
    render(<GameField state={state} />, { wrapper: Wrapper });
    // Left edge stays bg-border during level-up (no more primary/60 tint).
    expect(screen.getByTestId('ff-left-edge').className).toContain('bg-border');
    expect(screen.getByTestId('ff-left-edge').className).not.toContain('bg-primary');
    // HUD score wrapper should carry text-primary, not text-muted-foreground.
    expect(screen.getByTestId('ff-hud-score').className).toContain('text-primary');
  });

  it('keeps the destructive left edge during level-up when the player is at x=0', () => {
    const state = makeState({
      elapsedMs: 10_200,
      level: 1,
      levelUpAtMs: 10_000,
      player: {
        x: 0,
        y: 0,
        falling: false,
        input: 'none',
        velocityY: 0,
        fellAtMs: null,
        groundY: 0,
        dashRemainingMs: 0,
        dashCooldownMs: 0,
        dashDirection: null,
      },
    });
    render(<GameField state={state} />, { wrapper: Wrapper });
    expect(screen.getByTestId('ff-left-edge').className).toContain('bg-destructive');
  });

  it('renders explosions, telegraphs, and projectiles from state', () => {
    const state = makeState({
      explosions: [{ id: 'e-1', x: 5, y: 4, remainingMs: 200 }],
      telegraphs: [{ id: 't-1', y: 3, remainingMs: 200, velocityX: -20 }],
      projectiles: [{ id: 'p-1', x: 10, y: 5, velocityX: -20, glyph: '◄' }],
    });
    render(<GameField state={state} />, { wrapper: Wrapper });
    expect(screen.getByTestId('ff-explosion')).toBeInTheDocument();
    expect(screen.getByTestId('ff-telegraph')).toBeInTheDocument();
    expect(screen.getByTestId('ff-projectile')).toBeInTheDocument();
  });
});
