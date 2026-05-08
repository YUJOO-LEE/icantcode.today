import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router';
import { routes } from '@/routes';
import { PRERENDER_ROUTES } from '@/constants/routes';
import AppShell from '@/AppShell';

export { PRERENDER_ROUTES };

export interface RenderResult {
  html: string;
  status: number;
}

const handler = createStaticHandler(routes);

export async function renderRoute(url: string): Promise<RenderResult> {
  const request = new Request(`http://localhost${url}`);
  const context = await handler.query(request);
  if (context instanceof Response) {
    return { html: '', status: context.status };
  }
  const router = createStaticRouter(handler.dataRoutes, context);
  const html = renderToString(
    <StrictMode>
      <AppShell>
        <StaticRouterProvider router={router} context={context} />
      </AppShell>
    </StrictMode>,
  );
  return { html, status: context.statusCode };
}
