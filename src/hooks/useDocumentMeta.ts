import { useEffect } from 'react';

type ApiStatus = 'normal' | 'checking' | 'down';
type Lang = 'ko' | 'en';

interface DocumentMetaOptions {
  apiStatus: ApiStatus;
  lang: Lang;
}

const META_MAP: Record<ApiStatus, Record<Lang, { title: string; description: string }>> = {
  normal: {
    ko: {
      title: 'icantcode.today — Claude Code outage community',
      description:
        'Claude Code API가 다운됐을 때 개발자들이 모이는 커뮤니티. A developer community that activates only when Claude Code goes down.',
    },
    en: {
      title: 'icantcode.today — Claude Code outage community',
      description:
        'A developer community that activates only when the Claude Code API goes down. No login required.',
    },
  },
  checking: {
    ko: {
      title: '[...] icantcode.today — Claude Code 상태 확인 중',
      description:
        'Claude Code API 상태 확인 중... icantcode.today에서 실시간 상태를 확인하세요.',
    },
    en: {
      title: '[...] icantcode.today — checking Claude Code status',
      description: 'Checking Claude Code API status... Visit icantcode.today for real-time updates.',
    },
  },
  down: {
    ko: {
      title: '[DOWN] icantcode.today — Claude Code API 장애 중',
      description:
        'Claude Code API 장애 발생! 지금 icantcode.today에서 다른 개발자들과 소통하세요. Community feed is now open.',
    },
    en: {
      title: '[DOWN] icantcode.today — Claude Code API is down',
      description:
        "Claude Code API is down! Join the community at icantcode.today to connect with other developers. Feed is now open.",
    },
  },
};

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useDocumentMeta({ apiStatus, lang }: DocumentMetaOptions): void {
  useEffect(() => {
    const meta = META_MAP[apiStatus][lang];

    document.title = meta.title;
    document.documentElement.lang = lang;

    setMeta('description', meta.description);
    setMeta('og:title', meta.title, true);
    setMeta('og:description', meta.description, true);
    setMeta('og:locale', lang === 'ko' ? 'ko_KR' : 'en_US', true);
  }, [apiStatus, lang]);
}
