import type { Lang } from '../i18n';

/*
 * Per-route head tags, written imperatively into <head> (the tags themselves
 * ship in index.html with the Spanish home values, so link previews and
 * crawlers that do not run JavaScript see a complete page). Every route calls
 * useHead() with its own values, in the current language; the next route
 * overwrites them, so nothing needs restoring.
 */

/** The production origin: canonical and Open Graph URLs are absolute. */
export const SITE_URL = 'https://insomnia-js.onrender.com';
export const SITE_NAME = 'Insomnia by Joel Soto';
/** 1200 x 630 share image (public/og.png; source route /og-image). */
export const OG_IMAGE = `${SITE_URL}/og.png`;

const OG_LOCALE: Record<Lang, string> = { es: 'es_CR', en: 'en_US' };

export interface HeadValues {
  title: string;
  description: string;
  /** Path of the page, e.g. "/" or "/lecturas/<slug>". */
  path: string;
  type: 'website' | 'article';
  lang: Lang;
  /** Ask search engines not to index the page (404, /lab). */
  noindex?: boolean;
  /** The page's own JSON-LD (the Organization ships in index.html). */
  jsonLd?: object;
}

function meta(attribute: 'name' | 'property', key: string, content: string | null): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (content === null) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.setAttribute('content', content);
}

function canonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.append(link);
  }
  link.href = href;
}

const PAGE_LD_ID = 'ld-page';

function pageJsonLd(data: object | undefined): void {
  let script = document.getElementById(PAGE_LD_ID);
  if (!data) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.id = PAGE_LD_ID;
    script.setAttribute('type', 'application/ld+json');
    document.head.append(script);
  }
  script.textContent = JSON.stringify(data);
}

/** Writes every head tag for the page. */
export function applyHead(values: HeadValues): void {
  const url = `${SITE_URL}${values.path}`;
  const other: Lang = values.lang === 'es' ? 'en' : 'es';
  document.title = values.title;
  meta('name', 'description', values.description);
  meta('name', 'robots', values.noindex ? 'noindex' : null);
  canonical(url);
  meta('property', 'og:title', values.title);
  meta('property', 'og:description', values.description);
  meta('property', 'og:url', url);
  meta('property', 'og:type', values.type);
  meta('property', 'og:locale', OG_LOCALE[values.lang]);
  meta('property', 'og:locale:alternate', OG_LOCALE[other]);
  meta('name', 'twitter:title', values.title);
  meta('name', 'twitter:description', values.description);
  pageJsonLd(values.jsonLd);
}
