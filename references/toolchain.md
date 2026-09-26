---
title: ユーザースクリプト開発のツールチェーンとセキュリティ慣行
sources:
  - https://github.com/Yash-Singh1/eslint-plugin-userscripts
  - https://www.npmjs.com/package/@types/tampermonkey
  - https://github.com/mozilla/eslint-plugin-no-unsanitized
  - https://www.npmjs.com/package/globals
  - https://github.com/lisonge/vite-plugin-monkey / https://vite-plugin-monkey.pages.dev/
  - https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html
  - https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html
  - https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
  - https://greasyfork.org/en/help/code-rules
  - https://greasyfork.org/en/help/external-scripts
fetched: 2026-09-26
---

# ツールチェーンとセキュリティ慣行

## バージョン表（npm レジストリ実測、2026-09-26）

| パッケージ | 最新版 | 最終リリース | 用途 |
|---|---|---|---|
| eslint | 10.11.0 | ─ | リンター本体 |
| eslint-plugin-userscripts | 0.5.6 | 2024-10-22 | メタデータブロックの検査。**約 2 年更新なし**。peer は `eslint >=8.40.0 <11` |
| eslint-plugin-no-unsanitized | 4.1.5 | 2026-02-19 | DOM XSS シンク（innerHTML 等）の検出（Mozilla）。peer `eslint ^9 \|\| ^10` |
| globals | 17.12.0 | 2026-09-01 | `globals.greasemonkey`（GM_* / unsafeWindow 等 31 個）と `globals.browser` |
| @types/tampermonkey | 5.5.0 | 2026-08-20 | GM API の型。`GM_setValues` 系・`GM_audio`・`run-in` を含む（d.ts 実測） |
| typescript | 7.0.2 | ─ | `checkJs` による JS の型検査 |
| prettier | 3.9.9 | ─ | フォーマッタ |
| @biomejs/biome | 2.5.14 | ─ | フォーマッタ兼リンター（比較用） |
| vite-plugin-monkey | 8.1.1 | 2026-08-30 | Vite でユーザースクリプトをビルド（peer `vite ^8`） |

## eslint-plugin-userscripts

- 対象は `*.user.js` のメタデータブロック。README の flat config 例は CommonJS（ESM から default import しても使える）

```js
const userscripts = require('eslint-plugin-userscripts');
module.exports = [
  {
    files: ['*.user.js'],
    plugins: { userscripts: { rules: userscripts.rules } },
    rules: { ...userscripts.configs.recommended.rules },
    settings: { userscriptVersions: { tampermonkey: '*' } },
  },
];
```

| ルール | 検査内容 |
|---|---|
| `filename-user` | ファイル名が `.user.js` か |
| `no-invalid-metadata` / `no-invalid-headers` | メタデータブロックの形式・未知のヘッダー |
| `no-invalid-grant` | `@grant` の値 |
| `require-name` / `require-description` / `require-version` / `require-download-url` | 必須ヘッダー |
| `better-use-match` | `@include` より `@match` |
| `align-attributes` / `require-attribute-space-prefix` / `metadata-spacing` | 書式 |
| `compat-grant` / `compat-headers` | `settings.userscriptVersions` のエンジン・版との互換 |
| `use-homepage-and-url` | `@homepage` と `@homepageURL` の併記 |

- 更新停止中のため、5.3 以降のヘッダー（`@run-in` 等）を未知扱いする可能性がある。導入時に実測する

## eslint-plugin-no-unsanitized

```js
import nounsanitized from 'eslint-plugin-no-unsanitized';
export default [nounsanitized.configs.recommended];
```

- `method`: `insertAdjacentHTML()` / `document.write()` 等への未サニタイズ引数
- `property`: `innerHTML` / `outerHTML` 等への未サニタイズ代入
- 定数文字列やエスケープ関数経由は許可

## TypeScript `checkJs`（ビルドなしで型検査）

- `allowJs: true` + `checkJs: true` + `noEmit: true`。ファイル単位なら先頭に `// @ts-check`
- JSDoc で型を書く（`/** @type {HTMLButtonElement | null} */`、`/** @param {string} selector */`）
- `@types/tampermonkey` は `node_modules/@types` にあれば自動で読み込まれる（`compilerOptions.types` で絞った場合は明示が必要）
- typescript 7 はネイティブ実装への移行版。JSDoc 対応の細部は 5.x と差がありうるので、導入時に実測する

## フォーマッタ

- Prettier・Biome とも `//` コメントの中身は書き換えない。メタデータブロックの本文は壊れない
- 差が出るのは前後の空行の扱い（Prettier は連続空行を 1 行に圧縮）
- メタデータの縦揃えは eslint-plugin-userscripts の `align-attributes` の担当

## 構成案の比較（事実のみ）

| 観点 | 案 A: ビルドなし `.user.js` + JSDoc + `tsc --checkJs` + ESLint | 案 B: TypeScript + vite-plugin-monkey |
|---|---|---|
| Track from disk との相性 | ソース = Tampermonkey が読むファイル。そのまま追跡できる | 追跡するならビルド成果物（`dist/*.user.js`）。dev モードは別方式 |
| dev の仕組み | 保存 → Track from disk が 2 秒以内に反映 | loader スクリプトを入れ、対象ページの `<head>` に Vite dev server のスクリプトを差し込む。ページの CSP で止まることがあり、公式は CSP 無効化拡張の併用を案内。Chrome 142+ は Local Network Access 許可も要る |
| 型安全 | JSDoc の範囲（TS 構文より表現力は低い） | TS 本来の構文。GM API も `import { GM_addStyle } from '$'` で型付き |
| 導入コスト | 依存が少ない。Vite 不要 | Vite の学習・設定。`monkey` プラグインは最後に置く等の制約 |
| 生成物 | なし（ソース = 配布物） | `dist/<name>.user.js`（任意で `.meta.js`）。`@grant` を使用 API から自動収集 |
| 向く規模 | 単一ファイルの小〜中規模 | 複数ファイル・npm 依存を束ねる中〜大規模 |

## セキュリティ慣行（一次情報）

### Greasy Fork のコード規約

- 難読化・圧縮したコードは禁止（利用者がインストール前に読めること）
- 外部ライブラリは `@require` で読む。許可 CDN、SRI ハッシュ付き URL、Greasy Fork 上のライブラリは可
- 取得したスクリプトを別サイトへ注入するのは禁止（同一オリジン内のみ）

### OWASP DOM based XSS Prevention

- 危険なシンク: `innerHTML` / `outerHTML` / `document.write()` / `insertAdjacentHTML()`、文字列を渡す `setTimeout` / `setInterval` / `new Function` / `eval`
- 安全な API: `textContent`、`createElement` + `setAttribute` + `append`（`on*` 属性には使わない）
- `JSON.stringify()` は HTML 用のエンコードではない

### Trusted Types

- ページの CSP に `require-trusted-types-for 'script'` があると、`innerHTML` への文字列代入は TypeError になる
- ユーザースクリプトは DOM API（`createElement` / `textContent`）で組み立てれば Trusted Types の有無に左右されない
