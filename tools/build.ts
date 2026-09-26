// ユーザースクリプトのビルド。
//   pnpm build            公開スクリプト（src/、_ 始まりを除く）を dist/ に出力（配布物・コミット対象）
//   pnpm build:private    非公開スクリプト（private/、_ 始まりを除く）を dist-private/ に出力（git 管理外）
//   pnpm dev <slug>       1 本（公開・非公開どちらも）を dist-dev/ に出力し、変更を監視して再ビルドし続ける
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { build, type InlineConfig, type Plugin } from 'vite';
import monkey, { type MonkeyUserScript } from 'vite-plugin-monkey';
import { isValidSlug } from '../src/shared/meta.ts';
import {
  DEV_DIST_DIR,
  DIST_DIR,
  listAllScripts,
  loadMeta,
  PRIVATE_DIR,
  PRIVATE_DIST_DIR,
  ROOT,
  type ScriptInfo,
} from './lib/scripts.ts';

/** 公開スクリプトが private/ のコードを取り込むと配布物に混ざるので、ビルドを失敗させる */
function guardPrivateImports(script: ScriptInfo): Plugin {
  return {
    name: 'guard-private-imports',
    load(id) {
      if (
        script.visibility === 'public' &&
        path.resolve(id).startsWith(`${PRIVATE_DIR}${path.sep}`)
      ) {
        this.error(
          `公開スクリプト ${script.slug} が非公開のコードを取り込んでいる: ${path.relative(ROOT, id)}`,
        );
      }
      return null;
    },
  };
}

function createConfig(
  script: ScriptInfo,
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
      guardPrivateImports(script),
      monkey({
        entry: path.relative(ROOT, path.join(script.dir, 'main.ts')),
        userscript,
        build: {
          fileName: `${script.slug}.user.js`,
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

async function buildAll(visibility: ScriptInfo['visibility'], outDir: string): Promise<void> {
  const scripts = (await listAllScripts()).filter((script) => script.visibility === visibility);
  // 削除したスクリプトの出力が残らないよう毎回作り直す
  await rm(outDir, { recursive: true, force: true });
  for (const script of scripts) {
    await build(createConfig(script, await loadMeta(script), outDir, false));
    console.info(`built ${path.relative(ROOT, outDir)}/${script.slug}.user.js`);
  }
  if (scripts.length === 0) {
    const hint = visibility === 'public' ? 'pnpm new <slug>' : 'pnpm new <slug> --private';
    console.info(`対象のスクリプトが無い（作成: ${hint}）`);
  }
}

async function buildDev(slug: string): Promise<void> {
  const available = await listAllScripts({ includeDevOnly: true });
  const script = available.find((candidate) => candidate.slug === slug);
  if (!script) {
    throw new Error(
      `${slug} が src/ にも private/ にも無い。候補: ${available.map((s) => s.slug).join(', ') || '(なし)'}`,
    );
  }
  await build(createConfig(script, await loadMeta(script), DEV_DIST_DIR, true));
  const outFile = path.join(DEV_DIST_DIR, `${slug}.user.js`);
  console.info(
    [
      `watching ${path.relative(ROOT, script.dir)} -> ${path.relative(ROOT, outFile)}`,
      `Tampermonkey のエディタで File > Track from disk を選び、次のファイルを指定する:`,
      `  ${outFile}`,
      'meta.ts を変えたときはこのコマンドを再起動する（メタデータは起動時に読み込む）',
    ].join('\n'),
  );
}

const { values, positionals } = parseArgs({
  options: {
    dev: { type: 'boolean', default: false },
    private: { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

if (values.dev) {
  const slug = positionals[0];
  if (!slug || !isValidSlug(slug)) {
    console.error('使い方: pnpm dev <slug>（例: pnpm dev _template）');
    process.exit(1);
  }
  await buildDev(slug);
} else if (values.private) {
  await buildAll('private', PRIVATE_DIST_DIR);
} else {
  await buildAll('public', DIST_DIR);
}
