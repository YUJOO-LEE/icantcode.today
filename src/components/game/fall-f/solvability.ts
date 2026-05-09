import { PRESSURE_GROUP_RATIO, SOLVABILITY } from './constants';
import { STATIC_GROUPS, DYNAMIC_GROUPS, ALL_GROUPS } from './linePool';
import type { LineGroup, PlatformSegment } from './types';
import { getSegments, maxLineWidth, unionSegments, minGapBetween } from './segments';
import { defaultRNG, type RNG } from './rng';

const FILL_EMPTY = new Set([' ', '\t', '░']);

function lineRenderedText(line: LineGroup['lines'][number]): string {
  if (line.kind === 'static') return line.text;
  return line.initial;
}

function lineSegments(line: LineGroup['lines'][number]): PlatformSegment[] {
  if (line.kind === 'fill-right') {
    return getSegments(line.initial, FILL_EMPTY);
  }
  return getSegments(lineRenderedText(line));
}

export function groupSegments(group: LineGroup): PlatformSegment[] {
  return unionSegments(group.lines.map(lineSegments));
}

export function groupMaxLineWidth(group: LineGroup): number {
  let best = 0;
  for (const line of group.lines) {
    const w = maxLineWidth(lineRenderedText(line));
    if (w > best) best = w;
  }
  return best;
}

export interface PickContext {
  recentGroups: LineGroup[];
  cols: number;
  /**
   * Set true for the very first pick of a run. Filters candidates to those
   * with at least one platform segment within the player's reach from the
   * center spawn (≈30 cells of horizontal travel during the fall).
   */
  firstPick?: boolean;
}

const FIRST_PICK_REACH_CELLS = 30;

function isReachableFromSpawn(group: LineGroup, cols: number): boolean {
  const center = Math.floor(cols / 2);
  const lo = center - FIRST_PICK_REACH_CELLS;
  const hi = center + FIRST_PICK_REACH_CELLS;
  for (const seg of groupSegments(group)) {
    if (seg.endX >= lo && seg.startX <= hi) return true;
  }
  return false;
}

function isShortGroup(group: LineGroup, cols: number): boolean {
  const threshold = SOLVABILITY.shortLineRatio * cols;
  return groupMaxLineWidth(group) <= threshold;
}

function passesR1(candidate: LineGroup, ctx: PickContext): boolean {
  const { recentGroups, cols } = ctx;
  if (recentGroups.length < SOLVABILITY.shortLineRunCap) return true;
  const window = recentGroups.slice(-SOLVABILITY.shortLineRunCap);
  const allShort = window.every((g) => isShortGroup(g, cols));
  if (!allShort) return true;
  return !isShortGroup(candidate, cols);
}

function passesR2(candidate: LineGroup, ctx: PickContext): boolean {
  const prev = ctx.recentGroups[ctx.recentGroups.length - 1];
  if (!prev) return true;
  const prevSegs = groupSegments(prev);
  const candSegs = groupSegments(candidate);
  if (prevSegs.length === 0 || candSegs.length === 0) return true;
  const gap = minGapBetween(prevSegs, candSegs);
  return gap <= SOLVABILITY.adjacencyMaxGapCells;
}

export function pickNextGroup(ctx: PickContext, rng: RNG = defaultRNG): LineGroup {
  const usePressure =
    !ctx.firstPick && rng() < PRESSURE_GROUP_RATIO && DYNAMIC_GROUPS.length > 0;
  const primary = usePressure ? DYNAMIC_GROUPS : STATIC_GROUPS;

  const passes = (candidate: LineGroup) =>
    passesR1(candidate, ctx) &&
    passesR2(candidate, ctx) &&
    (!ctx.firstPick || isReachableFromSpawn(candidate, ctx.cols));

  for (const candidate of shuffle(primary, rng)) {
    if (passes(candidate)) return candidate;
  }
  const secondary = usePressure ? STATIC_GROUPS : DYNAMIC_GROUPS;
  for (const candidate of shuffle(secondary, rng)) {
    if (passes(candidate)) return candidate;
  }
  // Last-resort fallback. Drop firstPick reachability constraint to avoid
  // soft-locking when the pool is unusually narrow at small cols.
  for (const candidate of shuffle(ALL_GROUPS, rng)) {
    if (passesR1(candidate, ctx)) return candidate;
  }
  return ALL_GROUPS[0]!;
}

function shuffle<T>(items: readonly T[], rng: RNG): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j] as T, arr[i] as T];
  }
  return arr;
}
