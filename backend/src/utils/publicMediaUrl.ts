/**
 * Rewrite legacy datasets.pbc.red image hosts to the public CDN base.
 * Path is kept as-is (/media/datasets/...). External hosts (flickr, coco) are untouched.
 */

const LEGACY_MEDIA_HOSTS = new Set([
  'datasets.pbc.red',
  'www.datasets.pbc.red',
]);

export function getPublicMediaBase(): string {
  const raw = process.env.PUBLIC_MEDIA_BASE || 'https://cdn2.pbc.wiki';
  return raw.replace(/\/$/, '');
}

export function rewritePublicMediaUrl(url: string | undefined | null): string {
  if (!url) {
    return url as string;
  }

  try {
    const parsed = new URL(url);
    if (!LEGACY_MEDIA_HOSTS.has(parsed.hostname.toLowerCase())) {
      return url;
    }

    const base = new URL(getPublicMediaBase());
    parsed.protocol = base.protocol;
    parsed.host = base.host;
    return parsed.toString();
  } catch {
    return url;
  }
}
