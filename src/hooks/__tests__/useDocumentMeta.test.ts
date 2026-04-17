import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentMeta } from '../useDocumentMeta';

function getMeta(name: string): string {
  return (
    document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ??
    document.querySelector(`meta[property="${name}"]`)?.getAttribute('content') ??
    ''
  );
}

describe('useDocumentMeta', () => {
  beforeEach(() => {
    document.title = '';
    document.documentElement.lang = '';
    ['description', 'og:title', 'og:description'].forEach((key) => {
      const selector = key.startsWith('og:')
        ? `meta[property="${key}"]`
        : `meta[name="${key}"]`;
      document.querySelector(selector)?.remove();
    });
  });

  describe('apiStatus=normal', () => {
    it('ko: sets correct title and description', () => {
      renderHook(() => useDocumentMeta({ apiStatus: 'normal', lang: 'ko' }));
      expect(document.title).toContain('icantcode.today');
      expect(document.title).not.toContain('[DOWN]');
      expect(document.title).not.toContain('[...]');
      expect(getMeta('description')).toContain('Claude Code');
    });

    it('en: sets English description', () => {
      renderHook(() => useDocumentMeta({ apiStatus: 'normal', lang: 'en' }));
      expect(document.title).toContain('icantcode.today');
      expect(getMeta('description')).toMatch(/developer community/i);
    });
  });

  describe('apiStatus=checking', () => {
    it('ko: title contains checking indicator', () => {
      renderHook(() => useDocumentMeta({ apiStatus: 'checking', lang: 'ko' }));
      expect(document.title).toContain('[...]');
    });

    it('en: title contains checking indicator', () => {
      renderHook(() => useDocumentMeta({ apiStatus: 'checking', lang: 'en' }));
      expect(document.title).toContain('[...]');
    });
  });

  describe('apiStatus=down', () => {
    it('ko: title contains [DOWN]', () => {
      renderHook(() => useDocumentMeta({ apiStatus: 'down', lang: 'ko' }));
      expect(document.title).toContain('[DOWN]');
    });

    it('en: title contains [DOWN]', () => {
      renderHook(() => useDocumentMeta({ apiStatus: 'down', lang: 'en' }));
      expect(document.title).toContain('[DOWN]');
    });

    it('ko: description mentions outage', () => {
      renderHook(() => useDocumentMeta({ apiStatus: 'down', lang: 'ko' }));
      expect(getMeta('description')).toMatch(/장애|down/i);
    });
  });

  describe('html[lang] sync', () => {
    it('sets html lang to ko', () => {
      renderHook(() => useDocumentMeta({ apiStatus: 'normal', lang: 'ko' }));
      expect(document.documentElement.lang).toBe('ko');
    });

    it('sets html lang to en', () => {
      renderHook(() => useDocumentMeta({ apiStatus: 'normal', lang: 'en' }));
      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('og meta tags', () => {
    it('syncs og:title on status change', () => {
      type ApiStatus = 'normal' | 'checking' | 'down';
      type Lang = 'ko' | 'en';
      const { rerender } = renderHook(
        ({ apiStatus, lang }: { apiStatus: ApiStatus; lang: Lang }) =>
          useDocumentMeta({ apiStatus, lang }),
        { initialProps: { apiStatus: 'normal' as ApiStatus, lang: 'ko' as Lang } }
      );
      const normalTitle = getMeta('og:title');

      rerender({ apiStatus: 'down', lang: 'ko' });
      const downTitle = getMeta('og:title');

      expect(normalTitle).not.toBe(downTitle);
      expect(downTitle).toContain('[DOWN]');
    });
  });
});
