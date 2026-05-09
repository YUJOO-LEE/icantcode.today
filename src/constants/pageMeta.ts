import { ROUTES } from './routes';

export type RouteKey = 'home' | 'game' | 'gameFallF';
export type Lang = 'ko' | 'en';
export type ApiStatusOverlay = 'checking' | 'down';

export interface MetaCopy {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
}

export type JsonLd = Record<string, unknown>;

export interface RouteMeta {
  path: string;
  byLang: Record<Lang, MetaCopy>;
  byApiStatus?: Partial<Record<ApiStatusOverlay, Record<Lang, MetaCopy>>>;
  priority: number;
  changefreq: 'daily' | 'weekly' | 'monthly';
  prerenderLang: Lang;
  routeJsonLd?: JsonLd[];
}

export const SITE_BASE_URL = 'https://icantcode.today';

export const PAGE_META: Record<RouteKey, RouteMeta> = {
  home: {
    path: ROUTES.HOME,
    byLang: {
      ko: {
        title: 'icantcode.today — 멈춘 터미널의 쉼터',
        description:
          'Claude Code API가 멈추면 열리는 터미널 감성 개발자 커뮤니티. 코딩을 못 하는 동안, 코딩하는 척이라도 할 수 있습니다.',
      },
      en: {
        title: 'icantcode.today — a shelter for idle terminals',
        description:
          "A terminal-aesthetic developer community that opens when the Claude Code API goes down. While you can't code, at least you can look like you're coding.",
      },
    },
    byApiStatus: {
      checking: {
        ko: {
          title: '[...] Claude Code 상태 확인 중 — icantcode.today',
          description:
            'Claude Code API 가 살아 있는지 확인하는 중. 잠시만 기다려 주세요 — 장애가 확인되는 순간 피드가 열립니다.',
        },
        en: {
          title: '[...] Checking Claude Code — icantcode.today',
          description:
            'Pinging Claude Code right now. Hang tight — feed unlocks the moment we confirm an outage.',
        },
      },
      down: {
        ko: {
          title: '[DOWN] Claude Code 또 죽음 — icantcode.today',
          description:
            'Claude Code API 장애 확인. 멈춘 개발자들이 익명으로 모여 있는 터미널 피드, 지금 열려 있습니다.',
        },
        en: {
          title: '[DOWN] Claude Code is down — icantcode.today',
          description:
            "Claude Code API outage confirmed. The anonymous terminal feed is live — drop in, post, vent with everyone else who's stuck.",
        },
      },
    },
    priority: 1.0,
    changefreq: 'daily',
    prerenderLang: 'en',
  },
  game: {
    path: ROUTES.GAME,
    byLang: {
      ko: {
        title: 'Mini Games — icantcode.today',
        description:
          '코딩 손 안 갈 때 잠깐 쉬어 가는 미니게임 모음. 터미널에서 바로 굴러가는 텍스트 게임들.',
      },
      en: {
        title: 'Mini Games — icantcode.today',
        description:
          "Tiny terminal-style games for the days you can't code. No install, no signup — just open and waste five minutes.",
      },
    },
    priority: 0.7,
    changefreq: 'weekly',
    prerenderLang: 'en',
    routeJsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'icantcode.today',
            item: `${SITE_BASE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Game catalog',
            item: `${SITE_BASE_URL}${ROUTES.GAME}`,
          },
        ],
      },
    ],
  },
  gameFallF: {
    path: ROUTES.GAME_FALL_F,
    byLang: {
      ko: {
        title: 'fall-f — 터미널을 뛰어내려가는 커서',
        description:
          '←/→ 로 발판을 골라가며 커서가 터미널을 뛰어내려갑니다. 발판을 놓치거나 위로 밀려나면 끝.',
      },
      en: {
        title: 'fall-f — a cursor falling through a terminal',
        description:
          'Steer a cursor down a terminal with ←/→. Land on each ledge — miss it or stall and the run ends.',
      },
    },
    priority: 0.7,
    changefreq: 'weekly',
    prerenderLang: 'en',
    routeJsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'icantcode.today',
            item: `${SITE_BASE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Game catalog',
            item: `${SITE_BASE_URL}${ROUTES.GAME}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'fall-f',
            item: `${SITE_BASE_URL}${ROUTES.GAME_FALL_F}`,
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: 'fall-f',
        url: `${SITE_BASE_URL}${ROUTES.GAME_FALL_F}`,
        description:
          'A terminal-style keyboard arcade. Steer left and right to land on falling platforms.',
        genre: 'Arcade',
        playMode: 'SinglePlayer',
        gamePlatform: ['Web browser'],
        applicationCategory: 'Game',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        inLanguage: ['ko', 'en'],
        publisher: { '@id': `${SITE_BASE_URL}/#org` },
      },
    ],
  },
};

export const ROUTE_BY_PATH: Record<string, RouteKey> = {
  [ROUTES.HOME]: 'home',
  [ROUTES.GAME]: 'game',
  [ROUTES.GAME_FALL_F]: 'gameFallF',
};

export interface ResolvedHead {
  title: string;
  description: string;
  canonical: string;
  ogUrl: string;
  ogTitle: string;
  ogDescription: string;
  twTitle: string;
  twDescription: string;
  htmlLang: Lang;
  routeJsonLd: JsonLd[] | null;
}

export function resolveHead(
  routeKey: RouteKey,
  lang: Lang,
  apiStatus?: 'normal' | ApiStatusOverlay,
): ResolvedHead {
  const meta = PAGE_META[routeKey];
  const overlay =
    routeKey === 'home' && apiStatus && apiStatus !== 'normal'
      ? meta.byApiStatus?.[apiStatus]?.[lang]
      : undefined;
  const copy = overlay ?? meta.byLang[lang];
  const url = `${SITE_BASE_URL}${meta.path}`;
  const ogTitle = copy.ogTitle ?? copy.title;
  const ogDescription = copy.ogDescription ?? copy.description;
  return {
    title: copy.title,
    description: copy.description,
    canonical: url,
    ogUrl: url,
    ogTitle,
    ogDescription,
    twTitle: ogTitle,
    twDescription: ogDescription,
    htmlLang: lang,
    routeJsonLd: meta.routeJsonLd ?? null,
  };
}

export function serializeRouteJsonLd(routeJsonLd: JsonLd[] | null): string {
  if (!routeJsonLd || routeJsonLd.length === 0) return '';
  return `<script type="application/ld+json">\n${JSON.stringify(routeJsonLd, null, 2)}\n    </script>`;
}
