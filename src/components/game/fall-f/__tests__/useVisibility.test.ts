import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { usePageHidden } from '../useVisibility';

function setHidden(value: boolean) {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => value,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('usePageHidden', () => {
  afterEach(() => {
    setHidden(false);
  });

  it('returns false while the document is visible', () => {
    setHidden(false);
    const { result } = renderHook(() => usePageHidden());
    expect(result.current).toBe(false);
  });

  it('flips to true on visibilitychange when document.hidden becomes true', () => {
    setHidden(false);
    const { result } = renderHook(() => usePageHidden());
    expect(result.current).toBe(false);
    act(() => setHidden(true));
    expect(result.current).toBe(true);
  });

  it('flips back to false when document.hidden returns to false', () => {
    setHidden(true);
    const { result } = renderHook(() => usePageHidden());
    expect(result.current).toBe(true);
    act(() => setHidden(false));
    expect(result.current).toBe(false);
  });

  it('removes the visibilitychange listener on unmount', () => {
    const { unmount, result } = renderHook(() => usePageHidden());
    unmount();
    // After unmount the hook value freezes; further events must not throw.
    act(() => setHidden(true));
    // Re-mounting picks up the latest snapshot.
    const { result: result2 } = renderHook(() => usePageHidden());
    expect(result2.current).toBe(true);
    expect(result.current).toBe(false);
  });
});
