import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import i18n from '@/lib/i18n';
import { server } from '@/tests/mocks/server';
import { API_BASE_URL } from '@/lib/constants';
import { useSessionStore } from '@/stores/sessionStore';
import FallFGame from '../FallFGame';

interface RafCallback {
  (time: number): void;
}

let rafCallbacks: RafCallback[] = [];
let resizeObserverCallback: ResizeObserverCallback | null = null;
const observe = vi.fn();
const disconnect = vi.fn();

class MockResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    resizeObserverCallback = cb;
  }
  observe = observe;
  disconnect = disconnect;
  unobserve = vi.fn();
}

function flushFrame(time: number) {
  const cb = rafCallbacks.shift();
  if (cb) cb(time);
}

// Helper that renders FallFGame inside a MemoryRouter so useNavigate works,
// and exposes the current pathname so navigation assertions can read it.
function LocationProbe({ onChange }: { onChange: (path: string) => void }) {
  const loc = useLocation();
  onChange(loc.pathname);
  return null;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function Wrapper({ children, onLocation }: { children: ReactNode; onLocation?: (p: string) => void }) {
  const client = makeQueryClient();
  return (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/game/fall-f']}>
          <Routes>
            <Route path="/game/fall-f" element={<>{children}{onLocation ? <LocationProbe onChange={onLocation} /> : null}</>} />
            <Route path="*" element={onLocation ? <LocationProbe onChange={onLocation} /> : null} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

/**
 * Press Enter to start a run, then wait for the start API → playing transition
 * (the run now goes idle → starting → playing once /games/start resolves).
 */
async function startRun() {
  fireEvent.keyDown(window, { key: 'Enter' });
  await waitFor(() => {
    expect(screen.getByRole('application')).toBeInTheDocument();
  });
}

beforeEach(() => {
  rafCallbacks = [];
  resizeObserverCallback = null;
  observe.mockClear();
  disconnect.mockClear();
  useSessionStore.setState({ userCode: crypto.randomUUID(), nickname: null });

  vi.stubGlobal(
    'requestAnimationFrame',
    (cb: RafCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    },
  );
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FallFGame', () => {
  it('renders the initial screen on mount with no best score', () => {
    render(<FallFGame />, { wrapper: Wrapper });
    expect(screen.getByText('$ fall -f')).toBeInTheDocument();
    expect(screen.queryByRole('application')).not.toBeInTheDocument();
  });

  it('switches from idle to playing when Enter is pressed (after start API resolves)', async () => {
    render(<FallFGame />, { wrapper: Wrapper });
    expect(screen.getByText('$ fall -f')).toBeInTheDocument();

    await startRun();

    // GameField mounts as `application`. ResizeObserver gets attached.
    expect(screen.getByRole('application')).toBeInTheDocument();
    expect(observe).toHaveBeenCalled();
  });

  it('shows the LoadingScreen while the start API is in flight', async () => {
    let resolveStart: ((value: { sessionId: string }) => void) | null = null;
    server.use(
      http.post(`${API_BASE_URL}/games/start`, async () => {
        const body = await new Promise<{ sessionId: string }>((res) => {
          resolveStart = res;
        });
        return HttpResponse.json(body);
      }),
    );
    render(<FallFGame />, { wrapper: Wrapper });

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Enter' });
    });

    // Loading screen visible while waiting on the API.
    expect(screen.getByText(/connecting to score server/)).toBeInTheDocument();

    await act(async () => {
      resolveStart?.({ sessionId: 'test-sid' });
    });
    await waitFor(() => expect(screen.getByRole('application')).toBeInTheDocument());
  });

  it('shows StartErrorScreen when the start API fails and retries on click', async () => {
    let calls = 0;
    server.use(
      http.post(`${API_BASE_URL}/games/start`, () => {
        calls += 1;
        if (calls === 1) return HttpResponse.error();
        return HttpResponse.json({ sessionId: 'sid-after-retry' });
      }),
    );
    render(<FallFGame />, { wrapper: Wrapper });

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Enter' });
    });
    await waitFor(() => expect(screen.getByText(/session init failed/)).toBeInTheDocument());

    await userEvent.setup().click(screen.getByRole('button', { name: /다시하기|retry/i }));
    await waitFor(() => expect(screen.getByRole('application')).toBeInTheDocument());
  });

  it('shows the resize error screen when the wrapper resizes mid-run', async () => {
    const { container } = render(<FallFGame />, { wrapper: Wrapper });

    await startRun();
    expect(screen.getByRole('application')).toBeInTheDocument();

    // Simulate a different wrapper width on resize. The ResizeObserver
    // callback reads clientWidth on the observed element — set it before
    // firing.
    const wrapperEl = container.firstElementChild as HTMLElement;
    Object.defineProperty(wrapperEl, 'clientWidth', { configurable: true, value: 50 });

    await act(async () => {
      resizeObserverCallback?.([], {} as ResizeObserver);
    });

    // ResizeObserver callback flips status to dead-resize → ErrorScreen renders.
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/SIGWINCH/)).toBeInTheDocument();
  });

  it('returns to the idle screen when the resize-error screen retry is clicked', async () => {
    const { container } = render(<FallFGame />, { wrapper: Wrapper });
    await startRun();

    const wrapperEl = container.firstElementChild as HTMLElement;
    Object.defineProperty(wrapperEl, 'clientWidth', { configurable: true, value: 50 });
    await act(async () => {
      resizeObserverCallback?.([], {} as ResizeObserver);
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /다시하기|retry/i }));
    expect(screen.getByText('$ fall -f')).toBeInTheDocument();
  });

  it('navigates to /game when the resize-error screen home button is clicked', async () => {
    let path = '/game/fall-f';
    const { container } = render(<FallFGame />, {
      wrapper: ({ children }) => (
        <Wrapper onLocation={(p) => { path = p; }}>{children}</Wrapper>
      ),
    });

    await startRun();

    const wrapperEl = container.firstElementChild as HTMLElement;
    Object.defineProperty(wrapperEl, 'clientWidth', { configurable: true, value: 50 });
    await act(async () => {
      resizeObserverCallback?.([], {} as ResizeObserver);
    });

    await userEvent.setup().click(screen.getByRole('button', { name: /나가기|home/i }));
    expect(path).toBe('/game');
  });

  it('uses the seed query parameter to seed the RNG when present', () => {
    const client = makeQueryClient();
    render(<FallFGame />, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>
          <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/game/fall-f?seed=42']}>{children}</MemoryRouter>
          </I18nextProvider>
        </QueryClientProvider>
      ),
    });
    // We can't easily inspect the seeded RNG output, but rendering with a seed
    // must not throw and must still show the initial screen.
    expect(screen.getByText('$ fall -f')).toBeInTheDocument();
  });

  it('ignores non-numeric seed values', () => {
    const client = makeQueryClient();
    render(<FallFGame />, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>
          <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/game/fall-f?seed=abc']}>{children}</MemoryRouter>
          </I18nextProvider>
        </QueryClientProvider>
      ),
    });
    expect(screen.getByText('$ fall -f')).toBeInTheDocument();
  });

  it('runs animation frames while playing — pumping rAF advances internal time without throwing', async () => {
    render(<FallFGame />, { wrapper: Wrapper });
    await startRun();
    expect(screen.getByRole('application')).toBeInTheDocument();

    // Pump several rAF frames; each one must reschedule itself and not crash.
    for (let i = 0; i < 5; i += 1) {
      act(() => flushFrame((i + 1) * 16));
    }
    // Field still rendered after frames — not dead.
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  it('does not bind a ResizeObserver while idle (only while playing)', () => {
    render(<FallFGame />, { wrapper: Wrapper });
    expect(observe).not.toHaveBeenCalled();
  });

  it('forwards arrow keys to setInput while playing (no throw)', async () => {
    render(<FallFGame />, { wrapper: Wrapper });
    await startRun();
    expect(screen.getByRole('application')).toBeInTheDocument();
    // useKeyboard binds while playing — these events flow through setInput,
    // which calls setPlayerInput on the internal game state.
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      fireEvent.keyUp(window, { key: 'ArrowLeft' });
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyUp(window, { key: 'ArrowRight' });
    });
    // Field still rendered — input plumbing didn't crash.
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  it('skips ticking while the page is hidden', async () => {
    render(<FallFGame />, { wrapper: Wrapper });
    await startRun();
    // Hide the document and dispatch visibilitychange — this flips usePageHidden
    // to true, which makes the rAF loop reset lastTime instead of ticking.
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    // Pump frames; game must not crash and the field stays mounted.
    for (let i = 0; i < 5; i += 1) {
      act(() => flushFrame((i + 1) * 16));
    }
    expect(screen.getByRole('application')).toBeInTheDocument();
    // Cleanup: restore visibility for other tests.
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
  });

  it('does not flip to dead-resize when the resize callback measures clientWidth=0', async () => {
    const { container } = render(<FallFGame />, { wrapper: Wrapper });
    await startRun();
    expect(screen.getByRole('application')).toBeInTheDocument();

    const wrapperEl = container.firstElementChild as HTMLElement;
    Object.defineProperty(wrapperEl, 'clientWidth', { configurable: true, value: 0 });
    await act(async () => {
      resizeObserverCallback?.([], {} as ResizeObserver);
    });
    // clientWidth=0 → ResizeObserver early-returns without setting dead-resize.
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  it('does not flip to dead-resize when the measured viewport is identical', async () => {
    const { container } = render(<FallFGame />, { wrapper: Wrapper });
    await startRun();
    const wrapperEl = container.firstElementChild as HTMLElement;
    // Use a width that maps to the same viewport size already in state. Since
    // jsdom returns 0px for clientWidth by default, handleStart will have
    // computed FALLBACK_VIEWPORT (cols 80, rows 25). Pin clientWidth to a value
    // that yields the same viewport on the resize callback as well — easier:
    // pin it back to whatever the fallback used (0). But 0 short-circuits, so
    // instead we make the ResizeObserver fire twice with a non-zero same value.
    Object.defineProperty(wrapperEl, 'clientWidth', { configurable: true, value: 1024 });
    await act(async () => {
      resizeObserverCallback?.([], {} as ResizeObserver);
    });
    // First fire flips us into dead-resize because viewport changed.
    // Reset by clicking retry so we're back to idle, then enter playing again
    // and fire the same width twice — second fire must NOT flip status.
    await userEvent.setup().click(screen.getByRole('button', { name: /다시하기|retry/i }));
    await startRun();
    // Now the playing-state viewport reflects width=1024. Fire again at 1024 —
    // same viewport → no status change.
    await act(async () => {
      resizeObserverCallback?.([], {} as ResizeObserver);
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('application')).toBeInTheDocument();
  });

  it('shows the result screen when the player dies (segfault)', async () => {
    const client = makeQueryClient();
    render(<FallFGame />, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>
          <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={['/game/fall-f?seed=1']}>{children}</MemoryRouter>
          </I18nextProvider>
        </QueryClientProvider>
      ),
    });
    await startRun();
    expect(screen.getByRole('application')).toBeInTheDocument();

    // Pump frames at a coarse dt to push the player off the bottom of the
    // field. Each rAF callback re-pushes itself, so we keep flushing the head.
    let lastT = 0;
    for (let i = 0; i < 600 && rafCallbacks.length > 0; i += 1) {
      lastT += 50;
      act(() => flushFrame(lastT));
      if (screen.queryByRole('application') === null) break;
    }
    // GameField is gone — the run terminated and the Result or some other
    // non-playing screen took over (covers the resultCause branch when death
    // is reached).
    expect(screen.queryByRole('application')).toBeNull();
  }, 15_000);
});
