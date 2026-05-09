import { Navigate } from 'react-router';
import type { RouteObject } from 'react-router';
import Layout from '@/components/layout/Layout';
import RouteErrorElement from '@/components/common/RouteErrorElement';
import HomePage from '@/pages/HomePage';
import { ROUTE_SEGMENT, ROUTES } from '@/constants/routes';
import { lazyRoute } from '@/lib/lazyRoute';

export const routes: RouteObject[] = [
  {
    Component: Layout,
    errorElement: <RouteErrorElement />,
    children: [
      { index: true, Component: HomePage },
      {
        path: ROUTE_SEGMENT.GAME,
        children: [
          {
            index: true,
            lazy: lazyRoute(() => import('@/components/game/CatalogPage')),
          },
          {
            path: ROUTE_SEGMENT.FALL_F,
            lazy: lazyRoute(() => import('@/components/game/fall-f/FallFGame')),
          },
          { path: '*', element: <Navigate to={ROUTES.GAME} replace /> },
        ],
      },
      { path: '*', element: <Navigate to={ROUTES.HOME} replace /> },
    ],
  },
];
