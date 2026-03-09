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
    expect(i18n.t('status:normal')).toBe('정상');
    expect(i18n.t('feed:createPost')).toBe('게시글 작성');
  });

  it('translates English keys correctly', () => {
    i18n.changeLanguage('en');
    expect(i18n.t('status:normal')).toBe('Normal');
    expect(i18n.t('feed:createPost')).toBe('Create Post');
    i18n.changeLanguage('ko');
  });
});
