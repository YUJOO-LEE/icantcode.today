import { describe, it, expect, afterEach } from 'vitest';
import {
  colsForWidth,
  rowsForHeight,
  getViewport,
  measureCellWidth,
  resetCellWidthCache,
} from '../grid';

describe('grid', () => {
  describe('colsForWidth', () => {
    it('floors to integer cells', () => {
      expect(colsForWidth(100, 10)).toBe(10);
      expect(colsForWidth(105, 10)).toBe(10);
      expect(colsForWidth(99, 10)).toBe(9);
    });

    it('returns at least 1', () => {
      expect(colsForWidth(5, 10)).toBe(1);
      expect(colsForWidth(0, 10)).toBe(1);
    });

    it('returns 0 for invalid cell width', () => {
      expect(colsForWidth(100, 0)).toBe(0);
      expect(colsForWidth(100, -5)).toBe(0);
    });
  });

  describe('rowsForHeight', () => {
    it('floors to integer rows using ROW_HEIGHT_PX', () => {
      // ROW_HEIGHT_PX = 16 → 160px = 10 rows, 163px floors to 10.
      expect(rowsForHeight(160)).toBe(10);
      expect(rowsForHeight(163)).toBe(10);
    });

    it('accepts a custom row height', () => {
      expect(rowsForHeight(100, 20)).toBe(5);
    });

    it('returns at least 1', () => {
      expect(rowsForHeight(8)).toBe(1);
    });
  });

  describe('getViewport', () => {
    it('combines colsForWidth + rowsForHeight with explicit cell width', () => {
      // ROW_HEIGHT_PX = 16 → 640px = 40 rows.
      const v = getViewport(800, 640, 8);
      expect(v.cols).toBe(100);
      expect(v.rows).toBe(40);
    });

    it('falls back to measureCellWidth when cell width is omitted', () => {
      resetCellWidthCache();
      const v = getViewport(800, 640);
      expect(v.cols).toBeGreaterThan(0);
      expect(v.rows).toBe(40);
    });
  });

  describe('rowsForHeight (invalid input)', () => {
    it('returns 0 when rowHeightPx is 0', () => {
      expect(rowsForHeight(100, 0)).toBe(0);
    });

    it('returns 0 when rowHeightPx is negative', () => {
      expect(rowsForHeight(100, -16)).toBe(0);
    });
  });

  describe('measureCellWidth', () => {
    afterEach(() => {
      resetCellWidthCache();
    });

    it('returns a positive number in jsdom', () => {
      resetCellWidthCache();
      const width = measureCellWidth();
      expect(width).toBeGreaterThan(0);
    });

    it('returns the cached value on subsequent calls', () => {
      resetCellWidthCache();
      const first = measureCellWidth();
      const second = measureCellWidth();
      expect(second).toBe(first);
    });

    it('resetCellWidthCache forces recomputation', () => {
      resetCellWidthCache();
      const first = measureCellWidth();
      resetCellWidthCache();
      const second = measureCellWidth();
      // Same value because the probe behaves identically — but the second call
      // must have re-measured (i.e. not crashed) after the cache was cleared.
      expect(second).toBeGreaterThan(0);
      expect(second).toBe(first);
    });
  });
});
