import { useEffect } from 'react';
import {
  resolveHead,
  type ApiStatusOverlay,
  type Lang,
  type RouteKey,
} from '@/constants/pageMeta';

type ApiStatus = 'normal' | ApiStatusOverlay;

interface DocumentMetaInput {
  route: RouteKey;
  lang: Lang;
  /** Only meaningful for `route === 'home'`. Other routes ignore this. */
  apiStatus?: ApiStatus;
}

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

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useDocumentMeta({ route, lang, apiStatus }: DocumentMetaInput): void {
  useEffect(() => {
    const head = resolveHead(route, lang, apiStatus);

    document.title = head.title;
    document.documentElement.lang = head.htmlLang;

    setMeta('description', head.description);
    setMeta('og:title', head.ogTitle, true);
    setMeta('og:description', head.ogDescription, true);
    setMeta('og:url', head.ogUrl, true);
    setMeta('og:locale', lang === 'ko' ? 'ko_KR' : 'en_US', true);
    setMeta('twitter:title', head.twTitle);
    setMeta('twitter:description', head.twDescription);
    setLink('canonical', head.canonical);
  }, [route, lang, apiStatus]);
}
