import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentMeta } from '../useDocumentMeta';
import { PAGE_META, SITE_BASE_URL } from '@/constants/pageMeta';

function getMeta(name: string): string {
  return (
    document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ??
    document.querySelector(`meta[property="${name}"]`)?.getAttribute('content') ??
    ''
  );
}

function getCanonical(): string {
  return document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
}

describe('useDocumentMeta', () => {
  beforeEach(() => {
    document.title = '';
    document.documentElement.lang = '';
    document
      .querySelectorAll(
        [
          'meta[name="description"]',
          'meta[property="og:title"]',
          'meta[property="og:description"]',
          'meta[property="og:url"]',
          'meta[property="og:locale"]',
          'meta[name="twitter:title"]',
          'meta[name="twitter:description"]',
          'link[rel="canonical"]',
        ].join(','),
      )
      .forEach((el) => el.remove());
  });

  describe('route=home, apiStatus=normal', () => {
    it('ko: sets brand title and Korean+English description', () => {
      renderHook(() => useDocumentMeta({ route: 'home', lang: 'ko', apiStatus: 'normal' }));
      expect(document.title).toContain('icantcode.today');
      expect(document.title).not.toContain('[DOWN]');
      expect(document.title).not.toContain('[...]');
      expect(getMeta('description')).toContain('Claude Code');
      expect(getMeta('og:url')).toBe(`${SITE_BASE_URL}/`);
      expect(getCanonical()).toBe(`${SITE_BASE_URL}/`);
      expect(getMeta('og:locale')).toBe('ko_KR');
    });

    it('en: sets English description and en_US locale', () => {
      renderHook(() => useDocumentMeta({ route: 'home', lang: 'en', apiStatus: 'normal' }));
      expect(document.title).toContain('icantcode.today');
      expect(getMeta('description')).toMatch(/devs|Claude Code|terminal/i);
      expect(getMeta('og:locale')).toBe('en_US');
    });
  });

  describe('route=home, apiStatus=checking overlay', () => {
    it('ko: title contains [...]', () => {
      renderHook(() => useDocumentMeta({ route: 'home', lang: 'ko', apiStatus: 'checking' }));
      expect(document.title).toContain('[...]');
      expect(getMeta('description')).toMatch(/확인하는 중|살아 있는지/);
    });

    it('en: title contains [...]', () => {
      renderHook(() => useDocumentMeta({ route: 'home', lang: 'en', apiStatus: 'checking' }));
      expect(document.title).toContain('[...]');
    });
  });

  describe('route=home, apiStatus=down overlay', () => {
    it('ko: title contains [DOWN] and description mentions outage', () => {
      renderHook(() => useDocumentMeta({ route: 'home', lang: 'ko', apiStatus: 'down' }));
      expect(document.title).toContain('[DOWN]');
      expect(getMeta('description')).toMatch(/장애|down/i);
    });

    it('en: title contains [DOWN]', () => {
      renderHook(() => useDocumentMeta({ route: 'home', lang: 'en', apiStatus: 'down' }));
      expect(document.title).toContain('[DOWN]');
    });
  });

  describe('route=game (catalog)', () => {
    it('ko: title is route-distinct and canonical points at /game', () => {
      renderHook(() => useDocumentMeta({ route: 'game', lang: 'ko' }));
      expect(document.title).toMatch(/Mini Games/i);
      expect(getMeta('description')).toContain('터미널');
      expect(getMeta('og:url')).toBe(`${SITE_BASE_URL}/game`);
      expect(getCanonical()).toBe(`${SITE_BASE_URL}/game`);
    });

    it('en: title mentions Mini Games', () => {
      renderHook(() => useDocumentMeta({ route: 'game', lang: 'en' }));
      expect(document.title).toMatch(/mini games/i);
      expect(getMeta('og:locale')).toBe('en_US');
    });

    it('apiStatus is ignored for non-home route — fall-through to byLang copy', () => {
      renderHook(() => useDocumentMeta({ route: 'game', lang: 'ko', apiStatus: 'down' }));
      expect(document.title).not.toContain('[DOWN]');
      expect(document.title).toMatch(/Mini Games/i);
    });
  });

  describe('route=gameFallF', () => {
    it('ko: title contains fall-f and canonical points at /game/fall-f', () => {
      renderHook(() => useDocumentMeta({ route: 'gameFallF', lang: 'ko' }));
      expect(document.title).toContain('fall-f');
      expect(getMeta('og:url')).toBe(`${SITE_BASE_URL}/game/fall-f`);
      expect(getCanonical()).toBe(`${SITE_BASE_URL}/game/fall-f`);
    });

    it('en: title frames the game as a falling cursor', () => {
      renderHook(() => useDocumentMeta({ route: 'gameFallF', lang: 'en' }));
      expect(document.title).toContain('fall-f');
      expect(document.title.toLowerCase()).toMatch(/cursor.*terminal|terminal.*cursor/);
    });

    it('apiStatus is ignored for non-home route', () => {
      renderHook(() =>
        useDocumentMeta({ route: 'gameFallF', lang: 'en', apiStatus: 'checking' }),
      );
      expect(document.title).not.toContain('[...]');
      expect(document.title).toContain('fall-f');
    });
  });

  describe('html[lang] sync', () => {
    it('sets html lang to ko', () => {
      renderHook(() => useDocumentMeta({ route: 'home', lang: 'ko', apiStatus: 'normal' }));
      expect(document.documentElement.lang).toBe('ko');
    });

    it('sets html lang to en', () => {
      renderHook(() => useDocumentMeta({ route: 'gameFallF', lang: 'en' }));
      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('og + twitter mirror copy', () => {
    it('og:title and twitter:title share the same value as document.title (or ogTitle override)', () => {
      renderHook(() => useDocumentMeta({ route: 'gameFallF', lang: 'en' }));
      const expected = PAGE_META.gameFallF.byLang.en.ogTitle ?? PAGE_META.gameFallF.byLang.en.title;
      expect(getMeta('og:title')).toBe(expected);
      expect(getMeta('twitter:title')).toBe(expected);
    });

    it('og:title swaps when route changes', () => {
      const { rerender } = renderHook(
        ({ route }: { route: 'home' | 'gameFallF' }) =>
          useDocumentMeta({ route, lang: 'ko', apiStatus: 'normal' }),
        { initialProps: { route: 'home' } },
      );
      const homeOg = getMeta('og:title');
      rerender({ route: 'gameFallF' });
      const fallFOg = getMeta('og:title');
      expect(homeOg).not.toBe(fallFOg);
      expect(fallFOg).toContain('fall-f');
    });
  });
});
