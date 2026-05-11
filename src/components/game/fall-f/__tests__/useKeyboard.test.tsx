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
  let onJump: Mock<() => void>;
  let onDash: Mock<() => void>;

  beforeEach(() => {
    onInput = vi.fn<(next: InputState) => void>();
    onJump = vi.fn<() => void>();
    onDash = vi.fn<() => void>();
  });

  it('does not bind when enabled=false', () => {
    renderHook(() => useKeyboard({ enabled: false, onInput, onJump, onDash }));
    press('ArrowLeft');
    press('ArrowUp');
    press('Shift');
    expect(onInput).not.toHaveBeenCalled();
    expect(onJump).not.toHaveBeenCalled();
    expect(onDash).not.toHaveBeenCalled();
  });

  it('emits "left" on ArrowLeft and resets to "none" on release', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput }));
    press('ArrowLeft');
    expect(onInput).toHaveBeenLastCalledWith('left');
    release('ArrowLeft');
    expect(onInput).toHaveBeenLastCalledWith('none');
  });

  it('emits "right" on ArrowRight and resets to "none" on release', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput }));
    press('ArrowRight');
    expect(onInput).toHaveBeenLastCalledWith('right');
    release('ArrowRight');
    expect(onInput).toHaveBeenLastCalledWith('none');
  });

  it('emits "both" when ArrowLeft and ArrowRight are held simultaneously', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput }));
    press('ArrowLeft');
    press('ArrowRight');
    expect(onInput).toHaveBeenLastCalledWith('both');
  });

  it('falls back to the still-held key when one of two is released', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput }));
    press('ArrowLeft');
    press('ArrowRight');
    release('ArrowLeft');
    expect(onInput).toHaveBeenLastCalledWith('right');
  });

  it('ignores repeated key events (key-repeat)', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput }));
    press('ArrowLeft');
    onInput.mockClear();
    press('ArrowLeft', { repeat: true });
    expect(onInput).not.toHaveBeenCalled();
  });

  it('preventDefault on ArrowLeft / ArrowRight / ArrowUp / Shift', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onJump, onDash }));
    expect(press('ArrowLeft')).toHaveBeenCalled();
    expect(press('ArrowRight')).toHaveBeenCalled();
    expect(press('ArrowUp')).toHaveBeenCalled();
    expect(press('Shift')).toHaveBeenCalled();
  });

  it('does not preventDefault on unrelated keys', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput }));
    expect(press('a')).not.toHaveBeenCalled();
    expect(press('Enter')).not.toHaveBeenCalled();
  });

  it('calls onJump on ArrowUp keydown', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onJump, onDash }));
    press('ArrowUp');
    expect(onJump).toHaveBeenCalledOnce();
  });

  it('calls onDash on Shift keydown', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onJump, onDash }));
    press('Shift');
    expect(onDash).toHaveBeenCalledOnce();
  });

  it('ignores OS auto-repeat for ArrowUp and Shift', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput, onJump, onDash }));
    press('ArrowUp');
    press('ArrowUp', { repeat: true });
    expect(onJump).toHaveBeenCalledOnce();
    press('Shift');
    press('Shift', { repeat: true });
    expect(onDash).toHaveBeenCalledOnce();
  });

  it('handlers are no-ops when callbacks are not supplied', () => {
    expect(() => renderHook(() => useKeyboard({ enabled: true, onInput }))).not.toThrow();
    expect(press('ArrowUp')).toHaveBeenCalled(); // still preventDefault
    expect(press('Shift')).toHaveBeenCalled();
  });

  it('clears held keys to "none" on window blur', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput }));
    press('ArrowLeft');
    expect(onInput).toHaveBeenLastCalledWith('left');
    onInput.mockClear();
    window.dispatchEvent(new Event('blur'));
    expect(onInput).toHaveBeenLastCalledWith('none');
  });

  it('does not emit on blur if no key was held', () => {
    renderHook(() => useKeyboard({ enabled: true, onInput }));
    window.dispatchEvent(new Event('blur'));
    expect(onInput).not.toHaveBeenCalled();
  });

  it('detaches listeners when enabled flips to false', () => {
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useKeyboard({ enabled, onInput }),
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
