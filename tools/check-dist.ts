// dist/ の配布物をポリシー検査する。
//   pnpm check:dist                 作業ツリーの dist/ を HEAD と比べて検査
//   node tools/check-dist.ts --base <ref>   比較元コミットを指定（CI 用）
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { checkUserscript, type Issue } from './lib/policy.ts';
import { DIST_DIR, listScripts, ROOT } from './lib/scripts.ts';

const DIST_FILE_PATTERN = /^(.+)\.(user|meta)\.js$/;

function git(args: string[]): string | null {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

function resolveBase(ref: string): string | null {
  return git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])?.trim() || null;
}

const readIfExists = async (file: string) => (existsSync(file) ? readFile(file, 'utf8') : null);

const { values } = parseArgs({ options: { base: { type: 'string', default: 'HEAD' } } });
const base = resolveBase(values.base);
if (!base)
  console.info(`比較元 "${values.base}" を解決できない。@version の上げ忘れ検査は省略する`);

const slugs = await listScripts();
const distFiles = existsSync(DIST_DIR) ? await readdir(DIST_DIR) : [];
const results = new Map<string, Issue[]>();
const report = (target: string, issue: Issue) => {
  results.set(target, [...(results.get(target) ?? []), issue]);
};

for (const file of distFiles) {
  const slug = DIST_FILE_PATTERN.exec(file)?.[1];
  if (!slug || !slugs.includes(slug)) {
    report(`dist/${file}`, {
      level: 'error',
      message: 'src/ に対応するスクリプトが無い配布物（pnpm build で作り直す）',
    });
  }
}

for (const slug of slugs) {
  const target = `dist/${slug}.user.js`;
  const source = await readIfExists(path.join(DIST_DIR, `${slug}.user.js`));
  if (source === null) {
    report(target, {
      level: 'error',
      message: '配布物が無い（pnpm build で生成してコミットする）',
    });
    continue;
  }
  const issues = checkUserscript({
    slug,
    source,
    metaSource: await readIfExists(path.join(DIST_DIR, `${slug}.meta.js`)),
    baseSource: base ? git(['show', `${base}:dist/${slug}.user.js`]) : null,
  });
  for (const issue of issues) report(target, issue);
}

let errorCount = 0;
for (const [target, issues] of results) {
  for (const { level, message } of issues) {
    if (level === 'error') errorCount += 1;
    console[level === 'error' ? 'error' : 'warn'](`${level.toUpperCase()} ${target}: ${message}`);
  }
}
console.info(`check-dist: ${slugs.length} scripts, ${errorCount} errors`);
if (errorCount > 0) process.exit(1);
