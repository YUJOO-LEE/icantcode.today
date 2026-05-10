import { describe, it, expect } from 'vitest';
import {
  PAGE_META,
  ROUTE_BY_PATH,
  resolveHead,
  serializeRouteJsonLd,
  SITE_BASE_URL,
} from '../pageMeta';
import { ROUTES } from '../routes';

describe('ROUTE_BY_PATH', () => {
  it('reverse-maps every PAGE_META entry from path → routeKey', () => {
    expect(ROUTE_BY_PATH[ROUTES.HOME]).toBe('home');
    expect(ROUTE_BY_PATH[ROUTES.GAME]).toBe('game');
    expect(ROUTE_BY_PATH[ROUTES.GAME_FALL_F]).toBe('gameFallF');
  });

  it('every PAGE_META path is reachable through ROUTE_BY_PATH', () => {
    for (const [routeKey, meta] of Object.entries(PAGE_META)) {
      expect(ROUTE_BY_PATH[meta.path]).toBe(routeKey);
    }
  });
});

describe('resolveHead', () => {
  it('home + apiStatus=down picks the down overlay copy', () => {
    const head = resolveHead('home', 'ko', 'down');
    expect(head.title).toContain('[DOWN]');
  });

  it('home + apiStatus=normal returns base byLang copy', () => {
    const head = resolveHead('home', 'en', 'normal');
    expect(head.title).not.toContain('[DOWN]');
    expect(head.title).not.toContain('[...]');
  });

  it('non-home route ignores apiStatus overlay', () => {
    const head = resolveHead('game', 'ko', 'down');
    expect(head.title).not.toContain('[DOWN]');
    expect(head.title).toMatch(/Mini Games/i);
  });

  it('canonical and ogUrl are identical and absolute', () => {
    const head = resolveHead('gameFallF', 'en');
    expect(head.canonical).toBe(`${SITE_BASE_URL}/game/fall-f`);
    expect(head.ogUrl).toBe(head.canonical);
  });
});

describe('serializeRouteJsonLd', () => {
  it('returns empty string when input is null', () => {
    expect(serializeRouteJsonLd(null)).toBe('');
  });

  it('returns empty string when input is empty array', () => {
    expect(serializeRouteJsonLd([])).toBe('');
  });

  it('wraps the JSON-LD payload in a script tag', () => {
    const out = serializeRouteJsonLd([{ '@type': 'Thing', name: 'demo' }]);
    expect(out).toMatch(/^<script type="application\/ld\+json">/);
    expect(out).toContain('</script>');
    expect(out).toContain('"@type": "Thing"');
  });

  it('escapes `<` so a `</script>` payload cannot break out of the script tag', () => {
    const out = serializeRouteJsonLd([
      { '@type': 'Thing', description: 'evil </script><script>alert(1)</script>' },
    ]);
    // The exactly one `</script>` allowed is the closing tag this function emits.
    const closingScripts = out.match(/<\/script>/g) ?? [];
    expect(closingScripts).toHaveLength(1);
    // No additional `<script` opener can survive in the payload.
    expect(out.match(/<script\b/gi) ?? []).toHaveLength(1);
    // Each `<` from the payload is unicode-escaped.
    expect(out).toContain('\\u003c/script>\\u003cscript>alert(1)\\u003c/script>');
  });

  it('escapes HTML comment closers (`-->`) inside the payload', () => {
    const out = serializeRouteJsonLd([{ '@type': 'Thing', description: 'a --> b' }]);
    expect(out).not.toContain('-->');
    expect(out).toContain('--\\u003e');
  });
});
