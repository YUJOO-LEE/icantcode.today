import { http, HttpResponse } from 'msw';

import { API_BASE_URL } from '@/lib/constants';

export const handlers = [
  http.get(`${API_BASE_URL}/can-i-code`, () => {
    return HttpResponse.json({
      canCode: true,
      checkedAt: new Date().toISOString(),
      statusMessage: 'All systems operational',
    });
  }),

  http.get(`${API_BASE_URL}/posts`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_BASE_URL}/posts`, () => {
    return HttpResponse.json({ id: 1 });
  }),

  http.get(`${API_BASE_URL}/posts/:postId/comments`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_BASE_URL}/posts/:postId/comments`, () => {
    return HttpResponse.json({ id: 1 });
  }),
];
