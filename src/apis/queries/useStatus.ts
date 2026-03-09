import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { get } from '@/apis/client';
import { POLLING_INTERVAL } from '@/lib/constants';
import { useStatusStore } from '@/stores/statusStore';
import type { CanICodeResponse, ApiStatus } from '@/types/api';

function mapStatus(canCode: boolean): ApiStatus {
  return canCode ? 'normal' : 'down';
}

export function useStatusQuery() {
  const setStatus = useStatusStore((s) => s.setStatus);

  const query = useQuery({
    queryKey: ['status'],
    queryFn: () => get<CanICodeResponse>('/can-i-code'),
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (query.data) {
      setStatus({
        apiStatus: mapStatus(query.data.canCode),
        statusMessage: query.data.statusMessage,
        checkedAt: query.data.checkedAt,
      });
    }
  }, [query.data, setStatus]);

  useEffect(() => {
    if (query.error) {
      setStatus({
        apiStatus: 'down',
        statusMessage: 'Unable to reach API',
        checkedAt: new Date().toISOString(),
      });
    }
  }, [query.error, setStatus]);

  return query;
}
