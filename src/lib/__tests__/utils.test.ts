import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime, generateUUID } from '../utils';

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for less than 10 seconds ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-09T12:00:05Z'));
    expect(formatRelativeTime('2026-03-09T12:00:00Z')).toBe('just now');
  });

  it('returns "< 1m ago" for less than 1 minute ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-09T12:00:30Z'));
    expect(formatRelativeTime('2026-03-09T12:00:00Z')).toBe('< 1m ago');
  });

  it('returns minutes ago for 1-59 minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-09T12:05:00Z'));
    expect(formatRelativeTime('2026-03-09T12:00:00Z')).toBe('5m ago');
  });

  it('returns hours ago for 1-23 hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-09T15:00:00Z'));
    expect(formatRelativeTime('2026-03-09T12:00:00Z')).toBe('3h ago');
  });

  it('returns days ago for 1-6 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-11T12:00:00Z'));
    expect(formatRelativeTime('2026-03-09T12:00:00Z')).toBe('2d ago');
  });

  it('returns absolute date for 7+ days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T12:00:00Z'));
    expect(formatRelativeTime('2026-03-01T12:00:00Z')).toBe('2026-03-01');
  });
});

describe('generateUUID', () => {
  it('returns a valid UUID v4 format', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique values', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    expect(uuid1).not.toBe(uuid2);
  });
});
