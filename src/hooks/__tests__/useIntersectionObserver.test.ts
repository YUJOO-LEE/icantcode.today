import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useIntersectionObserver } from '../useIntersectionObserver';

let observeMock: ReturnType<typeof vi.fn>;
let disconnectMock: ReturnType<typeof vi.fn>;
let observerCallback: IntersectionObserverCallback;

beforeEach(() => {
  observeMock = vi.fn();
  disconnectMock = vi.fn();

  class MockIntersectionObserver {
    observe = observeMock;
    unobserve = vi.fn();
    disconnect = disconnectMock;
    constructor(callback: IntersectionObserverCallback) {
      observerCallback = callback;
    }
  }

  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

describe('useIntersectionObserver', () => {
  it('returns a callback ref function', () => {
    const onIntersect = vi.fn();
    const { result } = renderHook(() => useIntersectionObserver(onIntersect));
    expect(typeof result.current).toBe('function');
  });

  it('creates observer when node is provided', () => {
    const onIntersect = vi.fn();
    const { result } = renderHook(() => useIntersectionObserver(onIntersect));

    const div = document.createElement('div');
    act(() => {
      result.current(div);
    });

    expect(observeMock).toHaveBeenCalledWith(div);
  });

  it('calls onIntersect when element is intersecting', () => {
    const onIntersect = vi.fn();
    const { result } = renderHook(() => useIntersectionObserver(onIntersect));

    const div = document.createElement('div');
    act(() => {
      result.current(div);
    });

    observerCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(onIntersect).toHaveBeenCalled();
  });

  it('does not call onIntersect when not intersecting', () => {
    const onIntersect = vi.fn();
    const { result } = renderHook(() => useIntersectionObserver(onIntersect));

    const div = document.createElement('div');
    act(() => {
      result.current(div);
    });

    observerCallback(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(onIntersect).not.toHaveBeenCalled();
  });

  it('does not create observer when enabled is false', () => {
    const onIntersect = vi.fn();
    const { result } = renderHook(() =>
      useIntersectionObserver(onIntersect, { enabled: false }),
    );

    const div = document.createElement('div');
    act(() => {
      result.current(div);
    });

    expect(observeMock).not.toHaveBeenCalled();
  });

  it('disconnects previous observer when node changes', () => {
    const onIntersect = vi.fn();
    const { result } = renderHook(() => useIntersectionObserver(onIntersect));

    const div1 = document.createElement('div');
    act(() => {
      result.current(div1);
    });
    expect(observeMock).toHaveBeenCalledTimes(1);

    const div2 = document.createElement('div');
    act(() => {
      result.current(div2);
    });
    expect(disconnectMock).toHaveBeenCalled();
    expect(observeMock).toHaveBeenCalledTimes(2);
  });

  it('disconnects observer when node is removed (null)', () => {
    const onIntersect = vi.fn();
    const { result } = renderHook(() => useIntersectionObserver(onIntersect));

    const div = document.createElement('div');
    act(() => {
      result.current(div);
    });

    act(() => {
      result.current(null);
    });
    expect(disconnectMock).toHaveBeenCalled();
  });

  it('uses latest onIntersect without re-creating observer', () => {
    const onIntersect1 = vi.fn();
    const onIntersect2 = vi.fn();
    const { result, rerender } = renderHook(
      ({ cb }) => useIntersectionObserver(cb),
      { initialProps: { cb: onIntersect1 } },
    );

    const div = document.createElement('div');
    act(() => {
      result.current(div);
    });

    rerender({ cb: onIntersect2 });

    observerCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(onIntersect1).not.toHaveBeenCalled();
    expect(onIntersect2).toHaveBeenCalled();
  });
});
