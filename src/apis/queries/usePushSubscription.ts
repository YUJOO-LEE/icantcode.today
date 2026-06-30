import { useMutation } from '@tanstack/react-query';
import { post } from '@/apis/client';
import type {
  PushSubscribeRequest,
  PushUnsubscribeRequest,
  PushSubscribeResponse,
} from '@/types/api';

/** Register a browser push subscription with the backend so it can send pushes. */
export function useSubscribePush() {
  return useMutation({
    mutationFn: (data: PushSubscribeRequest) =>
      post<PushSubscribeResponse>('/push/subscribe', data),
  });
}

/** Tell the backend to stop pushing to a (now removed) subscription. */
export function useUnsubscribePush() {
  return useMutation({
    mutationFn: (data: PushUnsubscribeRequest) =>
      post<PushSubscribeResponse>('/push/unsubscribe', data),
  });
}
