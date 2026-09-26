// 配布物（dist/<slug>.user.js）のセキュリティ・運用ポリシー。docs/security.md と対応させる
import { distUrls, REPOSITORY_URL } from '../../src/shared/meta.ts';
import { compareVersions, parseUserscript, valuesOf } from './userscript-header.ts';

export type Issue = { level: 'error' | 'warning'; message: string };

export type CheckInput = {
  slug: string;
  /** dist/<slug>.user.js の内容 */
  source: string;
  /** dist/<slug>.meta.js の内容。無ければ null */
  metaSource: string | null;
  /** 比較元コミットの同じファイル。新規スクリプトなら null */
  baseSource: string | null;
};

// 全サイト対象の @match を例外的に認めるスクリプト。追加はコードレビューを経る
export const ALLOW_ALL_SITES: ReadonlySet<string> = new Set<string>();

const REQUIRED_SINGLE_KEYS = [
  'name',
  'namespace',
  'version',
  'description',
  'downloadURL',
  'updateURL',
] as const;

const FORBIDDEN_KEYS: Record<string, string> = {
  include: '@match を使う（@include は緩い独自構文で、意図しないページに当たりうる）',
  unwrap: 'サンドボックスを外してページへ直接注入するため使わない',
  webRequest: 'Chrome の MV3 版 Tampermonkey では使えない',
};

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const SRI_PATTERN = /#(?:[^#]*[,;])?(?:sha256|sha384|sha512)[=-][A-Za-z0-9+/_-]+=*/;
const ALL_SITES_PATTERN = /^(?:<all_urls>|[^:]+:\/\/(?:\*|\*\.[^./]+)\/)/;
const GM_USAGE_PATTERN = /\bGM_(?!info\b)[A-Za-z]+|\bGM\.[A-Za-z]+|\bunsafeWindow\b/;
const DYNAMIC_CODE_PATTERN = /\beval\s*\(|\bnew\s+Function\s*\(/;
const XHR_GRANTS = new Set(['GM_xmlhttpRequest', 'GM.xmlHttpRequest']);

export function checkUserscript({ slug, source, metaSource, baseSource }: CheckInput): Issue[] {
  const issues: Issue[] = [];
  const error = (message: string) => issues.push({ level: 'error', message });
  const warning = (message: string) => issues.push({ level: 'warning', message });

  const parsed = parseUserscript(source);
  if (!parsed) {
    error('先頭に正しいメタデータブロック（// ==UserScript== 〜 // ==/UserScript==）が無い');
    return issues;
  }
  const { entries, headerText, body } = parsed;
  const values = (key: string) => valuesOf(entries, key);

  for (const key of REQUIRED_SINGLE_KEYS) {
    const found = values(key);
    if (found.length !== 1 || !found[0]) error(`@${key} がちょうど 1 つ必要（${found.length} 個）`);
  }

  const [version = ''] = values('version');
  if (version && !VERSION_PATTERN.test(version)) error(`@version は x.y.z 形式: "${version}"`);

  const [namespace] = values('namespace');
  if (namespace !== undefined && namespace !== REPOSITORY_URL) {
    error(`@namespace は ${REPOSITORY_URL}: "${namespace}"`);
  }

  const expectedUrls = distUrls(slug);
  const [downloadURL] = values('downloadURL');
  const [updateURL] = values('updateURL');
  if (downloadURL !== undefined && downloadURL !== expectedUrls.downloadURL) {
    error(`@downloadURL が配信元と一致しない: "${downloadURL}"`);
  }
  if (updateURL !== undefined && updateURL !== expectedUrls.updateURL) {
    error(`@updateURL が配信元と一致しない: "${updateURL}"`);
  }

  for (const [key, reason] of Object.entries(FORBIDDEN_KEYS)) {
    if (values(key).length > 0) error(`@${key} は禁止: ${reason}`);
  }
  if (values('sandbox').includes('DOM')) {
    error(
      '@sandbox DOM は禁止（拡張機能コンテキストで動くと拡張機能のほぼ全権限を持つ。FAQ Q404）',
    );
  }

  const matches = values('match');
  if (matches.length === 0) error('@match が 1 つも無い');
  for (const pattern of matches) {
    if (ALL_SITES_PATTERN.test(pattern) && !ALLOW_ALL_SITES.has(slug)) {
      error(`@match が広すぎる: "${pattern}"（対象サイトを絞る）`);
    }
  }

  const grants = values('grant');
  if (grants.length === 0) {
    error('@grant が無い。GM API を使わないなら meta.ts に grant: "none" を書く');
  }
  if (grants.includes('none')) {
    if (grants.length > 1) error('@grant none と他の @grant が混在している');
    if (GM_USAGE_PATTERN.test(body))
      error('@grant none なのに本体が GM API / unsafeWindow を参照している');
  }

  for (const target of values('connect')) {
    if (target === '*') error('@connect * は禁止（接続先ドメインを列挙する）');
  }
  if (values('connect').length > 0 && !grants.some((grant) => XHR_GRANTS.has(grant))) {
    warning('@connect があるが GM_xmlhttpRequest を使っていない（不要なら消す）');
  }

  const externalUrls = [
    ...values('require'),
    ...values('resource').map((value) => value.split(/\s+/)[1] ?? ''),
  ];
  for (const url of externalUrls) {
    if (!url.startsWith('https://')) error(`外部リソースは https のみ: "${url}"`);
    if (!SRI_PATTERN.test(url)) error(`外部リソースに SRI ハッシュ（#sha256= 等）が無い: "${url}"`);
  }

  if (values('noframes').length === 0) {
    warning('@noframes が無い（iframe 内でも実行される。意図したものか確認）');
  }

  if (DYNAMIC_CODE_PATTERN.test(body)) error('本体に eval / new Function がある');

  if (metaSource === null) {
    error(`dist/${slug}.meta.js が無い（@updateURL の参照先）`);
  } else if (metaSource.trim() !== headerText.trim()) {
    error(`dist/${slug}.meta.js のヘッダーが .user.js と一致しない（pnpm build をやり直す）`);
  }

  if (baseSource !== null && baseSource !== source) {
    const [baseVersion] = valuesOf(parseUserscript(baseSource)?.entries ?? [], 'version');
    if (baseVersion && version && compareVersions(version, baseVersion) <= 0) {
      error(
        `内容が変わったのに @version が上がっていない（${baseVersion} -> ${version}）。meta.ts の version を上げる`,
      );
    }
  }

  return issues;
}
