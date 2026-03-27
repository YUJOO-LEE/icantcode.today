import { useRef, useCallback } from 'react';

export function useIntersectionObserver(
  onIntersect: () => void,
  options?: { enabled?: boolean; rootMargin?: string },
) {
  const enabled = options?.enabled ?? true;
  const rootMargin = options?.rootMargin ?? '200px';
  const onIntersectRef = useRef(onIntersect);
  onIntersectRef.current = onIntersect;
  const observerRef = useRef<IntersectionObserver | null>(null);

  const callbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node || !enabled) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) onIntersectRef.current();
        },
        { rootMargin },
      );
      observerRef.current.observe(node);
    },
    [enabled, rootMargin],
  );

  return callbackRef;
}
