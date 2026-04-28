import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { get } from '@/apis/client';
import { POLLING_INTERVAL } from '@/lib/constants';
import { buildMockStatus, getMockStatusKey } from '@/lib/mockStatus';
import { useStatusStore } from '@/stores/statusStore';
import type { CanICodeResponse, ApiStatus } from '@/types/api';

function mapStatus(canCode: boolean): ApiStatus {
  return canCode ? 'normal' : 'down';
}

export function useStatusQuery() {
  const setStatus = useStatusStore((s) => s.setStatus);
  const mockKey = getMockStatusKey();

  const query = useQuery({
    queryKey: ['status', mockKey ?? 'live'],
    queryFn: async () => {
      if (mockKey) {
        const mock = buildMockStatus(mockKey);
        if (mock) return mock;
      }
      return get<CanICodeResponse>('/can-i-code');
    },
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (query.data) {
      setStatus({
        apiStatus: mapStatus(query.data.canCode),
        statusMessage: query.data.statusMessage,
        checkedAt: query.data.checkedAt,
        models: query.data.models ?? [],
        statusPage: query.data.statusPage ?? null,
      });
    }
  }, [query.data, setStatus]);

  useEffect(() => {
    if (query.error) {
      setStatus({
        apiStatus: 'down',
        statusMessage: 'Unable to reach API',
        checkedAt: new Date().toISOString(),
        models: [],
        statusPage: null,
      });
    }
  }, [query.error, setStatus]);

  return query;
}
