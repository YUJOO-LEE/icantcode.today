import type { Line, FillRightLine, GrowRightLine, PlatformSegment } from './types';
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

export function renderLine(line: Line, ageSec: number, maxWidth?: number): string {
  switch (line.kind) {
    case 'static':
      return line.text;
    case 'grow-right':
      return renderGrowRight(line, ageSec, maxWidth);
    case 'fill-right':
      return renderFillRight(line, ageSec);
  }
}

export function lineSegmentsAt(line: Line, ageSec: number, maxWidth?: number): PlatformSegment[] {
  const text = renderLine(line, ageSec, maxWidth);
  if (line.kind === 'fill-right') {
    return getSegments(text, FILL_EMPTY);
  }
  return getSegments(text);
}
