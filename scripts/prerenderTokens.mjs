// Token-replacement primitives shared by scripts/prerender.mjs and vite.config.ts.

export const META_TOKENS = [
  'title',
  'description',
  'canonical',
  'hreflang',
  'og:url',
  'og:title',
  'og:description',
  'og:locale',
  'twitter:title',
  'twitter:description',
];

export const ROUTE_JSONLD_TOKEN = '<!-- prerender:route-jsonld -->';
export const HTML_LANG_PATTERN = /<html lang="[a-z]{2}"/;
export const ROOT_SLOT = '<div id="root"></div>';

export function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function makeBlockPattern(token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `<!-- prerender:${escaped}:start -->[\\s\\S]*?<!-- prerender:${escaped}:end -->`,
  );
}

function localeForLang(lang) {
  return lang === 'ko' ? 'ko_KR' : 'en_US';
}

function buildInner(token, head) {
  switch (token) {
    case 'title':
      return `<title>${escapeText(head.title)}</title>`;
    case 'description':
      return `<meta name="description" content="${escapeAttr(head.description)}" />`;
    case 'canonical':
      return `<link rel="canonical" href="${escapeAttr(head.canonical)}" />`;
    case 'hreflang': {
      const url = escapeAttr(head.canonical);
      return `<link rel="alternate" hreflang="ko" href="${url}" /><link rel="alternate" hreflang="en" href="${url}" /><link rel="alternate" hreflang="x-default" href="${url}" />`;
    }
    case 'og:url':
      return `<meta property="og:url" content="${escapeAttr(head.ogUrl)}" />`;
    case 'og:title':
      return `<meta property="og:title" content="${escapeAttr(head.ogTitle)}" />`;
    case 'og:description':
      return `<meta property="og:description" content="${escapeAttr(head.ogDescription)}" />`;
    case 'og:locale': {
      const primary = localeForLang(head.htmlLang);
      const alternate = head.htmlLang === 'ko' ? 'en_US' : 'ko_KR';
      return `<meta property="og:locale" content="${primary}" /><meta property="og:locale:alternate" content="${alternate}" />`;
    }
    case 'twitter:title':
      return `<meta name="twitter:title" content="${escapeAttr(head.twTitle)}" />`;
    case 'twitter:description':
      return `<meta name="twitter:description" content="${escapeAttr(head.twDescription)}" />`;
    default:
      throw new Error(`prerender: unknown token "${token}"`);
  }
}

// Output keeps the start/end markers so successive passes (vite plugin → prerender.mjs) can re-replace.
export function buildBlock(token, head) {
  return `<!-- prerender:${token}:start -->${buildInner(token, head)}<!-- prerender:${token}:end -->`;
}

export function applyHeadTokens(html, head) {
  let out = html;
  for (const token of META_TOKENS) {
    out = out.replace(makeBlockPattern(token), buildBlock(token, head));
  }
  out = out.replace(
    ROUTE_JSONLD_TOKEN,
    head.routeJsonLd ? `${head.routeJsonLd}\n    ${ROUTE_JSONLD_TOKEN}` : ROUTE_JSONLD_TOKEN,
  );
  out = out.replace(HTML_LANG_PATTERN, `<html lang="${head.htmlLang}"`);
  return out;
}

export function assertTokensPresent(template) {
  for (const token of META_TOKENS) {
    if (!makeBlockPattern(token).test(template)) {
      throw new Error(
        `prerender: token "${token}" not found — verify <!-- prerender:${token}:start --> ... <!-- prerender:${token}:end --> markers are intact in index.html`,
      );
    }
  }
  if (!template.includes(ROUTE_JSONLD_TOKEN)) {
    throw new Error(`prerender: ${ROUTE_JSONLD_TOKEN} slot not found`);
  }
  if (!HTML_LANG_PATTERN.test(template)) {
    throw new Error('prerender: <html lang="..."> attribute not found');
  }
}
