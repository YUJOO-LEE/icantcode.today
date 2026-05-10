import { useEffect, useRef } from 'react';
import type { InputState } from './types';

interface UseKeyboardArgs {
  enabled: boolean;
  onInput: (next: InputState) => void;
  onStart?: () => void;
}

export function useKeyboard({ enabled, onInput, onStart }: UseKeyboardArgs): void {
  const onInputRef = useRef(onInput);
  const onStartRef = useRef(onStart);
  useEffect(() => {
    onInputRef.current = onInput;
    onStartRef.current = onStart;
  }, [onInput, onStart]);

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
        onInputRef.current(compute());
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        right = true;
        onInputRef.current(compute());
        e.preventDefault();
      } else if (e.key === 'Enter') {
        onStartRef.current?.();
        e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        left = false;
        onInputRef.current(compute());
      } else if (e.key === 'ArrowRight') {
        right = false;
        onInputRef.current(compute());
      }
    };
    const onBlur = () => {
      if (!left && !right) return;
      left = false;
      right = false;
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
