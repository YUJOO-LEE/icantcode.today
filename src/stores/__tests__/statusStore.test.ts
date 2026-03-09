import { describe, it, expect, beforeEach } from 'vitest';
import { useStatusStore } from '../statusStore';

describe('statusStore', () => {
  beforeEach(() => {
    useStatusStore.setState({
      apiStatus: 'checking',
      statusMessage: '',
      checkedAt: null,
    });
  });

  it('initializes with checking status', () => {
    expect(useStatusStore.getState().apiStatus).toBe('checking');
  });

  it('updates status correctly', () => {
    useStatusStore.getState().setStatus({
      apiStatus: 'down',
      statusMessage: 'API is down',
      checkedAt: '2026-03-09T12:00:00Z',
    });

    const state = useStatusStore.getState();
    expect(state.apiStatus).toBe('down');
    expect(state.statusMessage).toBe('API is down');
    expect(state.checkedAt).toBe('2026-03-09T12:00:00Z');
  });
});
