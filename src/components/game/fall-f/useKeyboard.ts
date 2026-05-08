import { useEffect } from 'react';
import type { InputState } from './types';

interface UseKeyboardArgs {
  enabled: boolean;
  onInput: (next: InputState) => void;
  onStart?: () => void;
}

export function useKeyboard({ enabled, onInput, onStart }: UseKeyboardArgs): void {
  useEffect(() => {
    if (!enabled) return;
    let left = false;
    let right = false;

    const compute = (): InputState => {
      if (left && right) return 'both';
      if (left) return 'left';
      if (right) return 'right';
      return 'none';
    };

    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft') {
        left = true;
        onInput(compute());
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        right = true;
        onInput(compute());
        e.preventDefault();
      } else if (e.key === 'Enter') {
        onStart?.();
        e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        left = false;
        onInput(compute());
      } else if (e.key === 'ArrowRight') {
        right = false;
        onInput(compute());
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [enabled, onInput, onStart]);
}
