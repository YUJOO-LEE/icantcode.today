import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router';
import { routes } from '@/routes';
import { PRERENDER_ROUTES } from '@/constants/routes';
import {
  PAGE_META,
  ROUTE_BY_PATH,
  SITE_BASE_URL,
  resolveHead,
  serializeRouteJsonLd,
  type Lang,
} from '@/constants/pageMeta';
import AppShell from '@/AppShell';

export { PRERENDER_ROUTES, PAGE_META, ROUTE_BY_PATH, SITE_BASE_URL };

export interface RenderHead {
  title: string;
  description: string;
  canonical: string;
  ogUrl: string;
  ogTitle: string;
  ogDescription: string;
  twTitle: string;
  twDescription: string;
  routeJsonLd: string;
  htmlLang: Lang;
}

export interface RenderResult {
  html: string;
  status: number;
  head: RenderHead;
}

const handler = createStaticHandler(routes);

export async function renderRoute(url: string): Promise<RenderResult> {
  const routeKey = ROUTE_BY_PATH[url];
  if (!routeKey) {
    throw new Error(`renderRoute: no PAGE_META entry for url ${url}`);
  }
  const resolved = resolveHead(routeKey, PAGE_META[routeKey].prerenderLang);
  const head: RenderHead = {
    ...resolved,
    routeJsonLd: serializeRouteJsonLd(resolved.routeJsonLd),
  };

  const request = new Request(`http://localhost${url}`);
  const context = await handler.query(request);
  if (context instanceof Response) {
    return { html: '', status: context.status, head };
  }
  const router = createStaticRouter(handler.dataRoutes, context);
  const html = renderToString(
    <StrictMode>
      <AppShell>
        <StaticRouterProvider router={router} context={context} />
      </AppShell>
    </StrictMode>,
  );
  return { html, status: context.statusCode, head };
}
