# tampermonkey-scripts

[Tampermonkey](https://www.tampermonkey.net/) 用のユーザースクリプト集と、それを安全に開発・配布するための環境。

- TypeScript で書き、[vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey) でビルドする
- 開発中は Tampermonkey の **Track from disk**（ローカルファイルの変更追跡）で、保存した変更が数秒でブラウザに反映される
- 配布物（`dist/`）は CI がソースからの再生成と一致するかを検査し、セキュリティポリシー（権限の最小化・外部リソースの改ざん検知など）を機械的に強制する

## 目次

- [収録スクリプト](#収録スクリプト)
- [使う（インストール）](#使うインストール)
- [開発する](#開発する)
- [セキュリティ](#セキュリティ)
- [参考資料](#参考資料)
- [ライセンス](#ライセンス)

## 収録スクリプト

| スクリプト | 対象ページ | 概要 | 権限 | インストール |
|---|---|---|---|---|
| [Nous Portal Readability](src/nous-portal-readability/) | `portal.nousresearch.com` | 長体フォント・大文字化・広い字間を通常の表示に戻す（見た目のみ） | `GM_addStyle` | [install](https://raw.githubusercontent.com/takunagai/tampermonkey-scripts/main/dist/nous-portal-readability.user.js) |
| [Z.ai Usage Auto Refresh](src/zai-usage-auto-refresh/) | `z.ai` GLM Coding Plan の Usage | リフレッシュボタンを 1 分ごとに自動で押す（タブ非表示中は停止） | なし（`@grant none`） | [install](https://raw.githubusercontent.com/takunagai/tampermonkey-scripts/main/dist/zai-usage-auto-refresh.user.js) |

スクリプトを追加したら、この表に 1 行足す。

## 使う（インストール）

1. Chrome に [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) を入れる（5.5.0 以上）
2. ツールバーの Tampermonkey アイコンを右クリック →「拡張機能を管理」→「ユーザー スクリプトを許可する（Allow User Scripts）」をオンにする（Chrome 138 以降で必須）
3. 上の表の「インストール」リンクを開き、Tampermonkey のインストール画面で内容を確認して「インストール」

- インストール前に、各スクリプトの README の「権限と理由」（`@grant` / `@connect`）を確認してほしい
- 更新は自動。Tampermonkey が `@updateURL`（`dist/<slug>.meta.js`）で版を確認し、新しければ取り込む

## 開発する

### 必要なもの

| ツール | 版 | 備考 |
|---|---|---|
| macOS + Google Chrome | ─ | 動作確認済みの環境。Track from disk は Chrome 系で使える |
| Tampermonkey | 5.5.0 以上 | Track from disk は 5.5.0 で追加された |
| Node.js | 26 系 | `mise.toml` で指定。開発ツール（`tools/*.ts`）を Node が直接実行する |
| pnpm | 11.21.0 | `mise.toml` で指定 |
| [mise](https://mise.jdx.dev/) | 任意 | 無い場合は上の Node.js と pnpm を別の方法で用意する |

### セットアップ

```bash
git clone https://github.com/takunagai/tampermonkey-scripts.git
cd tampermonkey-scripts
mise trust     # このリポジトリの mise.toml を信頼する（初回のみ。mise を使わない場合は省略）
mise install   # Node.js と pnpm を入れる（mise を使わない場合は省略）
pnpm install
pnpm check     # すべて通れば環境は正常
```

ブラウザ側の設定（初回のみ）:

1. 「使う」の手順 2 と同じく「ユーザー スクリプトを許可する」をオン
2. `chrome://extensions` → Tampermonkey の「詳細」→「サイトへのアクセス」を「すべてのサイト」
3. Tampermonkey のダッシュボード →「設定」→「設定のモード（Config mode）」を「上級者（Advanced）」にして保存。Track from disk のメニューはこのモードでしか表示されない

### 動作確認（ひな形を動かす）

1. ひな形（`src/_template`）の開発ビルドを起動し、表示されたファイルパスを控える

   ```bash
   pnpm dev _template
   # -> dist-dev/_template.user.js の絶対パスが表示される。起動したままにする
   ```

2. Tampermonkey のダッシュボードで「+」（新規スクリプト）を開く
3. エディタ上部の「ファイル（File）」→「ディスクから追跡する（Track from disk）」を選ぶ
4. ファイル選択画面で `Cmd+Shift+G` を押して手順 1 のパスを貼り、開く → 上書きの確認で OK。スクリプトとして保存され、エディタが「編集 - Template (example.com)」として開き直される
5. **開き直されたエディタで、もう一度**「ファイル」→「ディスクから追跡する」→ 同じファイル → OK（新規作成時の 1 回目は取り込みだけで、保存と同時に追跡が止まるため）
6. エディタに「このエディターは、… の変更を追跡しています。」と出て編集不可になれば追跡中。**このタブは開いたままにする**（閉じると追跡が止まる）
7. https://example.com/ を開くと、右下に「_template: active」のバッジが出る
8. `src/_template/app.ts` の文言を変えて保存 → 数秒後に example.com をリロードすると反映されている

### 新しいスクリプトを作る

```bash
pnpm new my-site-tweaks \
  --name "My Site Tweaks" \
  --description "何をするスクリプトか" \
  --match "https://example.com/*"
```

`src/my-site-tweaks/` にひな形ができる。`--match` は複数指定できる。対象ページは必要な範囲に絞る。

| ファイル | 役割 |
|---|---|
| `meta.ts` | 名前・説明・版・対象 URL。配信 URL などの共通項目は自動で入る |
| `main.ts` | エントリ（`start()` を呼ぶだけ） |
| `app.ts` | 処理本体。GM API は `import { GM_addStyle } from '$'` のように import する |
| `app.test.ts` | テスト |
| `README.md` | 利用者向けの説明（機能・権限と理由・変更履歴） |

`@grant` は使った GM API から自動で付く。GM API を 1 つも使わない場合は `meta.ts` に `grant: 'none'` を書く。

### 開発ループ

1. `pnpm dev <slug>` を起動したままにする
2. Tampermonkey で「動作確認」の手順 2〜6 と同じく、表示された `dist-dev/<slug>.user.js` を Track from disk で追跡する（インストール済みのスクリプトなら、その編集画面で 1 回設定すればよい）
3. `src/<slug>/` を編集して保存 → 自動で再ビルド → Tampermonkey が取り込み → 対象ページをリロードして確認
4. `meta.ts` を変えたときは `pnpm dev` を再起動する

開発ビルドと配布版は同じスクリプトとして扱われる（同じ `@name` と `@namespace`）。追跡すると、インストール済みの配布版はその内容で上書きされる。

### コマンド

| コマンド | 内容 |
|---|---|
| `pnpm dev <slug>` | 開発ビルド（`dist-dev/`、変更を監視） |
| `pnpm new <slug> ...` | ひな形から新規作成 |
| `pnpm check` | 品質ゲート一式（lint → 型 → テスト → ビルド → 配布物検査） |
| `pnpm lint` / `pnpm format` | Biome による検査 / 整形と安全な自動修正 |
| `pnpm typecheck` | TypeScript の型検査 |
| `pnpm test` | テスト（`pnpm test src/<slug>/app.test.ts -t "名前"` で絞り込み、`pnpm test:watch` で監視） |
| `pnpm build` | 配布ビルド（`dist/` を作り直す。`_` で始まるスクリプトは除外） |
| `pnpm check:dist` | 配布物のポリシー検査 |

### ディレクトリ構成

```
src/
  <slug>/          スクリプト 1 本（meta.ts / main.ts / app.ts / app.test.ts / README.md）
  _template/       ひな形（開発専用。配布しない）
  shared/          共通処理（メタデータの既定値・DOM ヘルパー・ロガー）
tests/             テスト用 GM API スタブと共通設定
tools/             ビルド・ひな形生成・配布物検査（TypeScript を Node が直接実行）
biome-plugins/     Biome の独自ルール（HTML 文字列の流し込み・動的コード実行の禁止）
dist/              配布物（コミット対象。CI がソースと一致するか検査）
dist-dev/          開発ビルド（git 管理外）
docs/              開発プロセス・セキュリティ規約
references/        Tampermonkey 公式情報の要約
```

### テスト

[Vitest](https://vitest.dev/) + [happy-dom](https://github.com/capricorn86/happy-dom)。スクリプト内の `import ... from '$'`（GM API）は、テスト時に `tests/gm-stub.ts` のスタブへ差し替わる。呼び出し回数などは `gm.GM_addStyle` のように検証できる。

### リリース

1. `src/<slug>/meta.ts` の `version` を上げる（不具合修正は patch、機能追加は minor、対象ページや権限の大きな変更は major）
2. `src/<slug>/README.md` の変更履歴に追記する
3. `pnpm check`
4. `src/` と `dist/` を同じコミットに入れ、PR 経由で main に入れる。main に入った時点で利用者へ配信される
5. CI が `dist/` の再生成一致とポリシー検査を行う

内容を変えたのに `version` を上げていないと、`pnpm check:dist` と CI が失敗する（利用者に更新が届かない状態を防ぐ）。

### フォークして自分用に使う

1. `src/shared/meta.ts` の `REPOSITORY`（配信元）と `author` を自分のものに変える
2. `LICENSE` の著作権者を変える
3. 配信 URL が変わるので、残すスクリプトは `meta.ts` の `version` を上げてから `pnpm build`
4. GitHub の Settings で次を設定する（本リポジトリと同じ構成）
   - Actions を有効にする
   - Rules → Rulesets で既定ブランチ（main）に: Require a pull request（承認数 0）・Require status checks to pass（`check`、最新のブランチ必須）・Block force pushes・Restrict deletions。バイパスは誰にも与えない
   - Security → Private vulnerability reporting、Dependabot alerts、Dependabot security updates を有効にする（secret scanning と push protection は public リポジトリで既定有効）
   - GitHub アカウントの 2 要素認証を有効にする

### Claude Code で開発する（任意）

- 開発の前提はリポジトリの `AGENTS.md` にまとめている（Claude Code は組み込みプラグイン `agents-md` の既定設定で読み込む。Codex 等も同じファイルを読む）。`/config` の「Project instructions」を `claude-md`（CLAUDE.md のみ）にしていると読まれない
- **Tampermonkey MCP**（`.mcp.json` に登録済み）を使うと、インストール済みスクリプトの一覧・内容・保存値を Claude Code から確認できる
  1. Chrome に [Tampermonkey Editors](https://chromewebstore.google.com/detail/lieodnapokbjkkdkhdljlllmgkmdokcm) を入れる
  2. Claude Code を起動し、プロジェクトの MCP サーバー `tampermonkey` を承認する
  3. Claude に接続コードを発行させ、Tampermonkey Editors のポップアップ「Local editor via WebSocket」の「Connection code」に入力して Connect
  4. 用が済んだら Claude Code の `/mcp` で `tampermonkey` を Disable して切断する（ポップアップに切断ボタンは無い）。次に使うときは Enable にして接続コードを発行し直す
- この MCP は認証が弱い（`references/tampermonkey-mcp.md`）。接続コードは使う直前にだけ発行し、書き込み・削除は毎回確認が出る設定にしている
- **chrome-devtools MCP**（実ページでの動作確認用。ログイン済みの普段使い Chrome に接続する）。公式手順: https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/advanced-usage.md
  1. Chrome で `chrome://inspect/#remote-debugging` を開き、表示に従ってリモートデバッグを許可する
  2. `claude mcp add chrome-devtools --scope user -- npx chrome-devtools-mcp@latest --autoConnect` で登録する
  3. 初回に Claude が接続すると Chrome に許可ダイアログが出るので許可する。接続先は既定のプロファイルで、開いている全ウィンドウに触れられる点に注意

### うまくいかないとき

| 症状 | 確認すること |
|---|---|
| スクリプトが動かない | 「ユーザー スクリプトを許可する」がオンか / Tampermonkey とスクリプトが有効か / `@match` が URL に合っているか / インストール前から開いていたタブを再読み込みしたか（スクリプトは読み込み時に注入される） |
| File メニューに Track from disk が無い | 「設定のモード」が「上級者」か |
| 変更が反映されない | エディタに「…の変更を追跡しています。」が出ているか（出ていなければ、保存済みスクリプトの編集画面で Track from disk をやり直す）/ `pnpm dev` が動いているか / ページをリロードしたか |
| "Limited runtime host permissions" と出る | 「サイトへのアクセス」を「すべてのサイト」に |

詳しくは [docs/development.md](docs/development.md)。

## セキュリティ

ユーザースクリプトは対象ページ上でページと同じ権限で動き、自動更新で配布される。そのため次をツールで強制している（詳細: [docs/security.md](docs/security.md)）。

- HTML 文字列を DOM に流し込む API（`innerHTML` 等）と、文字列からのコード実行（`eval` 等）を禁止
- `@grant` は使った API だけ。Cookie 操作・クロスオリジン通信などの高リスク API は、理由を書かないと使えない
- `@include`・全サイト対象の `@match`・`@connect *` を禁止。外部ライブラリ（`@require`）には改ざん検知のハッシュ（SRI）が必須
- 配布物は圧縮しない（インストール前に読める）。CI がソースからの再生成と一致するかを検査
- 依存パッケージは版を固定し、公開直後の版は入れない。GitHub Actions はコミット SHA で固定

不具合・要望は [Issues](https://github.com/takunagai/tampermonkey-scripts/issues) へ。脆弱性は公開の Issue にせず、[Security タブの「Report a vulnerability」](https://github.com/takunagai/tampermonkey-scripts/security/advisories/new)から非公開で報告してほしい。

## 参考資料

- [references/](references/) ─ Tampermonkey 公式ドキュメント・FAQ・変更履歴・MCP の要約
- [Tampermonkey ドキュメント](https://www.tampermonkey.net/documentation.php) / [FAQ](https://www.tampermonkey.net/faq.php) / [変更履歴](https://www.tampermonkey.net/changelog.php)
- [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)

## ライセンス

[MIT](LICENSE)
