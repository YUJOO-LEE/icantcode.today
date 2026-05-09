import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useRef, type RefObject } from 'react';
import { useTouchControls } from '../useTouchControls';
import type { InputState } from '../types';

interface MockTouch {
  clientX: number;
}

/**
 * Build a synthetic TouchEvent. jsdom doesn't expose `Touch` / `TouchEvent`
 * constructors reliably, so dispatch a plain Event with the touches list
 * monkey-patched on. The hook only reads `e.touches` and calls `e.preventDefault`.
 */
function dispatchTouch(target: HTMLElement, type: string, touches: MockTouch[]) {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'touches', { value: touches, configurable: true });
  const spy = vi.spyOn(ev, 'preventDefault');
  target.dispatchEvent(ev);
  return spy;
}

function setRect(el: HTMLElement, rect: { left: number; width: number }) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    left: rect.left,
    width: rect.width,
    top: 0,
    height: 100,
    right: rect.left + rect.width,
    bottom: 100,
    x: rect.left,
    y: 0,
    toJSON: () => ({}),
  });
}

function setupRefHook(enabled: boolean, onInput: Mock<(next: InputState) => void>) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  setRect(el, { left: 0, width: 100 });
  const refResult = renderHook(() => {
    const ref = useRef<HTMLElement | null>(el);
    useTouchControls({ enabled, containerRef: ref as RefObject<HTMLElement | null>, onInput });
    return ref;
  });
  return { el, refResult };
}

describe('useTouchControls', () => {
  let onInput: Mock<(next: InputState) => void>;

  beforeEach(() => {
    onInput = vi.fn<(next: InputState) => void>();
  });

  it('does not bind listeners when enabled=false', () => {
    const { el } = setupRefHook(false, onInput);
    dispatchTouch(el, 'touchstart', [{ clientX: 10 }]);
    expect(onInput).not.toHaveBeenCalled();
  });

  it('does not throw or fire when containerRef.current is null', () => {
    const onInput2 = vi.fn<(next: InputState) => void>();
    expect(() =>
      renderHook(() => {
        const ref = useRef<HTMLElement | null>(null);
        useTouchControls({ enabled: true, containerRef: ref, onInput: onInput2 });
      }),
    ).not.toThrow();
    expect(onInput2).not.toHaveBeenCalled();
  });

  it('emits "left" when a single touch lands in the left half', () => {
    const { el } = setupRefHook(true, onInput);
    dispatchTouch(el, 'touchstart', [{ clientX: 25 }]);
    expect(onInput).toHaveBeenLastCalledWith('left');
  });

  it('emits "right" when a single touch lands in the right half', () => {
    const { el } = setupRefHook(true, onInput);
    dispatchTouch(el, 'touchstart', [{ clientX: 75 }]);
    expect(onInput).toHaveBeenLastCalledWith('right');
  });

  it('emits "both" with one touch in each half', () => {
    const { el } = setupRefHook(true, onInput);
    dispatchTouch(el, 'touchstart', [{ clientX: 25 }, { clientX: 75 }]);
    expect(onInput).toHaveBeenLastCalledWith('both');
  });

  it('emits "none" on touchend with no remaining touches', () => {
    const { el } = setupRefHook(true, onInput);
    dispatchTouch(el, 'touchstart', [{ clientX: 25 }]);
    expect(onInput).toHaveBeenLastCalledWith('left');
    dispatchTouch(el, 'touchend', []);
    expect(onInput).toHaveBeenLastCalledWith('none');
  });

  it('updates as touches move across the midline', () => {
    const { el } = setupRefHook(true, onInput);
    dispatchTouch(el, 'touchstart', [{ clientX: 25 }]);
    expect(onInput).toHaveBeenLastCalledWith('left');
    dispatchTouch(el, 'touchmove', [{ clientX: 75 }]);
    expect(onInput).toHaveBeenLastCalledWith('right');
  });

  it('uses the container midline (rect.left + width/2), not viewport midline', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    setRect(el, { left: 200, width: 100 }); // midline at clientX=250
    const ref = { current: el } as RefObject<HTMLElement | null>;
    renderHook(() => useTouchControls({ enabled: true, containerRef: ref, onInput }));
    // clientX=240 is left of midline=250, so "left" even though screen-relatively close to right.
    dispatchTouch(el, 'touchstart', [{ clientX: 240 }]);
    expect(onInput).toHaveBeenLastCalledWith('left');
    dispatchTouch(el, 'touchmove', [{ clientX: 260 }]);
    expect(onInput).toHaveBeenLastCalledWith('right');
  });

  it('preventDefault is called on every touch event', () => {
    const { el } = setupRefHook(true, onInput);
    expect(dispatchTouch(el, 'touchstart', [{ clientX: 25 }])).toHaveBeenCalled();
    expect(dispatchTouch(el, 'touchmove', [{ clientX: 25 }])).toHaveBeenCalled();
    expect(dispatchTouch(el, 'touchend', [])).toHaveBeenCalled();
    expect(dispatchTouch(el, 'touchcancel', [])).toHaveBeenCalled();
  });

  it('detaches listeners when enabled flips to false', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    setRect(el, { left: 0, width: 100 });
    const ref = { current: el } as RefObject<HTMLElement | null>;
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useTouchControls({ enabled, containerRef: ref, onInput }),
      { initialProps: { enabled: true } },
    );
    dispatchTouch(el, 'touchstart', [{ clientX: 25 }]);
    expect(onInput).toHaveBeenCalled();
    onInput.mockClear();
    rerender({ enabled: false });
    dispatchTouch(el, 'touchstart', [{ clientX: 25 }]);
    expect(onInput).not.toHaveBeenCalled();
  });
});
