import type {
  AlternatingLine,
  FillRightLine,
  GrowRightLine,
  Line,
  PlatformSegment,
  ShiftingLine,
} from './types';
import { getSegments } from './segments';

const FILL_EMPTY = new Set([' ', '\t', '░']);

function renderGrowRight(line: GrowRightLine, ageSec: number, maxWidth?: number): string {
  const grown = Math.max(0, Math.floor(line.growPerSec * ageSec));
  const totalLen = line.initial.length + grown;
  const cap = maxWidth && maxWidth > 0 ? maxWidth : totalLen;
  if (totalLen <= cap) {
    return line.initial + line.growChar.repeat(grown);
  }
  const tailRoom = Math.max(0, cap - line.initial.length);
  return line.initial.slice(0, cap) + line.growChar.repeat(tailRoom);
}

function renderFillRight(line: FillRightLine, ageSec: number): string {
  const total = line.initial.length;
  if (total <= 2) return line.initial;
  const inner = total - 2;
  const period = Math.max(line.periodSec, 0.001);
  const phase = (((ageSec % period) + period) % period) / period; // 0..1
  // Triangular wave: starts full (wave=0), drains to empty (wave=1), refills.
  const wave = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
  const emptied = Math.min(inner, Math.round(wave * inner));
  const filledCount = inner - emptied;
  const head = line.initial.slice(0, 1);
  const tail = line.initial.slice(total - 1);
  return head + line.filled.repeat(filledCount) + line.empty.repeat(emptied) + tail;
}

function renderAlternating(line: AlternatingLine, ageSec: number, maxWidth?: number): string {
  // floor(ageSec / period) parity selects which pattern is current. ageSec=0
  // always starts on patternA, which is also the phase used by solvability
  // when validating spawn safety — so a freshly spawned alternating row is
  // always landable on patternA cells without any wait.
  const period = Math.max(line.periodSec, 0.001);
  const phaseIndex = Math.floor(Math.max(0, ageSec) / period) % 2;
  const text = phaseIndex === 0 ? line.patternA : line.patternB;
  if (maxWidth && maxWidth > 0 && text.length > maxWidth) {
    return text.slice(0, maxWidth);
  }
  return text;
}

function computeShiftOffset(line: ShiftingLine, ageSec: number, width: number): number {
  const patternLen = line.pattern.length;
  if (patternLen >= width) return 0;
  const range = width - patternLen;
  const period = Math.max(line.periodSec, 0.001);
  const stepIdx = Math.floor(Math.max(0, ageSec) / period);
  const cycleLen = Math.max(1, 2 * range);
  const cyclePos = ((stepIdx % cycleLen) + cycleLen) % cycleLen;
  const baseOffset = cyclePos <= range ? cyclePos : cycleLen - cyclePos;
  return line.initialDirection === 1 ? baseOffset : range - baseOffset;
}

function renderShifting(line: ShiftingLine, ageSec: number, maxWidth?: number): string {
  const patternLen = line.pattern.length;
  const width = maxWidth && maxWidth > 0 ? maxWidth : patternLen;
  if (patternLen >= width) return line.pattern.slice(0, width);
  const offset = computeShiftOffset(line, ageSec, width);
  const range = width - patternLen;
  return ' '.repeat(offset) + line.pattern + ' '.repeat(range - offset);
}

export function lineContentOffsetX(line: Line, ageSec: number, maxWidth?: number): number {
  if (line.kind !== 'shifting') return 0;
  const width = maxWidth && maxWidth > 0 ? maxWidth : line.pattern.length;
  return computeShiftOffset(line, ageSec, width);
}

export function renderLine(line: Line, ageSec: number, maxWidth?: number): string {
  switch (line.kind) {
    case 'static':
      return line.text;
    case 'grow-right':
      return renderGrowRight(line, ageSec, maxWidth);
    case 'fill-right':
      return renderFillRight(line, ageSec);
    case 'alternating':
      return renderAlternating(line, ageSec, maxWidth);
    case 'shifting':
      return renderShifting(line, ageSec, maxWidth);
  }
}

export function lineSegmentsAt(line: Line, ageSec: number, maxWidth?: number): PlatformSegment[] {
  const text = renderLine(line, ageSec, maxWidth);
  if (line.kind === 'fill-right') {
    return getSegments(text, FILL_EMPTY);
  }
  return getSegments(text);
}
