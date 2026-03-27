import { http, HttpResponse } from 'msw';

import { API_BASE_URL } from '@/lib/constants';

export const handlers = [
  http.get(`${API_BASE_URL}/can-i-code`, () => {
    return HttpResponse.json({
      canCode: true,
      checkedAt: new Date().toISOString(),
      statusMessage: 'All systems operational',
      models: [
        { model: 'claude-sonnet-4-6', status: 'HEALTHY', responseTimeMs: 1500 },
        { model: 'claude-opus-4-6', status: 'HEALTHY', responseTimeMs: 2000 },
        { model: 'claude-haiku-4-5-20251001', status: 'HEALTHY', responseTimeMs: 1000 },
      ],
    });
  }),

  http.get(`${API_BASE_URL}/posts`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '0');
    if (page > 0) return HttpResponse.json({ list: [], totalCount: 0 });
    return HttpResponse.json({ list: [], totalCount: 0 });
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
