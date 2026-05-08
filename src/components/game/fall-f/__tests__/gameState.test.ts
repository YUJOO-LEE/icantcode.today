import { describe, it, expect } from 'vitest';
import {
  currentLinesPerSec,
  makeInitialState,
  startNewRun,
  tickGameState,
  setPlayerInput,
} from '../gameState';
import { mulberry32 } from '../rng';

const VIEWPORT = { rows: 25, cols: 80 };

describe('currentLinesPerSec', () => {
  it('returns phase 1 rate near start', () => {
    expect(currentLinesPerSec(0)).toBe(1.0);
  });
  it('returns phase 2 rate after 20s', () => {
    expect(currentLinesPerSec(30_000)).toBe(1.3);
  });
  it('returns phase 3 rate after 60s', () => {
    expect(currentLinesPerSec(120_000)).toBe(1.6);
  });
});

describe('tickGameState', () => {
  it('returns same state when not playing', () => {
    const state = makeInitialState(VIEWPORT);
    const next = tickGameState(state, 16);
    expect(next).toBe(state);
  });

  it('advances elapsedMs while playing', () => {
    const state = startNewRun(makeInitialState(VIEWPORT), 0);
    const next = tickGameState(state, 16, mulberry32(1));
    expect(next.elapsedMs).toBe(16);
  });

  it('eventually spawns the first row after the grace period', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    const rng = mulberry32(2);
    for (let i = 0; i < 60; i++) state = tickGameState(state, 16, rng);
    expect(state.rows.length).toBeGreaterThan(0);
  });

  it('detects timeout when player y goes above 0', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    state = { ...state, player: { ...state.player, y: -1, falling: false } };
    state = tickGameState(state, 16, mulberry32(3));
    expect(state.status).toBe('dead-timeout');
  });

  it('detects segfault when player y exceeds rows', () => {
    let state = startNewRun(makeInitialState(VIEWPORT), 0);
    state = {
      ...state,
      player: { ...state.player, y: VIEWPORT.rows + 1, falling: true },
    };
    state = tickGameState(state, 16, mulberry32(4));
    expect(state.status).toBe('dead-segfault');
  });
});

describe('setPlayerInput', () => {
  it('updates player input without changing other fields', () => {
    const state = startNewRun(makeInitialState(VIEWPORT), 0);
    const next = setPlayerInput(state, 'left');
    expect(next.player.input).toBe('left');
    expect(next.elapsedMs).toBe(state.elapsedMs);
  });

  it('returns same state when input is unchanged', () => {
    const state = makeInitialState(VIEWPORT);
    expect(setPlayerInput(state, 'none')).toBe(state);
  });
});
