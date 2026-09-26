import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { MonkeyUserScript } from 'vite-plugin-monkey';
import { isDevOnlySlug, isValidSlug } from '../../src/shared/meta.ts';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const SRC_DIR = path.join(ROOT, 'src');
export const DIST_DIR = path.join(ROOT, 'dist');
export const DEV_DIST_DIR = path.join(ROOT, 'dist-dev');
// 非公開スクリプト。private/ はこのリポジトリでは git 管理外（別の private リポジトリ）
export const PRIVATE_DIR = path.join(ROOT, 'private');
export const PRIVATE_DIST_DIR = path.join(ROOT, 'dist-private');

export type Visibility = 'public' | 'private';

export type ScriptInfo = {
  slug: string;
  visibility: Visibility;
  /** スクリプトのディレクトリ（絶対パス） */
  dir: string;
};

// src/ 直下でスクリプトではないディレクトリ
const NON_SCRIPT_DIRS = new Set(['shared']);

async function scan(baseDir: string, visibility: Visibility): Promise<ScriptInfo[]> {
  if (!existsSync(baseDir)) return [];
  const entries = await readdir(baseDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !NON_SCRIPT_DIRS.has(entry.name))
    .filter((entry) => isValidSlug(entry.name))
    .filter((entry) => existsSync(path.join(baseDir, entry.name, 'meta.ts')))
    .map((entry) => ({ slug: entry.name, visibility, dir: path.join(baseDir, entry.name) }));
}

/**
 * 公開（src/）と非公開（private/）のスクリプト一覧。includeDevOnly で _ 始まり（開発専用）も含める。
 * slug は公開・非公開をまたいで一意（dist-dev/ の出力名が衝突するため）
 */
export async function listAllScripts({ includeDevOnly = false } = {}): Promise<ScriptInfo[]> {
  const scripts = [...(await scan(SRC_DIR, 'public')), ...(await scan(PRIVATE_DIR, 'private'))]
    .filter((script) => includeDevOnly || !isDevOnlySlug(script.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const seen = new Set<string>();
  for (const { slug } of scripts) {
    if (seen.has(slug)) throw new Error(`slug "${slug}" が src/ と private/ で重複している`);
    seen.add(slug);
  }
  return scripts;
}

/** 公開スクリプト（src/）の slug 一覧。配布物（dist/）の対象 */
export async function listScripts({ includeDevOnly = false } = {}): Promise<string[]> {
  return (await listAllScripts({ includeDevOnly }))
    .filter((script) => script.visibility === 'public')
    .map((script) => script.slug);
}

export async function loadMeta(script: ScriptInfo): Promise<MonkeyUserScript> {
  const metaFile = path.join(script.dir, 'meta.ts');
  const module = (await import(pathToFileURL(metaFile).href)) as { default?: MonkeyUserScript };
  if (!module.default) {
    throw new Error(
      `${path.relative(ROOT, metaFile)} に default export（define*Userscript の結果）が無い`,
    );
  }
  return module.default;
}

/** 非公開スクリプトの流出検査用。これらのパスが git の除外対象になっていることを check-dist で確かめる */
export const PRIVATE_IGNORE_PROBES = ['private/probe/main.ts', 'dist-private/probe.user.js'];
