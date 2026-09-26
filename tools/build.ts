// ユーザースクリプトのビルド。
//   pnpm build          全スクリプト（_ 始まりを除く）を dist/ に出力（配布物・コミット対象）
//   pnpm dev <slug>     1 本を dist-dev/ に出力し、変更を監視して再ビルドし続ける
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { build, type InlineConfig } from 'vite';
import monkey, { type MonkeyUserScript } from 'vite-plugin-monkey';
import { isValidSlug } from '../src/shared/meta.ts';
import { DEV_DIST_DIR, DIST_DIR, listScripts, loadMeta, ROOT } from './lib/scripts.ts';

function createConfig(
  slug: string,
  userscript: MonkeyUserScript,
  outDir: string,
  isWatch: boolean,
): InlineConfig {
  return {
    configFile: false,
    root: ROOT,
    logLevel: 'warn',
    clearScreen: false,
    plugins: [
      monkey({
        entry: `src/${slug}/main.ts`,
        userscript,
        build: {
          fileName: `${slug}.user.js`,
          // @updateURL 用の軽量ファイル（ヘッダーのみ）
          metaFileName: true,
          // 使った GM API から @grant を自動で付ける（最小権限）
          autoGrant: true,
        },
        server: { open: false },
      }),
    ],
    build: {
      outDir,
      emptyOutDir: false,
      // 配布物は圧縮しない（利用者がインストール前に読めるように）
      minify: false,
      watch: isWatch ? {} : null,
    },
  };
}

async function buildRelease(): Promise<void> {
  const slugs = await listScripts();
  // 削除したスクリプトの配布物が残らないよう毎回作り直す
  await rm(DIST_DIR, { recursive: true, force: true });
  for (const slug of slugs) {
    await build(createConfig(slug, await loadMeta(slug), DIST_DIR, false));
    console.info(`built dist/${slug}.user.js`);
  }
  if (slugs.length === 0)
    console.info('配布対象のスクリプトが無い（src/<slug>/ を作る: pnpm new <slug>）');
}

async function buildDev(slug: string): Promise<void> {
  const available = await listScripts({ includeDevOnly: true });
  if (!available.includes(slug)) {
    throw new Error(`src/${slug} が無い。候補: ${available.join(', ') || '(なし)'}`);
  }
  await build(createConfig(slug, await loadMeta(slug), DEV_DIST_DIR, true));
  const outFile = path.join(DEV_DIST_DIR, `${slug}.user.js`);
  console.info(
    [
      `watching src/${slug} -> ${path.relative(ROOT, outFile)}`,
      `Tampermonkey のエディタで File > Track from disk を選び、次のファイルを指定する:`,
      `  ${outFile}`,
      'meta.ts を変えたときはこのコマンドを再起動する（メタデータは起動時に読み込む）',
    ].join('\n'),
  );
}

const { values, positionals } = parseArgs({
  options: { dev: { type: 'boolean', default: false } },
  allowPositionals: true,
});

if (values.dev) {
  const slug = positionals[0];
  if (!slug || !isValidSlug(slug)) {
    console.error('使い方: pnpm dev <slug>（例: pnpm dev _template）');
    process.exit(1);
  }
  await buildDev(slug);
} else {
  await buildRelease();
}
