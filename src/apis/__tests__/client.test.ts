import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { get, post, ApiError } from '../client';

import { API_BASE_URL } from '@/lib/constants';

describe('API client', () => {
  describe('get', () => {
    it('fetches data successfully', async () => {
      server.use(
        http.get(`${API_BASE_URL}/test`, () => {
          return HttpResponse.json({ message: 'ok' });
        }),
      );

      const data = await get<{ message: string }>('/test');
      expect(data.message).toBe('ok');
    });

    it('appends query params', async () => {
      server.use(
        http.get(`${API_BASE_URL}/test`, ({ request }) => {
          const url = new URL(request.url);
          return HttpResponse.json({
            page: url.searchParams.get('page'),
            size: url.searchParams.get('size'),
          });
        }),
      );

      const data = await get<{ page: string; size: string }>('/test', { page: 0, size: 10 });
      expect(data.page).toBe('0');
      expect(data.size).toBe('10');
    });

    it('throws ApiError on failure', async () => {
      server.use(
        http.get(`${API_BASE_URL}/fail`, () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      await expect(get('/fail')).rejects.toThrow(ApiError);
      await expect(get('/fail')).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('post', () => {
    it('sends data successfully', async () => {
      server.use(
        http.post(`${API_BASE_URL}/test`, async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({ id: 1, received: body });
        }),
      );

      const data = await post<{ id: number }>('/test', { content: 'hello' });
      expect(data.id).toBe(1);
    });

    it('throws ApiError on failure', async () => {
      server.use(
        http.post(`${API_BASE_URL}/fail`, () => {
          return new HttpResponse(null, { status: 400 });
        }),
      );

      await expect(post('/fail', {})).rejects.toThrow(ApiError);
    });
  });
});
