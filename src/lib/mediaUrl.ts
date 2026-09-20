/**
 * Rewrite legacy datasets.pbc.red hosts to cdn2. External URLs are left as-is.
 * VITE_PUBLIC_MEDIA_BASE is baked in at `npm run build`.
 */

const LEGACY_MEDIA_HOSTS = new Set([
  'datasets.pbc.red',
  'www.datasets.pbc.red',
]);

function getPublicMediaBase(): string {
  const raw = import.meta.env.VITE_PUBLIC_MEDIA_BASE || 'https://cdn2.pbc.wiki';
  return String(raw).replace(/\/$/, '');
}

export function publicMediaUrl(url: string | undefined | null): string {
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
