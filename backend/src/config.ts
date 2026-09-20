import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export function getUploadsDir(): string {
  const fromEnv = process.env.UPLOADS_DIR;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim();
  }
  return path.join(process.cwd(), 'uploads');
}

export function ensureUploadsDir(): string {
  const dir = getUploadsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Resolve a DatasetFile path after the /mnt/d -> /mnt/e move.
 * Prefer the stored absolute path; fall back to UPLOADS_DIR + basename.
 */
export function resolveStoredFilePath(storedPath: string): string {
  if (storedPath && fs.existsSync(storedPath)) {
    return storedPath;
  }
  const fallback = path.join(getUploadsDir(), path.basename(storedPath || ''));
  if (storedPath && fs.existsSync(fallback)) {
    return fallback;
  }
  return storedPath;
}

export function getListenTarget(): string | number {
  const socket = process.env.LISTEN_SOCKET;
  if (socket && socket.trim()) {
    return socket.trim();
  }
  return Number(process.env.PORT) || 5000;
}

export function getCorsOrigin(): string | string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) {
    return 'http://localhost:5173';
  }
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) {
    return 'http://localhost:5173';
  }
  return parts.length === 1 ? parts[0] : parts;
}

export function isUnixSocket(target: string | number): target is string {
  return typeof target === 'string' && target.includes('/');
}
