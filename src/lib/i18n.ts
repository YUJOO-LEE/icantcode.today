import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import koCommon from '@/locales/ko/common.json';
import koFeed from '@/locales/ko/feed.json';
import koAuth from '@/locales/ko/auth.json';
import koStatus from '@/locales/ko/status.json';

import enCommon from '@/locales/en/common.json';
import enFeed from '@/locales/en/feed.json';
import enAuth from '@/locales/en/auth.json';
import enStatus from '@/locales/en/status.json';

i18n.use(initReactI18next).init({
  resources: {
    ko: {
      common: koCommon,
      feed: koFeed,
      auth: koAuth,
      status: koStatus,
    },
    en: {
      common: enCommon,
      feed: enFeed,
      auth: enAuth,
      status: enStatus,
    },
  },
  lng: 'ko',
  fallbackLng: 'ko',
  ns: ['common', 'feed', 'auth', 'status'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
