import { useEffect, useRef } from 'react';
import type { InputState } from './types';

interface UseKeyboardArgs {
  enabled: boolean;
  onInput: (next: InputState) => void;
  onJump?: () => void;
  onDash?: () => void;
}

type Direction = 'left' | 'right';

/**
 * Letter keys are matched on `e.code` (physical key) rather than `e.key` so
 * that WASD works regardless of CapsLock state or an active IME (e.g. Korean),
 * both of which change `e.key` but never `e.code`. Arrow keys keep `e.key`.
 */
function directionOf(e: KeyboardEvent): Direction | null {
  if (e.key === 'ArrowLeft' || e.code === 'KeyA') return 'left';
  if (e.key === 'ArrowRight' || e.code === 'KeyD') return 'right';
  return null;
}

function isJumpKey(e: KeyboardEvent): boolean {
  // Space is the canonical platformer jump key and reads naturally on any
  // keyboard layout — `e.code === 'Space'` survives IME and language remaps
  // the way `e.key === ' '` does not.
  return e.code === 'Space';
}

function isDashKey(e: KeyboardEvent): boolean {
  return e.key === 'Shift';
}

// Stable per-physical-key id; falls back to `key` when `code` is unavailable
// (older browsers, jsdom synthetic events without an explicit `code`).
function keyId(e: KeyboardEvent): string {
  return e.code || e.key;
}

export function useKeyboard({ enabled, onInput, onJump, onDash }: UseKeyboardArgs): void {
  const onInputRef = useRef(onInput);
  const onJumpRef = useRef(onJump);
  const onDashRef = useRef(onDash);
  useEffect(() => {
    onInputRef.current = onInput;
    onJumpRef.current = onJump;
    onDashRef.current = onDash;
  }, [onInput, onJump, onDash]);

  useEffect(() => {
    if (!enabled) return;
    // Track held keys per direction so that, when two keys map to the same
    // direction (e.g. ArrowLeft + A), releasing one doesn't drop movement
    // while the other is still held.
    const heldLeft = new Set<string>();
    const heldRight = new Set<string>();

    const compute = (): InputState => {
      const left = heldLeft.size > 0;
      const right = heldRight.size > 0;
      if (left && right) return 'both';
      if (left) return 'left';
      if (right) return 'right';
      return 'none';
    };

    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const dir = directionOf(e);
      if (dir === 'left') {
        heldLeft.add(keyId(e));
        onInputRef.current(compute());
        e.preventDefault();
      } else if (dir === 'right') {
        heldRight.add(keyId(e));
        onInputRef.current(compute());
        e.preventDefault();
      } else if (isJumpKey(e)) {
        onJumpRef.current?.();
        e.preventDefault();
      } else if (isDashKey(e)) {
        onDashRef.current?.();
        e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      const dir = directionOf(e);
      if (dir === 'left') {
        heldLeft.delete(keyId(e));
        onInputRef.current(compute());
      } else if (dir === 'right') {
        heldRight.delete(keyId(e));
        onInputRef.current(compute());
      }
    };
    const onBlur = () => {
      if (heldLeft.size === 0 && heldRight.size === 0) return;
      heldLeft.clear();
      heldRight.clear();
      onInputRef.current('none');
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [enabled]);
}
