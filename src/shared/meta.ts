import type { MonkeyUserScript } from 'vite-plugin-monkey';

// 配布元・更新確認先はこのリポジトリの main ブランチの dist/ に固定する
export const REPOSITORY = 'takunagai/tampermonkey-scripts';
export const DEFAULT_BRANCH = 'main';
export const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;
export const DIST_BASE_URL = `https://raw.githubusercontent.com/${REPOSITORY}/${DEFAULT_BRANCH}/dist`;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEV_ONLY_SLUG_PATTERN = /^_[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

/** 各スクリプトが自分で決める項目。配布 URL・namespace 等は defineUserscript が埋める */
export type ScriptMeta = Omit<
  MonkeyUserScript,
  | 'name'
  | 'description'
  | 'version'
  | 'match'
  | 'namespace'
  | 'downloadURL'
  | 'updateURL'
  | 'include'
> & {
  name: string;
  description: string;
  /** SemVer（x.y.z）。挙動を変えたら必ず上げる。上げないと利用者に更新が届かない */
  version: string;
  /** @include は使わない。@match だけで対象を絞る */
  match: string[];
};

export const isDevOnlySlug = (slug: string): boolean => DEV_ONLY_SLUG_PATTERN.test(slug);

export const isValidSlug = (slug: string): boolean =>
  SLUG_PATTERN.test(slug) || isDevOnlySlug(slug);

export const distUrls = (slug: string) => ({
  downloadURL: `${DIST_BASE_URL}/${slug}.user.js`,
  updateURL: `${DIST_BASE_URL}/${slug}.meta.js`,
});

/** プロジェクト共通の既定値を適用したメタデータを作る */
export function defineUserscript(slug: string, meta: ScriptMeta): MonkeyUserScript {
  if (!isValidSlug(slug)) {
    throw new Error(`Invalid slug: "${slug}" (kebab-case のみ)`);
  }
  if (!VERSION_PATTERN.test(meta.version)) {
    throw new Error(`Invalid version for ${slug}: "${meta.version}" (x.y.z 形式)`);
  }
  if (meta.match.length === 0) {
    throw new Error(`${slug}: match を 1 つ以上指定する`);
  }
  return {
    namespace: REPOSITORY_URL,
    author: 'Taku Nagai',
    license: 'MIT',
    homepageURL: `${REPOSITORY_URL}/tree/${DEFAULT_BRANCH}/src/${slug}`,
    supportURL: `${REPOSITORY_URL}/issues`,
    noframes: true,
    'run-at': 'document-idle',
    ...meta,
    // 開発専用（_ 始まり）は配信しないので更新確認自体を止める
    ...(isDevOnlySlug(slug) ? { downloadURL: 'none' } : distUrls(slug)),
  };
}
