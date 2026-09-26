import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { MonkeyUserScript } from 'vite-plugin-monkey';
import { isDevOnlySlug, isValidSlug } from '../../src/shared/meta.ts';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const SRC_DIR = path.join(ROOT, 'src');
export const DIST_DIR = path.join(ROOT, 'dist');
export const DEV_DIST_DIR = path.join(ROOT, 'dist-dev');

// src/ 直下でスクリプトではないディレクトリ
const NON_SCRIPT_DIRS = new Set(['shared']);

/** src/ 直下のスクリプト一覧。includeDevOnly で _ 始まり（開発専用）も含める */
export async function listScripts({ includeDevOnly = false } = {}): Promise<string[]> {
  const entries = await readdir(SRC_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !NON_SCRIPT_DIRS.has(entry.name))
    .map((entry) => entry.name)
    .filter((slug) => isValidSlug(slug) && (includeDevOnly || !isDevOnlySlug(slug)))
    .sort();
}

export async function loadMeta(slug: string): Promise<MonkeyUserScript> {
  const metaFile = path.join(SRC_DIR, slug, 'meta.ts');
  const module = (await import(pathToFileURL(metaFile).href)) as { default?: MonkeyUserScript };
  if (!module.default) {
    throw new Error(
      `${path.relative(ROOT, metaFile)} に default export（defineUserscript の結果）が無い`,
    );
  }
  return module.default;
}
