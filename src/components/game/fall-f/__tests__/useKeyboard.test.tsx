import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useKeyboard } from '../useKeyboard';
import type { InputState } from '../types';

function press(key: string, init: KeyboardEventInit = {}) {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, ...init });
  // jsdom doesn't always wire preventDefault → defaultPrevented; spy here.
  const spy = vi.spyOn(ev, 'preventDefault');
  window.dispatchEvent(ev);
  return spy;
}

function release(key: string) {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
}

describe('useKeyboard', () => {
  let onInput: Mock<(next: InputState) => void>;
  let onStart: Mock<() => void>;

  beforeEach(() => {
    onInput = vi.fn<(next: InputState) => void>();
    onStart = vi.fn<() => void>();
  });

  it('does not bind when enabled=false', () => {
    renderHook(() => useKeyboard({ enabled: false, onInput, onStart }));
    press('ArrowLeft');
    press('Enter');
    expect(onInput).not.toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('emits "left" on ArrowLeft and resets to "none" on release', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onStart }));
    press('ArrowLeft');
    expect(onInput).toHaveBeenLastCalledWith('left');
    release('ArrowLeft');
    expect(onInput).toHaveBeenLastCalledWith('none');
  });

  it('emits "right" on ArrowRight and resets to "none" on release', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onStart }));
    press('ArrowRight');
    expect(onInput).toHaveBeenLastCalledWith('right');
    release('ArrowRight');
    expect(onInput).toHaveBeenLastCalledWith('none');
  });

  it('emits "both" when ArrowLeft and ArrowRight are held simultaneously', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onStart }));
    press('ArrowLeft');
    press('ArrowRight');
    expect(onInput).toHaveBeenLastCalledWith('both');
  });

  it('falls back to the still-held key when one of two is released', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onStart }));
    press('ArrowLeft');
    press('ArrowRight');
    release('ArrowLeft');
    expect(onInput).toHaveBeenLastCalledWith('right');
  });

  it('calls onStart on Enter', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onStart }));
    press('Enter');
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('does not call onStart when onStart is undefined (no throw)', () => {
    expect(() =>
      renderHook(() => useKeyboard({ enabled: true, onInput })),
    ).not.toThrow();
    press('Enter');
    expect(onInput).not.toHaveBeenCalled();
  });

  it('ignores repeated key events (key-repeat)', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onStart }));
    press('ArrowLeft');
    onInput.mockClear();
    press('ArrowLeft', { repeat: true });
    expect(onInput).not.toHaveBeenCalled();
  });

  it('preventDefault on ArrowLeft / ArrowRight / Enter', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onStart }));
    expect(press('ArrowLeft')).toHaveBeenCalled();
    expect(press('ArrowRight')).toHaveBeenCalled();
    expect(press('Enter')).toHaveBeenCalled();
  });

  it('does not preventDefault on unrelated keys', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onStart }));
    expect(press('a')).not.toHaveBeenCalled();
  });

  it('clears held keys to "none" on window blur', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onStart }));
    press('ArrowLeft');
    expect(onInput).toHaveBeenLastCalledWith('left');
    onInput.mockClear();
    window.dispatchEvent(new Event('blur'));
    expect(onInput).toHaveBeenLastCalledWith('none');
  });

  it('does not emit on blur if no key was held', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onStart }));
    window.dispatchEvent(new Event('blur'));
    expect(onInput).not.toHaveBeenCalled();
  });

  it('detaches listeners when enabled flips to false', () => {
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useKeyboard({ enabled, onInput, onStart }),
      { initialProps: { enabled: true } },
    );
    press('ArrowLeft');
    expect(onInput).toHaveBeenCalled();
    onInput.mockClear();
    rerender({ enabled: false });
    press('ArrowLeft');
    expect(onInput).not.toHaveBeenCalled();
  });
});
