import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import koCommon from '@/locales/ko/common.json';
import koFeed from '@/locales/ko/feed.json';
import koAuth from '@/locales/ko/auth.json';
import koStatus from '@/locales/ko/status.json';
import koGame from '@/locales/ko/game.json';

import enCommon from '@/locales/en/common.json';
import enFeed from '@/locales/en/feed.json';
import enAuth from '@/locales/en/auth.json';
import enStatus from '@/locales/en/status.json';
import enGame from '@/locales/en/game.json';

// Always initialize with `en` so prerendered HTML is deterministic.
// Korean speakers get a swap to `ko` client-side after hydration via the
// LanguageInitializer effect in AppShell — keeps server and first-client
// renders identical for SEO + crawlers, swaps to local language for users.
i18n.use(initReactI18next).init({
  resources: {
    ko: {
      common: koCommon,
      feed: koFeed,
      auth: koAuth,
      status: koStatus,
      game: koGame,
    },
    en: {
      common: enCommon,
      feed: enFeed,
      auth: enAuth,
      status: enStatus,
      game: enGame,
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'feed', 'auth', 'status', 'game'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: true,
  },
});

export default i18n;
