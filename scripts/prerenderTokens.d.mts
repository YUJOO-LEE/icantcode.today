export const META_TOKENS: readonly string[];
export const ROUTE_JSONLD_TOKEN: string;
export const HTML_LANG_PATTERN: RegExp;
export const ROOT_SLOT: string;

export interface HeadInput {
  title: string;
  description: string;
  canonical: string;
  ogUrl: string;
  ogTitle: string;
  ogDescription: string;
  twTitle: string;
  twDescription: string;
  routeJsonLd: string;
  htmlLang: string;
}

export function escapeAttr(value: unknown): string;
export function escapeText(value: unknown): string;
export function makeBlockPattern(token: string): RegExp;
export function buildBlock(token: string, head: HeadInput): string;
export function applyHeadTokens(html: string, head: HeadInput): string;
export function assertTokensPresent(template: string): void;
