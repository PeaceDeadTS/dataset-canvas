/**
 * Build a Content-Disposition value that cannot inject headers.
 */
export function contentDispositionAttachment(originalName: string): string {
  const base = (originalName || 'download')
    .replace(/[/\\]/g, '')
    .replace(/[\r\n"]/g, '_')
    .slice(0, 200) || 'download';
  return `attachment; filename="${base}"; filename*=UTF-8''${encodeURIComponent(base)}`;
}
