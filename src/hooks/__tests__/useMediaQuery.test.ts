import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useMediaQuery } from '../useMediaQuery';

interface FakeMQL {
  matches: boolean;
  addEventListener: (type: string, cb: () => void) => void;
  removeEventListener: (type: string, cb: () => void) => void;
  fire: () => void;
}

function makeMatchMedia() {
  const registry = new Map<string, FakeMQL>();
  const factory = (query: string): FakeMQL => {
    if (!registry.has(query)) {
      const listeners = new Set<() => void>();
      registry.set(query, {
        matches: false,
        addEventListener: (_type, cb) => {
          listeners.add(cb);
        },
        removeEventListener: (_type, cb) => {
          listeners.delete(cb);
        },
        fire() {
          for (const cb of listeners) cb();
        },
      });
    }
    return registry.get(query)!;
  };
  return { factory, registry };
}

describe('useMediaQuery', () => {
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    } else {
      // @ts-expect-error allow unsetting in test cleanup
      delete window.matchMedia;
    }
  });

  it('returns the current media query match', () => {
    const { factory, registry } = makeMatchMedia();
    window.matchMedia = ((q: string) => factory(q)) as unknown as typeof window.matchMedia;
    registry.set(
      '(pointer: coarse)',
      Object.assign(factory('(pointer: coarse)'), { matches: true }),
    );
    const { result } = renderHook(() => useMediaQuery('(pointer: coarse)'));
    expect(result.current).toBe(true);
  });

  it('updates when the matchMedia change event fires', () => {
    const { factory } = makeMatchMedia();
    window.matchMedia = ((q: string) => factory(q)) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    const mql = factory('(min-width: 768px)');
    act(() => {
      mql.matches = true;
      mql.fire();
    });
    expect(result.current).toBe(true);
  });

  it('detaches the listener on unmount', () => {
    const { factory } = makeMatchMedia();
    const removeSpy = vi.fn();
    window.matchMedia = ((q: string) => {
      const real = factory(q);
      return { ...real, removeEventListener: removeSpy };
    }) as unknown as typeof window.matchMedia;

    const { unmount } = renderHook(() => useMediaQuery('(prefers-reduced-motion: reduce)'));
    unmount();
    expect(removeSpy).toHaveBeenCalled();
  });
});
