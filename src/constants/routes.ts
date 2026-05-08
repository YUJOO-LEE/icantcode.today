export const ROUTE_SEGMENT = {
  GAME: 'game',
  FALL_F: 'fall-f',
} as const;

export const ROUTES = {
  HOME: '/',
  GAME: `/${ROUTE_SEGMENT.GAME}`,
  GAME_FALL_F: `/${ROUTE_SEGMENT.GAME}/${ROUTE_SEGMENT.FALL_F}`,
} as const;

export const PRERENDER_ROUTES = [ROUTES.HOME, ROUTES.GAME, ROUTES.GAME_FALL_F] as const;
