import { describe, it, expect } from 'vitest';
import i18n from '../i18n';

describe('i18n', () => {
  it('initializes with Korean as default language', () => {
    expect(i18n.language).toBe('ko');
  });

  it('has all required namespaces', () => {
    const namespaces = ['common', 'feed', 'auth', 'status'];
    namespaces.forEach((ns) => {
      expect(i18n.hasResourceBundle('ko', ns)).toBe(true);
      expect(i18n.hasResourceBundle('en', ns)).toBe(true);
    });
  });

  it('translates Korean keys correctly', () => {
    expect(i18n.t('common:subtitle')).toBe('멈춘 터미널의 쉼터');
    expect(i18n.t('status:checking')).toBe('상태 확인 중...');
    expect(i18n.t('feed:placeholder')).toBe('무슨 일이 있나요?');
  });

  it('translates English keys correctly', () => {
    i18n.changeLanguage('en');
    expect(i18n.t('status:checking')).toBe('Checking status...');
    expect(i18n.t('feed:placeholder')).toBe("What's happening?");
    i18n.changeLanguage('ko');
  });
});
