import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { ROUTES } from '@/constants/routes';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useStartGame } from '@/apis/queries/useGames';
import InitialScreen from './InitialScreen';
import LoadingScreen from './LoadingScreen';
import ResultScreen from './ResultScreen';
import ErrorScreen from './ErrorScreen';
import StartErrorScreen from './StartErrorScreen';
import GameField from './GameField';
import {
  makeInitialState,
  requestDash,
  requestJump,
  setPlayerInput,
  startNewRun,
  tickGameState,
} from './gameState';
import { FIELD_GUTTER_LEFT_PX, FIELD_GUTTER_RIGHT_PX, ROW_HEIGHT_PX } from './constants';
import { rowsForHeight, colsForWidth, measureCellWidth } from './grid';
import { useKeyboard } from './useKeyboard';
import { useTouchControls } from './useTouchControls';
import { usePageHidden } from './useVisibility';
import { defaultRNG, mulberry32 } from './rng';
import type { InputState, Viewport } from './types';

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

function FallFGame() {
  const { i18n } = useTranslation();
  useDocumentMeta({ route: 'gameFallF', lang: i18n.language === 'en' ? 'en' : 'ko' });

  const [searchParams] = useSearchParams();
  const seedRaw = searchParams.get('seed');
  const seed = seedRaw !== null && /^\d+$/.test(seedRaw) ? Number(seedRaw) : null;

  const navigate = useNavigate();
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

  // While the run is in progress, treat resize as a fatal SIGWINCH error — the
  // map is fixed at startNewRun and we don't want to recompute mid-run.
  // We deliberately DO NOT measure on idle/dead screens: they don't render the
  // grid, and the extra setState would create a post-hydrate commit that races
  // with effects in the parent tree (e.g., the i18n LanguageInitializer).
  useEffect(() => {
    if (state.status !== 'playing') return;
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const widthPx = el.clientWidth;
      if (widthPx <= 0) return;
      const viewport = viewportFromWidth(widthPx);
      setState((prev) => {
        if (prev.status !== 'playing') return prev;
        const sameSize =
          prev.viewport.cols === viewport.cols && prev.viewport.rows === viewport.rows;
        if (sameSize) return prev;
        // Resize is an error termination, not a regular death — leave `best`
        // untouched so the player's record isn't tainted by an unintended exit.
        return { ...prev, status: 'dead-resize', viewport };
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [state.status]);

  // `mutate` is referentially stable across renders (TanStack Query v5),
  // so we can put it directly in the useCallback deps without retriggering
  // InitialScreen's keyboard listener on every render.
  const { mutate: startMutate } = useStartGame();

  const handleStart = useCallback(() => {
    // Measure viewport at game-start, not on mount: idle screen doesn't need it.
    const widthPx = wrapperRef.current?.clientWidth ?? 0;
    const viewport = widthPx > 0 ? viewportFromWidth(widthPx) : FALLBACK_VIEWPORT;
    setState((prev) => ({ ...prev, viewport, status: 'starting' }));
    startMutate(undefined, {
      onSuccess: ({ sessionId }) => {
        setState((prev) =>
          prev.status === 'starting'
            ? startNewRun({ ...prev, viewport }, performance.now(), sessionId)
            : prev,
        );
      },
      onError: () => {
        setState((prev) => (prev.status === 'starting' ? { ...prev, status: 'start-failed' } : prev));
      },
    });
  }, [startMutate]);

  const handleReturnToIdle = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'idle' }));
  }, []);

  const handleHome = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'idle' }));
    navigate(ROUTES.GAME);
  }, [navigate]);

  const setInput = useCallback((input: InputState) => {
    setState((prev) => setPlayerInput(prev, input));
  }, []);

  const queueJump = useCallback(() => {
    setState((prev) => requestJump(prev));
  }, []);

  const queueDash = useCallback(() => {
    setState((prev) => requestDash(prev));
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
    onJump: queueJump,
    onDash: queueDash,
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
  } else if (state.status === 'starting') {
    content = <LoadingScreen />;
  } else if (state.status === 'start-failed') {
    content = <StartErrorScreen onRetry={handleStart} onHome={handleHome} />;
  } else if (resultCause) {
    content = (
      <ResultScreen
        cause={resultCause}
        score={state.score}
        best={state.best}
        sessionId={state.sessionId}
        onRetry={handleReturnToIdle}
        onHome={handleHome}
      />
    );
  } else if (state.status === 'dead-resize') {
    content = <ErrorScreen onRetry={handleReturnToIdle} onHome={handleHome} />;
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
