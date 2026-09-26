# 開発プロセス

TypeScript で書いたユーザースクリプトを vite-plugin-monkey でビルドし、開発中は Tampermonkey の **Track from disk** で自動反映、公開は main ブランチの `dist/` から配信する。

## 全体像

```
開発:  src/<slug>/*.ts ──pnpm dev <slug>──> dist-dev/<slug>.user.js ──Track from disk──> Tampermonkey ──> 対象ページ
                          （保存のたびに再ビルド）                  （2 秒以内に取り込み・保存）

公開:  src/<slug>/*.ts ──pnpm build──> dist/<slug>.user.js ──git push main──> raw.githubusercontent.com
                                        dist/<slug>.meta.js                       └─> 利用者の Tampermonkey が更新確認
```

- `dist-dev/` は開発用（git 管理外）、`dist/` は配布物（コミット対象）。開発中の変更が `dist/` に混ざらない
- `_` で始まるスクリプト（`src/_template` 等）は開発専用。`dist/` に出ず、`@downloadURL none` で更新確認もしない

## ディレクトリ

| パス | 内容 |
|---|---|
| `src/<slug>/meta.ts` | メタデータ（名前・説明・版・`@match`）。共通項目は `defineUserscript` が埋める |
| `src/<slug>/main.ts` | エントリ。`start()` を呼ぶだけ |
| `src/<slug>/app.ts` | 本体。テストから import できるよう処理はここ |
| `src/<slug>/app.test.ts` | Vitest + happy-dom のテスト |
| `src/<slug>/README.md` | 利用者向け説明（機能・権限と理由・変更履歴）。`@homepageURL` の参照先 |
| `src/shared/` | 共通処理（`meta.ts` 配信 URL と既定値 / `dom.ts` 要素待ち / `log.ts` ロガー） |
| `src/_template/` | ひな形。`pnpm new` のコピー元 |
| `tests/` | GM API スタブ（`gm-stub.ts`）とテスト共通設定 |
| `tools/` | ビルド・ひな形生成・配布物検査（Node 26 が TypeScript を直接実行） |
| `biome-plugins/` | Biome の独自ルール（HTML シンク・動的コード実行の禁止） |
| `references/` | Tampermonkey 公式情報の要約（仕様確認はまずここ） |

## 初回セットアップ

1. ツール: `mise install`（Node 26 / pnpm 11.21.0）→ `pnpm install`
2. Chrome: 拡張機能の Tampermonkey で「ユーザー スクリプトを許可する（Allow User Scripts）」をオン、「サイトへのアクセス」を「すべてのサイト」（`references/tampermonkey/chrome-setup.md`）
3. Tampermonkey: ダッシュボード →「設定」→「設定のモード（Config mode）」を「上級者（Advanced）」。Track from disk はこのモードでしか出ない
4. MCP（任意）: Chrome ウェブストアで「Tampermonkey Editors」を入れる。Claude Code を起動し直してプロジェクトの MCP サーバー `tampermonkey` を承認する（詳細は「Claude Code での進め方」）

## 新しいスクリプトを作る

```bash
pnpm new my-site-tweaks --name "My Site Tweaks" --description "何をするか" --match "https://example.com/*"
```

- `src/my-site-tweaks/` にひな形ができる。`--match` は複数指定できる。対象は必要な範囲に絞る
- GM API を 1 つも使わないスクリプトは `meta.ts` に `grant: 'none'` を書く（配布物検査が `@grant` の明示を求める）

## 開発ループ

1. `pnpm dev my-site-tweaks` を起動したままにする（表示された `dist-dev/...user.js` の絶対パスを控える）
2. Tampermonkey のダッシュボードで「+」（新規スクリプト）を開き、エディタ上部の **File → Track from disk** で上のファイルを選ぶ → 上書き確認で OK。保存されてエディタが「編集 - <名前>」として開き直される
3. **開き直されたエディタでもう一度 File → Track from disk** → 同じファイル → OK。新規作成時の 1 回目は取り込みと保存だけで、エディタの開き直しと同時に追跡が止まる（2026-09-26 実測）。インストール済みのスクリプトなら、その編集画面で 1 回設定すればよい
4. エディタに「このエディターは、… の変更を追跡しています。」と出て編集不可になれば追跡中。**このタブは開いたままにする**（閉じると追跡が止まる）
5. `src/` を編集・保存 → 再ビルド → Tampermonkey が取り込み保存 → 対象ページをリロードして確認（実測で保存からページ反映まで約 4 秒）
6. `meta.ts` を変えたときは `pnpm dev` を再起動する（メタデータは起動時に読む）

注意:

- 開発ビルドと配布版は同じ `@name` / `@namespace` なので、Tampermonkey 上では同じスクリプトとして上書きされる
- 追跡中はエディタで直接編集できない（ディスク側が正）
- 動作確認はブラウザの DevTools コンソール（ログは `[<slug>]` 接頭辞付き）か、Claude Code の chrome-devtools MCP で行う

## テスト

- `pnpm test`（`pnpm test:watch` で監視）。環境は happy-dom
- `import { GM_* } from '$'` はテスト時 `tests/gm-stub.ts` に差し替わる。呼び出し回数は `gm.GM_addStyle` 等で検証する。足りない API はスタブに追加する
- 最低限テストすること: 二重実行しても結果が 1 回分であること、対象要素が無いときに例外を出さないこと、タイマー・監視を止める経路があること

## 品質ゲート

```bash
pnpm check   # lint → typecheck → test → build → check:dist
```

| 段 | 内容 |
|---|---|
| `pnpm lint` | Biome（整形・lint・import 整列）。HTML シンク・動的コード実行・高リスク GM API の import を禁止（`docs/security.md`） |
| `pnpm typecheck` | TypeScript 7（`tsconfig.json` = ブラウザ側、`tsconfig.node.json` = tools） |
| `pnpm test` | Vitest |
| `pnpm build` | `dist/` を作り直す |
| `pnpm check:dist` | 配布物のポリシー検査。HEAD と比べて内容が変わったのに `@version` が上がっていなければ失敗する |

`pnpm format` で整形・安全な自動修正を適用する。

## リリース

1. `src/<slug>/meta.ts` の `version` を上げる（SemVer: 不具合修正 = patch、機能追加 = minor、対象ページや権限の大きな変更 = major）
2. `src/<slug>/README.md` の変更履歴に追記
3. `pnpm check`
4. `src/` と `dist/` を同じコミットに入れる。main への反映は PR 経由を推奨（main に入った時点で利用者へ配信される）
5. CI が `dist/` の再生成一致とポリシー検査を行う
6. 利用者の Tampermonkey は `@updateURL`（`.meta.js`）で版を比べ、上がっていれば `@downloadURL` から更新する（raw.githubusercontent.com は数分キャッシュされる）

## Claude Code での進め方

- 仕様の確認は `references/` を先に読む。無い情報は公式ドキュメントで確認して `references/` に追記する
- **Tampermonkey MCP**（`.mcp.json`、版固定 0.0.5、stdio）
  - 接続: Claude に接続コードを発行させ（`tampermonkey_get_connection_code`）、Chrome の Tampermonkey Editors 拡張のポップアップに入力する。コードの発行は使う直前だけ
  - 接続直後に `tampermonkey_list` の結果がダッシュボードの実物と一致するか確認する（なりすまし検知。`references/tampermonkey-mcp.md`）
  - 用途: インストール済みスクリプトの版・内容とリポジトリの差分確認、ストレージの確認。`patch` / `put` / `delete` は権限設定で毎回確認になる
  - Chrome 安定版（5.5.0）では `put` / `delete` は使えない（5.6+ が必要）
- **chrome-devtools MCP**（ユーザー設定済み）: ログイン済みの実ページで、スクリプトの反映をスナップショット・コンソールで確認する

## トラブルシュート

| 症状 | 確認すること |
|---|---|
| スクリプトが動かない | Chrome の「ユーザー スクリプトを許可する」/ Tampermonkey とスクリプトが有効か / `@match` が URL に合うか / ポップアップにスクリプトが出ているか |
| File メニューに Track from disk が無い | Config mode が Advanced か |
| 変更が反映されない | エディタに「…の変更を追跡しています。」が出ているか（出ていなければ保存済みスクリプトの編集画面で Track from disk をやり直す）/ `pnpm dev` が動いているか / ページをリロードしたか |
| "Limited runtime host permissions" | 「サイトへのアクセス」を「すべてのサイト」（FAQ Q306） |
| `@version` の上げ忘れで `check:dist` が落ちる | `meta.ts` の `version` を上げて `pnpm build` し直す |
