// 新しいユーザースクリプトを src/_template から作る。
//   pnpm new <slug> --name "表示名" --description "説明" --match "https://example.com/*" [--match ...]
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { isDevOnlySlug, isValidSlug } from '../src/shared/meta.ts';
import { ROOT, SRC_DIR } from './lib/scripts.ts';

const TEMPLATE_SLUG = '_template';
const COPIED_FILES = ['main.ts', 'app.ts', 'app.test.ts'];

const { values, positionals } = parseArgs({
  options: {
    name: { type: 'string' },
    description: { type: 'string' },
    match: { type: 'string', multiple: true },
  },
  allowPositionals: true,
});

const slug = positionals[0];
const { name, description, match } = values;

if (!slug || !name || !description || !match?.length) {
  console.error(
    '使い方: pnpm new <slug> --name "表示名" --description "説明" --match "https://example.com/*"',
  );
  process.exit(1);
}
if (!isValidSlug(slug) || isDevOnlySlug(slug)) {
  console.error(`slug は kebab-case（例: my-site-tweaks）: "${slug}"`);
  process.exit(1);
}
for (const pattern of match) {
  if (!/^(https?|\*):\/\/[^/]+\/.*$/.test(pattern)) {
    console.error(`@match の形式ではない: "${pattern}"（例: https://example.com/*）`);
    process.exit(1);
  }
}

const targetDir = path.join(SRC_DIR, slug);
if (existsSync(targetDir)) {
  console.error(`既に存在する: src/${slug}`);
  process.exit(1);
}
await mkdir(targetDir, { recursive: true });

for (const file of COPIED_FILES) {
  const source = await readFile(path.join(SRC_DIR, TEMPLATE_SLUG, file), 'utf8');
  await writeFile(path.join(targetDir, file), source.replaceAll(TEMPLATE_SLUG, slug));
}

const literal = (value: string) => JSON.stringify(value);
await writeFile(
  path.join(targetDir, 'meta.ts'),
  `import { defineUserscript } from '../shared/meta.ts';

export default defineUserscript(${literal(slug)}, {
  name: ${literal(name)},
  description: ${literal(description)},
  version: '0.1.0',
  match: [${match.map(literal).join(', ')}],
  // @grant は使った GM API から自動で付く。GM API を使わないなら grant: 'none' を書く
});
`,
);

await writeFile(
  path.join(targetDir, 'README.md'),
  `# ${name}

${description}

## 対象ページ

${match.map((pattern) => `- \`${pattern}\``).join('\n')}

## 機能

-

## 権限と理由

| @grant / @connect | 理由 |
|---|---|
| | |

## インストール

[dist/${slug}.user.js](../../dist/${slug}.user.js) を開き、Tampermonkey のインストール画面で「Install」。

## 変更履歴

- 0.1.0 初版
`,
);

// ひな形由来の書式をプロジェクト規約（Biome）にそろえる
execFileSync('pnpm', ['exec', 'biome', 'check', '--write', path.relative(ROOT, targetDir)], {
  cwd: ROOT,
  stdio: 'inherit',
});

console.info(`created src/${slug}. 次: pnpm dev ${slug}`);
