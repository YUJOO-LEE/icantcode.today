import { ROW_HEIGHT_PX } from './constants';

const FALLBACK_CELL_WIDTH_PX = 8;

let cachedCellWidth = 0;

export function colsForWidth(widthPx: number, cellWidthPx: number): number {
  if (cellWidthPx <= 0) return 0;
  return Math.max(1, Math.floor(widthPx / cellWidthPx));
}

export function rowsForHeight(heightPx: number, rowHeightPx: number = ROW_HEIGHT_PX): number {
  if (rowHeightPx <= 0) return 0;
  return Math.max(1, Math.floor(heightPx / rowHeightPx));
}

export function measureCellWidth(): number {
  if (cachedCellWidth > 0) return cachedCellWidth;
  if (typeof document === 'undefined') return FALLBACK_CELL_WIDTH_PX;
  const probe = document.createElement('span');
  probe.textContent = 'M'.repeat(50);
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.fontFamily = 'inherit';
  probe.style.fontSize = 'inherit';
  probe.style.whiteSpace = 'pre';
  probe.style.left = '-9999px';
  document.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width / 50;
  document.body.removeChild(probe);
  cachedCellWidth = width > 0 ? width : FALLBACK_CELL_WIDTH_PX;
  return cachedCellWidth;
}

export function resetCellWidthCache(): void {
  cachedCellWidth = 0;
}

export interface ViewportSize {
  rows: number;
  cols: number;
}

export function getViewport(widthPx: number, heightPx: number, cellWidthPx?: number): ViewportSize {
  const cell = cellWidthPx ?? measureCellWidth();
  return {
    cols: colsForWidth(widthPx, cell),
    rows: rowsForHeight(heightPx, ROW_HEIGHT_PX),
  };
}
