import type { PlatformSegment } from './types';

const DEFAULT_EMPTY = new Set<string>([' ', '\t']);

/**
 * Extract platform segments from a rendered line. A segment is a run of
 * non-empty characters; spaces (and any glyph in `emptyChars`) split runs.
 */
export function getSegments(text: string, emptyChars: Set<string> = DEFAULT_EMPTY): PlatformSegment[] {
  const segments: PlatformSegment[] = [];
  let runStart = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] ?? ' ';
    const isEmpty = emptyChars.has(ch);
    if (!isEmpty && runStart === -1) {
      runStart = i;
    } else if (isEmpty && runStart !== -1) {
      segments.push({ startX: runStart, endX: i - 1 });
      runStart = -1;
    }
  }
  if (runStart !== -1) {
    segments.push({ startX: runStart, endX: text.length - 1 });
  }
  return segments;
}

export function maxLineWidth(text: string): number {
  return text.trimEnd().length;
}

export function unionSegments(segs: PlatformSegment[][]): PlatformSegment[] {
  const flat = segs.flat().slice().sort((a, b) => a.startX - b.startX);
  const merged: PlatformSegment[] = [];
  for (const seg of flat) {
    const last = merged[merged.length - 1];
    if (last && seg.startX <= last.endX + 1) {
      last.endX = Math.max(last.endX, seg.endX);
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

/** Minimum gap (in cells) between two non-overlapping segment lists. 0 if overlap. */
export function minGapBetween(a: PlatformSegment[], b: PlatformSegment[]): number {
  if (a.length === 0 || b.length === 0) return Infinity;
  let best = Infinity;
  for (const sa of a) {
    for (const sb of b) {
      if (sa.endX >= sb.startX && sb.endX >= sa.startX) return 0;
      const gap = sa.endX < sb.startX ? sb.startX - sa.endX - 1 : sa.startX - sb.endX - 1;
      if (gap < best) best = gap;
    }
  }
  return best;
}
