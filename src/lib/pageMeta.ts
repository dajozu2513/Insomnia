/*
 * The meta description: the site's line by default (set by LanguageProvider in
 * the visitor's language), or a page's own while that page is mounted (the
 * article pages use their excerpt). Kept outside React so the order in which
 * parent and child effects run never matters: whoever writes, the page's own
 * description wins while it is set.
 */

let siteDescription: string | null = null;
let pageDescription: string | null = null;

function apply(): void {
  const content = pageDescription ?? siteDescription;
  if (content === null) return;
  document.querySelector('meta[name="description"]')?.setAttribute('content', content);
}

/** The site's description in the current language. */
export function setSiteDescription(description: string): void {
  siteDescription = description;
  apply();
}

/** A page's own description; null when the page unmounts. */
export function setPageDescription(description: string | null): void {
  pageDescription = description;
  apply();
}
