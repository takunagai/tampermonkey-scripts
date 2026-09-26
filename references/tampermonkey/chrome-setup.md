---
title: Chrome で Tampermonkey 開発環境を整える手順
sources:
  - https://www.tampermonkey.net/faq.php?locale=en&q=Q209
  - https://www.tampermonkey.net/faq.php?locale=en&q=Q204
  - https://www.tampermonkey.net/faq.php?locale=en&q=Q306
  - https://www.tampermonkey.net/faq.php?locale=en&q=Q402
  - https://www.tampermonkey.net/faq.php?locale=en&q=Q404
  - https://www.tampermonkey.net/faq.php?locale=en&q=Q600
  - https://www.tampermonkey.net/changelog.php?show=dhdg（5.5.0）
  - https://chromewebstore.google.com/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo
  - Tampermonkey 5.5.0 拡張本体（~/Library/Application Support/Google/Chrome/Default/Extensions/dhdgffkkebhmkfjojejmpbldmpobfkfo/5.5.0_0/ の extension.js と _locales/{en,ja}/messages.json）
fetched: 2026-09-26
---

# Chrome で Tampermonkey 開発環境を整える

## 1. ユーザースクリプトの実行許可（必須）

5.5.0 から、スクリプトの注入には拡張機能の追加許可が必須（changelog 5.5.0 "Injecting a userscript now requires a special extension permission"、FAQ Q209）。

- Chrome 138+: Tampermonkey のツールバーアイコンを右クリック →「Manage Extension（拡張機能を管理）」→ **"Allow User Scripts"**（Tampermonkey の日本語メッセージでは「ユーザー スクリプトを許可する」）をオン
- 代替: `chrome://extensions` 右上の **Developer Mode（デベロッパー モード）** をオン
- 未設定だと Tampermonkey が「Please enable the `Allow User Scripts` extension setting.」を表示する

## 2. chrome://extensions の Tampermonkey 詳細画面

| 設定（英語 UI） | 日本語 UI（参考） | 開発での扱い |
|---|---|---|
| "Allow User Scripts" | ユーザー スクリプトを許可する | **必須**（上記 1） |
| "Site access" | サイトへのアクセス | "On all sites"。"On specific sites" だと自動更新・`GM_xmlhttpRequest` が壊れる（Q306） |
| "Allow access to file URLs" | ファイルの URL へのアクセスを許可する | `@require file://` 方式と `.user.js` のドラッグ&ドロップインストールにだけ必要（Q204・Q102）。**Track from disk には不要**（下記 4）。不要なら無効のままにする（最小権限） |

日本語 UI の表記は Chrome の版で変わりうる。英語ラベルを正とする。

## 3. Tampermonkey 側の設定

ダッシュボード →「Settings（設定）」タブ。

- **Config mode（設定のモード）** を **Advanced（上級者）** にする。モードは Novice（新参者）/ Beginner（初心者）/ Advanced（上級者）。Track from disk メニューは Advanced でしか出ない（実装上 `configMode >= 80`）。Utilities タブ・同期など多くの項目も Beginner 以上で表示される
- **Logging Level** を必要に応じて "Debug"（FAQ Q600）。Background のコンソールは `chrome://extensions` → Tampermonkey 詳細 →「Inspect views」の "service worker"（開いたままだと service worker が常駐する）
- **サンドボックスの "DOM" モードを有効にしない**（FAQ Q404: 拡張機能コンテキストで動くスクリプトはほぼ全権限を持ち、他スクリプトの改変・インストールもできる）

## 4. ローカルファイルの変更追跡 ─ 「Track from disk」（5.5.0+、Chrome）

changelog 5.5.0: "Added support for opening a local userscript file and tracking its changes on disk to speed up development"。FAQ・ドキュメントには手順が無く（GitHub Issue #2794 でも未回答）、以下は 5.5.0 拡張本体の実装と UI 文言から確定した仕様。

### 正式名と場所

- スクリプトエディタ上部の **「File（ファイル）」メニュー → 「Track from disk（ディスクから追跡する）」**
- 同じメニューに「Open（開く）」（一度だけ読み込む、Beginner 以上）と「Save to disk（ディスクに保存）」もある

### 表示条件（すべて満たすときだけメニューに出る）

- Config mode が Advanced
- エディタが有効（既定で有効）
- スクリプトが読み取り専用・システムスクリプト・外部管理スクリプトでない
- ブラウザが File System Access API（`showOpenFilePicker`）を持つ（Chrome は可。無いとメニューが無効化される）

### 動作

1. メニューを選ぶとファイル選択ダイアログ（`showOpenFilePicker`、対象 `.js` / `.user.js` / `.txt`）が開く
2. 確認ダイアログ「This will overwrite the current script with the content of $name$. Are you sure?」（「この操作により、現在のスクリプトが「$name$」の内容で上書きされます。」）で OK
3. ファイル内容をエディタに流し込み、**そのまま保存**する（メタデータブロックの変更も反映される）
4. エディタは読み取り専用になり「This editor is tracking the changes of $name$.」（「このエディターは、$name$ の変更を追跡しています。」）と表示される
5. 変更検知: `FileSystemObserver` があればそれで、無ければ **2 秒間隔のポーリング**（`File.lastModified` が増えたら再読込して保存）
6. **追跡はそのエディタのタブが開いている間だけ**。タブ・エディタを閉じると止まる（スクリプトは最後に保存された内容のまま残る）

### 使い方

**既存（保存済み）スクリプト**: その編集画面で File → Track from disk → ファイルを選ぶ → 確認で OK。エディタのタブを開いたままにすれば、以後のディスク上の変更が取り込まれる。

**新規スクリプト**（2026-09-26 に 5.5.0 で実測）:

1. ダッシュボードの「+」（新規スクリプト作成）→ File → Track from disk → ファイルを選ぶ → 確認で OK
2. ここで内容が取り込まれて保存され、エディタが保存済みスクリプト用（タブ名「編集 - <名前>」）に開き直される。**このとき追跡は止まる**（追跡中の表示が消え、エディタが編集可能に戻る）
3. 開き直されたエディタで、もう一度 File → Track from disk → 同じファイル → OK。以後は追跡が続く

実測値: ソース保存 → ビルド → 取り込み → ページのリロードで反映まで約 4 秒（エディタのタブが前面にある状態）。タブが裏に回った状態での遅延は未検証（Chrome は非表示タブのタイマーを間引くため、ポーリング方式で動いている場合は遅れうる）。

### 前提と制約

- "Allow access to file URLs" は不要（ファイル選択ダイアログ経由でユーザーが明示的に選んだファイルだけを読む）
- ファイルへの読み取り権限はそのタブのセッション限り。タブを閉じたら再度選び直す
- 追跡中はエディタで直接編集できない（ディスク側が正）

## 5. 従来のローカル開発方式（参考）

- **`@require file://` 方式**（Q402・Q204、Chrome 系のみ）: Tampermonkey 側にはメタデータブロックだけを置き、本体を `// @require file:///絶対パス/script.user.js` で読む。"Allow access to file URLs" が必要。メタデータの変更は Tampermonkey 側で手で直す必要がある
- **ドラッグ&ドロップインストール**（Q102）: "Allow access to file URLs" を有効にして `.user.js` を Chrome に落とす
- **Tampermonkey Editors 拡張**: vscode.dev（`?connectTo=tampermonkey`）でスクリプトを編集する公式サブ拡張。MCP 連携の橋渡しにも使う（`../tampermonkey-mcp.md`）
- **TamperDAV**: WebDAV 同期経由で外部エディタ編集

## 6. 保存場所・バックアップ・同期

- 拡張機能本体の配置（Q205、macOS）: `~/Library/Application Support/Google/Chrome/Default/Extensions/dhdgffkkebhmkfjojejmpbldmpobfkfo/<version>/`
- エクスポート・インポート（Q106）: ダッシュボード「Utilities」タブ（Beginner 以上）で Zip / File（JSON）/ Textarea / URL
- 同期（Q105）: Settings →「Script Sync」で Google Drive / Dropbox / WebDAV / Browser Sync

## 7. Chrome ウェブストア掲載情報（2026-09-26 時点）

- 版: 5.5.0（更新日 2026-05-09 表示。changelog 上のリリースは 2026-05-08）
- ユーザー数 約 1,200 万、評価 4.7
- manifest v3。permissions: `notifications` `unlimitedStorage` `tabs` `idle` `webNavigation` `webRequest` `webRequestBlocking` `storage` `contextMenus` `chrome://favicon/` `clipboardWrite` `cookies` `alarms` `declarativeNetRequestWithHostAccess` `scripting` `userScripts` `offscreen`、optional: `downloads`、host: `<all_urls>`（インストール済み 5.5.0 の manifest.json で実測）
- 匿名統計（版・言語・OS 種別・エラーレポート等）は設定「Anonymous statistics」で無効化できる。シークレットモードでは収集しない
