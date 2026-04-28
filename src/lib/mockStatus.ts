/**
 * Dev-only mock harness for `/can-i-code`.
 *
 * Activates when `import.meta.env.DEV` is true AND the URL carries
 * `?mock=<key>`. `useStatusQuery` then returns the synthetic payload
 * instead of calling the real API. Production builds never trigger this.
 *
 * Scenarios:
 *
 * | Key                | What it simulates                                                |
 * |--------------------|------------------------------------------------------------------|
 * | `ok`               | All systems operational (StatusBanner does not render)           |
 * | `minor`            | statusPage indicator=minor, API component degraded               |
 * | `major`            | statusPage indicator=major, partial+major outage                 |
 * | `critical`         | statusPage indicator=critical, all components major_outage       |
 * | `maintenance`      | statusPage indicator=maintenance, API under_maintenance          |
 * | `models-fail`      | statusPage indicator=none, opus model DOWN (statusPage hidden)   |
 * | `opus-fail-minor`  | model FAIL + statusPage minor (model > statusPage priority test) |
 * | `down`             | canCode=false, statusPage absent (network/healthcheck-only down) |
 *
 * Usage:  `http://localhost:5173/?mock=opus-fail-minor`
 */
import type { CanICodeResponse } from '@/types/api';

const now = () => new Date().toISOString();

const HEALTHY_MODELS = [
  { model: 'claude-sonnet-4-6', status: 'HEALTHY', responseTimeMs: 1500 },
  { model: 'claude-opus-4-7', status: 'HEALTHY', responseTimeMs: 1455 },
  { model: 'claude-haiku-4-5-20251001', status: 'HEALTHY', responseTimeMs: 626 },
];

const MOCK_FACTORIES: Record<string, () => CanICodeResponse> = {
  minor: () => ({
    canCode: false,
    checkedAt: now(),
    statusMessage: 'Partially Degraded Service',
    models: HEALTHY_MODELS,
    statusPage: {
      indicator: 'minor',
      description: 'Partially Degraded Service',
      message: null,
      components: [
        { name: 'claude.ai', status: 'operational' },
        { name: 'Claude Console (platform.claude.com)', status: 'operational' },
        { name: 'Claude API (api.anthropic.com)', status: 'degraded_performance' },
        { name: 'Claude Code', status: 'operational' },
      ],
    },
  }),

  major: () => ({
    canCode: false,
    checkedAt: now(),
    statusMessage: 'Major Service Outage',
    models: HEALTHY_MODELS,
    statusPage: {
      indicator: 'major',
      description: 'Major Service Outage',
      message: 'Investigating elevated error rates on api.anthropic.com',
      components: [
        { name: 'claude.ai', status: 'operational' },
        { name: 'Claude Console (platform.claude.com)', status: 'partial_outage' },
        { name: 'Claude API (api.anthropic.com)', status: 'major_outage' },
        { name: 'Claude Code', status: 'partial_outage' },
      ],
    },
  }),

  critical: () => ({
    canCode: false,
    checkedAt: now(),
    statusMessage: 'Critical Service Outage',
    models: HEALTHY_MODELS,
    statusPage: {
      indicator: 'critical',
      description: 'Critical Service Outage',
      message: 'All services unavailable',
      components: [
        { name: 'claude.ai', status: 'major_outage' },
        { name: 'Claude Console (platform.claude.com)', status: 'major_outage' },
        { name: 'Claude API (api.anthropic.com)', status: 'major_outage' },
        { name: 'Claude Code', status: 'major_outage' },
      ],
    },
  }),

  maintenance: () => ({
    canCode: false,
    checkedAt: now(),
    statusMessage: 'Scheduled Maintenance',
    models: HEALTHY_MODELS,
    statusPage: {
      indicator: 'maintenance',
      description: 'Scheduled Maintenance',
      message: 'Routine database maintenance window',
      components: [
        { name: 'claude.ai', status: 'operational' },
        { name: 'Claude Console (platform.claude.com)', status: 'operational' },
        { name: 'Claude API (api.anthropic.com)', status: 'under_maintenance' },
        { name: 'Claude Code', status: 'operational' },
      ],
    },
  }),

  'opus-fail-minor': () => ({
    canCode: false,
    checkedAt: now(),
    statusMessage: 'Partially Degraded Service',
    models: [
      { model: 'claude-sonnet-4-6', status: 'HEALTHY', responseTimeMs: 1500 },
      { model: 'claude-opus-4-7', status: 'DOWN', responseTimeMs: 0 },
      { model: 'claude-haiku-4-5-20251001', status: 'HEALTHY', responseTimeMs: 800 },
    ],
    statusPage: {
      indicator: 'minor',
      description: 'Partially Degraded Service',
      message: null,
      components: [
        { name: 'claude.ai', status: 'operational' },
        { name: 'Claude Console (platform.claude.com)', status: 'operational' },
        { name: 'Claude API (api.anthropic.com)', status: 'degraded_performance' },
        { name: 'Claude Code', status: 'operational' },
      ],
    },
  }),

  'models-fail': () => ({
    canCode: false,
    checkedAt: now(),
    statusMessage: 'Model healthcheck failed',
    models: [
      { model: 'claude-sonnet-4-6', status: 'HEALTHY', responseTimeMs: 1500 },
      { model: 'claude-opus-4-7', status: 'DOWN', responseTimeMs: 0 },
      { model: 'claude-haiku-4-5-20251001', status: 'HEALTHY', responseTimeMs: 800 },
    ],
    statusPage: {
      indicator: 'none',
      description: 'All Systems Operational',
      message: null,
      components: [],
    },
  }),

  down: () => ({
    canCode: false,
    checkedAt: now(),
    statusMessage: 'API unreachable',
    models: [],
  }),

  ok: () => ({
    canCode: true,
    checkedAt: now(),
    statusMessage: 'All Systems Operational',
    models: HEALTHY_MODELS,
    statusPage: {
      indicator: 'none',
      description: 'All Systems Operational',
      message: null,
      components: [
        { name: 'claude.ai', status: 'operational' },
        { name: 'Claude Console (platform.claude.com)', status: 'operational' },
        { name: 'Claude API (api.anthropic.com)', status: 'operational' },
        { name: 'Claude Code', status: 'operational' },
      ],
    },
  }),
};

export function getMockStatusKey(): string | null {
  if (!import.meta.env.DEV) return null;
  if (typeof window === 'undefined') return null;
  const key = new URLSearchParams(window.location.search).get('mock');
  return key && key in MOCK_FACTORIES ? key : null;
}

export function buildMockStatus(key: string): CanICodeResponse | null {
  const factory = MOCK_FACTORIES[key];
  return factory ? factory() : null;
}
