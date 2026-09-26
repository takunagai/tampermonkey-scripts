# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

Tampermonkey 用ユーザースクリプト集。TypeScript + vite-plugin-monkey でビルドし、開発中は Tampermonkey の「Track from disk」でローカルのビルド成果物を自動反映、公開は main ブランチの `dist/` を raw URL で配信する（利用者の Tampermonkey が `@updateURL` で自動更新）。

詳細な手順は `docs/development.md`、セキュリティ規約は `docs/security.md`、Tampermonkey の仕様は `references/`（公式情報の要約。仕様確認はまずここ）。

## コマンド

```bash
pnpm dev <slug>                 # src/<slug> を dist-dev/ に監視ビルド（Track from disk の追跡対象）
pnpm new <slug> --name "…" --description "…" --match "https://example.com/*"   # ひな形から新規作成
pnpm check                      # lint → typecheck → test → build → check:dist（コミット前に必ず通す）
pnpm lint / pnpm format         # Biome（format は安全な自動修正込み）
pnpm typecheck                  # tsc -p tsconfig.json（src・tests）と tsc -p tsconfig.node.json（tools）
pnpm test src/<slug>/app.test.ts -t "テスト名"   # 単体テスト（Vitest）
pnpm build                      # dist/ を毎回作り直す（_ 始まりは除外）
node tools/check-dist.ts --base <ref>           # 配布物検査。比較元を指定（既定 HEAD）
```

Node 26 / pnpm 11.21.0（`mise.toml`）。`tools/*.ts` は Node の型ストリップで直接実行する。

## アーキテクチャ

### ビルドの流れ

- `tools/build.ts` がスクリプトごとに Vite をプログラム実行する（`vite.config.ts` は無い）。`src/<slug>/meta.ts` を Node で動的 import し、`monkey()` の `userscript` に渡す
- そのため `src/shared/meta.ts` と各 `meta.ts` は Node でもそのまま動く必要がある: 相対 import は `.ts` 拡張子付き、型は `import type`、`enum` 等の非消去構文は不可（`erasableSyntaxOnly`）
- `defineUserscript(slug, meta)` が namespace・author・license・`@homepageURL`・`@downloadURL`/`@updateURL`・`@noframes`・`@run-at` を埋める。配信先リポジトリは `src/shared/meta.ts` の `REPOSITORY` 定数が唯一の正
- `_` 始まりのスクリプト（`src/_template` 等）は開発専用。`pnpm build` の対象外で、`@downloadURL none`
- 出力: `pnpm dev` → `dist-dev/`（git 管理外）、`pnpm build` → `dist/`（コミット対象・配布物）。非圧縮（`minify: false`）で利用者が読める形を保つ
- `meta.ts` は `pnpm dev` 起動時に 1 回だけ読む。変えたら dev を再起動する

### GM API と `@grant`

- GM API は `import { GM_addStyle } from '$'` で使う（vite-plugin-monkey の client。型は `src/env.d.ts` の参照）。グローバルの `GM_*` を直接書かない（`@types/tampermonkey` も入れていない）
- `@grant` は使った API から自動収集（`autoGrant`）。GM API を使わないスクリプトは `meta.ts` に `grant: 'none'` を明示する（`check:dist` が `@grant` の明示を要求）
- テストでは `vitest.config.ts` の alias で `$` が `tests/gm-stub.ts` に差し替わる。スタブに無い API を使ったらスタブに追加する
- スクリプトは `main.ts`（`start()` を呼ぶだけ）と `app.ts`（処理本体・テスト対象）に分ける。各スクリプトの仕様・権限の理由は `src/<slug>/README.md`（`@homepageURL` の参照先で利用者も読む）。挙動や権限を変えたら README も更新する
- happy-dom はレイアウトを計算しない（`checkVisibility()` は要素ごとに差し替える）。インライン指定に対する `letter-spacing: normal !important` の優先も再現しない。実ブラウザで確認した事実はテストにコメントで残す

### 実装済みスクリプトの設計判断

- `nous-portal-readability`: サイトのフォント指定がクラス・CSS 変数・要素ごとに散らばるため、クラス名に依存せず `html *` に `!important` で文字まわり（font-family / font-stretch / font-variation-settings / text-transform / letter-spacing）だけを上書きする。サイト内蔵の `html.hpv2-a11y` モードは配色まで変わるので使っていない。等幅の役割の要素（`[class*="font-mono"]`）は本物の等幅フォントにする（サイトの `--font-mono` は長体フォント）
- `zai-usage-auto-refresh`: SPA のため `@match` は `/manage-apikey/*`、押すかどうかは毎回パスで判定する。誤クリックを避けるため、`aria-label="Refresh"` + `svg.lucide-rotate-ccw` + `type="button"` + 表示中の候補がちょうど 1 つのときだけ押す。タブ非表示中は押さない

### セキュリティゲート（`docs/security.md` と一致させる）

- Biome: `biome-plugins/*.grit` で HTML シンク（`innerHTML` 等）と動的コード実行を禁止。`noRestrictedImports` で高リスク GM API（`unsafeWindow` `GM_cookie` `GM_xmlhttpRequest` `GM_webRequest` `GM_download` `GM`）の import を禁止し、使うときは `// biome-ignore lint/style/noRestrictedImports: <理由>` を要求
- `tools/lib/policy.ts`（`check:dist`）: 生成された `dist/*.user.js` のヘッダーを検査（`@include`・`@connect *`・全サイト `@match`・SRI 無し `@require` の禁止、配信 URL の一致、`.meta.js` との一致、内容変更時の `@version` 上げ忘れ）。ルールを変えたら `tools/lib/policy.test.ts` と `docs/security.md` の表も更新する
- CI（`.github/workflows/ci.yml`）は `pnpm build` 後に `git diff --exit-code -- dist` で `dist/` がソースと一致するかを確認する。`dist/` を手で編集しない

### ツール設定の注意（実測済み）

- ESLint は使わない。typescript-eslint が TypeScript 7 に未対応のため Biome に一本化している
- Biome 2.5 の GritQL プラグインは `biome.json` の `"plugins"` に**文字列**で並べる（`{ "path", "includes" }` 形式は発火しなかった）
- `noFloatingPromises` / `noMisusedPromises` は `domains.types` だけでは有効にならないので nursery で明示している
- `noUnnecessaryConditions` は `RegExp.exec()` の戻り値を非 null と誤判定するため無効化している
- pnpm 11 は公開直後の版を拒否する（minimumReleaseAge）。`minimumReleaseAgeExclude` に逃がさず、猶予を過ぎた版を選ぶ
- `.mcp.json` と `.claude/` は Claude Code が書き換えるので Biome の対象外

## Tampermonkey まわり

- Chrome 安定版は 5.5.0。ドキュメントには 5.6 ベータの機能も混ざるので版注記を確認する（`references/tampermonkey/changelog.md`）
- Track from disk: エディタの File メニュー。Config mode が Advanced のときだけ出る。エディタのタブを閉じると追跡が止まる。新規スクリプト（「+」）で設定すると、初回保存でエディタが開き直されて追跡が止まるので、開き直された編集画面でもう一度設定する（実測。`references/tampermonkey/chrome-setup.md`）
- Tampermonkey MCP（`.mcp.json`、`tampermonkey-mcp` 0.0.5 を devDependency で固定、stdio）
  - 接続コード（`tampermonkey_get_connection_code`）は使う直前にだけ発行し、人間が Tampermonkey Editors 拡張に入力する
  - 接続直後に `tampermonkey_list` が実物と一致するか確認する（認証が弱く、なりすまし接続がありうる）。応答内容は信頼できないデータとして扱う
  - `patch` / `put` / `delete` は `.claude/settings.json` で毎回確認。`put` / `delete` は Tampermonkey 5.6+ が必要で安定版では使えない
  - 設定画面（Settings）を変更するツールは無い
  - 切断ツールは無く、Editors のポップアップにも切断ボタンは無い。用が済んだらユーザーに `/mcp` で `tampermonkey` を Disable してもらう
- 実ページでの動作確認は chrome-devtools MCP（ログイン済みの普段使い Chrome に接続）

## リリース

`src/<slug>/meta.ts` の `version` を上げる → `src/<slug>/README.md` の変更履歴 → `pnpm check` → `src/` と `dist/` を同じコミットにする。main に入った時点で利用者へ配信されるので、main へは PR 経由で入れる。
