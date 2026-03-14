import { describe, it, expect } from 'vitest';
import { generateRandomNickname } from '../nicknameGenerator';
import { MAX_NICKNAME_LENGTH } from '../constants';

describe('generateRandomNickname', () => {
  it('returns a Korean nickname for "ko" language', () => {
    const nickname = generateRandomNickname('ko');
    expect(nickname).toBeTruthy();
    // Korean characters check (Hangul range)
    expect(nickname).toMatch(/[\uAC00-\uD7AF]/);
  });

  it('returns an English nickname for "en" language', () => {
    const nickname = generateRandomNickname('en');
    expect(nickname).toBeTruthy();
    expect(nickname).toMatch(/^[a-z_]+$/);
  });

  it('falls back to English for unsupported languages', () => {
    const nickname = generateRandomNickname('fr');
    expect(nickname).toMatch(/^[a-z_]+$/);
  });

  it('does not exceed MAX_NICKNAME_LENGTH', () => {
    for (let i = 0; i < 100; i++) {
      const koNickname = generateRandomNickname('ko');
      const enNickname = generateRandomNickname('en');
      expect(koNickname.length).toBeLessThanOrEqual(MAX_NICKNAME_LENGTH);
      expect(enNickname.length).toBeLessThanOrEqual(MAX_NICKNAME_LENGTH);
    }
  });

  it('contains underscore separator', () => {
    const nickname = generateRandomNickname('en');
    expect(nickname).toContain('_');
  });

  it('can generate different values on consecutive calls', () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(generateRandomNickname('en'));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});
