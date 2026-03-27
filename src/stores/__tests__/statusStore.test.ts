import { describe, it, expect, beforeEach } from 'vitest';
import { useStatusStore } from '../statusStore';

describe('statusStore', () => {
  beforeEach(() => {
    useStatusStore.setState({
      apiStatus: 'checking',
      statusMessage: '',
      checkedAt: null,
      models: [],
    });
  });

  it('initializes with checking status', () => {
    expect(useStatusStore.getState().apiStatus).toBe('checking');
    expect(useStatusStore.getState().models).toEqual([]);
  });

  it('updates status correctly', () => {
    const models = [
      { model: 'claude-sonnet-4-6', status: 'HEALTHY', responseTimeMs: 1500 },
      { model: 'claude-opus-4-6', status: 'DEGRADED', responseTimeMs: 5000 },
    ];

    useStatusStore.getState().setStatus({
      apiStatus: 'down',
      statusMessage: 'API is down',
      checkedAt: '2026-03-09T12:00:00Z',
      models,
    });

    const state = useStatusStore.getState();
    expect(state.apiStatus).toBe('down');
    expect(state.statusMessage).toBe('API is down');
    expect(state.checkedAt).toBe('2026-03-09T12:00:00Z');
    expect(state.models).toEqual(models);
  });
});
