import { useEffect, type RefObject } from 'react';
import type { InputState } from './types';

interface UseTouchControlsArgs {
  enabled: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onInput: (next: InputState) => void;
}

export function useTouchControls({ enabled, containerRef, onInput }: UseTouchControlsArgs): void {
  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    let leftActive = false;
    let rightActive = false;

    const compute = (): InputState => {
      if (leftActive && rightActive) return 'both';
      if (leftActive) return 'left';
      if (rightActive) return 'right';
      return 'none';
    };

    const handle = (e: TouchEvent) => {
      const rect = el.getBoundingClientRect();
      const half = rect.left + rect.width / 2;
      leftActive = false;
      rightActive = false;
      for (const touch of Array.from(e.touches)) {
        if (touch.clientX < half) leftActive = true;
        else rightActive = true;
      }
      onInput(compute());
      e.preventDefault();
    };

    el.addEventListener('touchstart', handle, { passive: false });
    el.addEventListener('touchmove', handle, { passive: false });
    el.addEventListener('touchend', handle, { passive: false });
    el.addEventListener('touchcancel', handle, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handle);
      el.removeEventListener('touchmove', handle);
      el.removeEventListener('touchend', handle);
      el.removeEventListener('touchcancel', handle);
    };
  }, [enabled, containerRef, onInput]);
}
