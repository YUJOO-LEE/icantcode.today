import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '@/hooks/useHashRoute';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import InitialScreen from './InitialScreen';
import ResultScreen from './ResultScreen';
import ErrorScreen from './ErrorScreen';
import GameField from './GameField';
import { makeInitialState, startNewRun, setPlayerInput, tickGameState } from './gameState';
import { FIELD_GUTTER_LEFT_PX, FIELD_GUTTER_RIGHT_PX, ROW_HEIGHT_PX } from './constants';
import { rowsForHeight, colsForWidth, measureCellWidth } from './grid';
import { useKeyboard } from './useKeyboard';
import { useTouchControls } from './useTouchControls';
import { usePageHidden } from './useVisibility';
import { defaultRNG, mulberry32 } from './rng';
import type { InputState, Viewport } from './types';

interface FallFGameProps {
  seed?: number | null;
}

const MAX_FRAME_MS = 50;
const FALLBACK_VIEWPORT: Viewport = { rows: 25, cols: 80 };

function viewportFromWidth(widthPx: number): Viewport {
  if (typeof window === 'undefined') return FALLBACK_VIEWPORT;
  const heightPx = Math.max(360, Math.floor(window.innerHeight * 0.6));
  const cellWidth = measureCellWidth();
  const playableWidth = Math.max(0, widthPx - FIELD_GUTTER_LEFT_PX - FIELD_GUTTER_RIGHT_PX);
  return {
    cols: colsForWidth(playableWidth, cellWidth),
    rows: rowsForHeight(heightPx, ROW_HEIGHT_PX),
  };
}

function FallFGame({ seed }: FallFGameProps) {
  const isCoarsePointer = useMediaQuery('(pointer: coarse)');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState(() => makeInitialState(FALLBACK_VIEWPORT));
  const rng = useMemo(() => (seed != null ? mulberry32(seed) : defaultRNG), [seed]);

  // Keep a stable handle to the latest status for the rAF closure.
  const statusRef = useRef(state.status);
  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  // Track the wrapper's actual rendered width so cols match what the user sees.
  // While a run is in progress, treat resize as a fatal SIGWINCH error — the
  // map is fixed at startNewRun and we don't want to recompute mid-run.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const widthPx = el.clientWidth;
      if (widthPx <= 0) return;
      const viewport = viewportFromWidth(widthPx);
      setState((prev) => {
        const sameSize =
          prev.viewport.cols === viewport.cols && prev.viewport.rows === viewport.rows;
        if (sameSize) return prev;
        if (prev.status === 'playing') {
          // Resize is an error termination, not a regular death — leave `best`
          // untouched so the player's record isn't tainted by an unintended exit.
          return { ...prev, status: 'dead-resize', viewport };
        }
        return { ...prev, viewport };
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleStart = useCallback(() => {
    setState((prev) => startNewRun(prev, performance.now()));
  }, []);

  const handleReturnToIdle = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'idle' }));
  }, []);

  const handleHome = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'idle' }));
    navigate('/game');
  }, []);

  const setInput = useCallback((input: InputState) => {
    setState((prev) => setPlayerInput(prev, input));
  }, []);

  const pageHidden = usePageHidden();

  // Game loop — uses functional setState so we never read state during render.
  useEffect(() => {
    let raf = 0;
    let lastTime: number | null = null;
    function frame(time: number) {
      if (statusRef.current !== 'playing' || pageHidden) {
        lastTime = null;
      } else {
        if (lastTime !== null) {
          const dt = Math.min(time - lastTime, MAX_FRAME_MS);
          setState((prev) => (prev.status === 'playing' ? tickGameState(prev, dt, rng) : prev));
        }
        lastTime = time;
      }
      raf = window.requestAnimationFrame(frame);
    }
    raf = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(raf);
  }, [rng, pageHidden]);

  useKeyboard({
    enabled: state.status === 'playing',
    onInput: setInput,
  });

  useTouchControls({
    enabled: state.status === 'playing' && isCoarsePointer,
    containerRef: fieldRef,
    onInput: setInput,
  });

  const resultCause: 'segfault' | 'timeout' | null =
    state.status === 'dead-segfault'
      ? 'segfault'
      : state.status === 'dead-timeout'
        ? 'timeout'
        : null;

  let content;
  if (state.status === 'idle') {
    content = (
      <InitialScreen best={state.best} hasBest={state.best > 0} onStart={handleStart} />
    );
  } else if (resultCause) {
    content = (
      <ResultScreen
        cause={resultCause}
        score={state.score}
        best={state.best}
        onRetry={handleReturnToIdle}
        onHome={handleHome}
      />
    );
  } else if (state.status === 'dead-resize') {
    content = (
      <ErrorScreen kind="resize" onRetry={handleReturnToIdle} onHome={handleHome} />
    );
  } else {
    content = <GameField ref={fieldRef} state={state} ariaLabel="fall -f game" />;
  }

  return (
    <div ref={wrapperRef} className="w-full">
      {content}
    </div>
  );
}

export default FallFGame;
