import { normalizeProgress, type Progress } from './store';

// Progress lives only in this device's storage. A backup code carries it to another device, or back after the
// site's data was cleared: "SHISA1-<progress as base64url JSON>-<check>". The check catches a code cut short or
// mistyped when pasted; restoring runs it through the same repair as an old save, so older backups keep working.

const PREFIX = 'SHISA1';

function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeBackup(p: Progress): string {
  const body = toBase64Url(JSON.stringify(p));
  return `${PREFIX}-${body}-${fnv(body)}`;
}

/** The progress in a backup code, or null when the code is not one of ours or was not copied whole */
export function decodeBackup(code: string): Progress | null {
  const parts = code.replace(/\s+/g, '').split('-');
  if (parts.length !== 3 || parts[0] !== PREFIX || fnv(parts[1]) !== parts[2]) return null;
  try {
    return normalizeProgress(JSON.parse(fromBase64Url(parts[1])));
  } catch {
    return null;
  }
}

/** What a grown-up checks before restoring: how far this save has come */
export function summary(p: Progress): { owned: number; tokens: number; zones: number } {
  return { owned: p.owned.length, tokens: p.tokens, zones: Object.values(p.clears).filter((n) => n > 0).length };
}
