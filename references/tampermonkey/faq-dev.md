---
title: Tampermonkey 開発者向け FAQ 要約
sources:
  - https://www.tampermonkey.net/faq.php?locale=en
  - https://www.tampermonkey.net/faq.php?locale=en&q=<Q番号>（各項目の見出しに URL）
fetched: 2026-09-26
---

# 開発者向け FAQ 要約

公式 FAQ（英語、全 34 問）のうち、開発・運用・セキュリティに関係する項目の要約。Chrome の初期設定手順は `chrome-setup.md` にまとめた。

## 開発に直結する項目

### Q209: ユーザースクリプト実行権限（Chrome 138+ / Developer Mode）
https://www.tampermonkey.net/faq.php?locale=en&q=Q209

- Tampermonkey 5.3+ の Chrome 系では **"Allow User Scripts"** トグル（Chrome 138+）か **Developer Mode** のどちらかが必要
- 理由: `userScripts` 権限はインストール時に警告が出ないため、Google が追加の承認を必須化した
- 手順: ツールバーアイコン右クリック →「Manage Extension」→ "Allow User Scripts"。または `chrome://extensions` 右上の Developer Mode

### Q402: 外部エディタで編集したい
https://www.tampermonkey.net/faq.php?locale=en&q=Q402

公式の案内は 3 つ（5.5.0 の Track from disk はまだ FAQ に載っていない。`chrome-setup.md` 4 章）。

1. `@require file://` 方式（Chrome 系のみ）: Tampermonkey 側はメタデータブロックだけ残し、`// @require file:///path/to/file.js` を足す。Q204 の "Allow access to file URLs" が必要
2. TamperDAV（https://github.com/Tampermonkey/TamperDAV）: WebDAV 同期経由
3. Tampermonkey Editors 拡張: vscode.dev（`?connectTo=tampermonkey`）で編集

### Q204: ローカルファイルへのアクセス許可
https://www.tampermonkey.net/faq.php?locale=en&q=Q204

- `file://` へのアクセスは Chrome 系のみ
- `chrome://extensions` → Tampermonkey の「Details」→ **"Allow access to file URLs"**
- "Site access" を "All sites" にする必要がある場合がある

### Q102: スクリプトのインストール方法
https://www.tampermonkey.net/faq.php?locale=en&q=Q102

- 手順の一つに「"Allow access to file URLs" を有効にし、`.user.js` を Chrome にドラッグ&ドロップ」がある

### Q103: includes / excludes の上書き
https://www.tampermonkey.net/faq.php?locale=en&q=Q103

- ダッシュボードでスクリプト名 →「Settings」タブの *cludes エディタ
- "Original includes" を「Add as User excludes」で除外に回せる。逆も可
- 見出し前のチェックを外すとオリジナルの includes / excludes を丸ごと無効化できる
- スクリプトを改変せずに、対象ページを利用者側で絞る手段として使える

### Q306: "Limited runtime host permissions" 警告
https://www.tampermonkey.net/faq.php?locale=en&q=Q306

- "Site access" が "On specific sites" だと出る。自動更新・`GM_xmlhttpRequest` が壊れる
- 対処: "Site access" を "All sites"

### Q404: `@sandbox` の値
https://www.tampermonkey.net/faq.php?locale=en&q=Q404

- `raw`（既定・ページコンテキスト）/ `JavaScript`（`unsafeWindow` が必要。Firefox では専用コンテキストで CSP も回避、他はページコンテキストへフォールバック）/ `DOM`（DOM のみ。有効なら拡張機能コンテキスト）
- **注意: `DOM` モードを有効化する設定は潜在的に危険**。拡張機能コンテキストのスクリプトはほぼ全権限を持ち、他スクリプトの改変・新規インストールもできる

### Q304: 必要な権限と理由
https://www.tampermonkey.net/faq.php?locale=en&q=Q304

- `notifications` / `tabs` / `idle` / `webNavigation` / `webRequest` / `storage` / `unlimitedStorage` / `contextMenus` / `chrome://favicon/` / `clipboardWrite` / `cookies` / `<all_urls>` / `downloads` の用途を一問一答で説明

### Q400: スクリプトが保存した値の閲覧・編集
https://www.tampermonkey.net/faq.php?locale=en&q=Q400

- スクリプトのエディタの「Storage」タブで `GM_setValue` の値を見られる（Config mode が Advanced のとき）

### Q600: デバッグ出力の確認
https://www.tampermonkey.net/faq.php?locale=en&q=Q600

- Settings の「Logging Level」を "Debug"
- Background のコンソール: `chrome://extensions` → Tampermonkey 詳細 →「Inspect views」の "service worker"（開いたままだと常駐し続ける）

### Q105 / Q106: 同期・エクスポート
- Q105: Settings →「Script Sync」で Google Drive / Dropbox / WebDAV / Browser Sync。競合時は新しい方を採用。Browser Sync は `@downloadURL` を持つスクリプトのみ
- Q106: 「Utilities」タブで Cloud / Zip / File（JSON）/ Textarea / URL の入出力

### Q107: タグで分類・一括トグル
- ダッシュボードでタグを作って割り当て、まとめて有効/無効を切り替える

### Q205: 拡張機能データの保存場所
- macOS: `~/Library/Application Support/Google/Chrome/Default/Extensions/[EXTENSION_ID]`

### Q408: Manifest V2 版を使い続ける
- MV3 非対応スクリプト向け。Chrome 120+ では `ExtensionManifestV2Availability` ポリシーが必要で、将来無効化されうる。新規開発では考慮しない

## その他の項目（題名のみ）

- Q100: インストール・アンインストール / Q101: 基本操作（ポップアップ・ダッシュボード）/ Q107: タグ
- Q200: スクリプトをネイティブ拡張としてインストールできるか / Q203: 拡張機能の警告表示
- Q206: 「ブラウザプロファイルが壊れている」警告 / Q207: Chrome が拡張機能データベースを消去した件
- Q208: 数回リロードしないと動かない（"pagejs missing"、Chromium バグ）
- Q300: Tampermonkey が全ページにアクセスできるのは危険か / Q301: 「Danger: Malware Ahead!」表示
- Q302: スクリプト起点のダウンロード設定 / Q303: blacklisted 表示の理由 / Q305: アンインストールできない
- Q401: Tampermonkey が重い（iframe 対策）/ Q403: 実験的 JavaScript 機能 / Q405: 全ページで起動しているように見える理由
- Q406: 公式バージョン一覧（拡張 ID）/ Q407: パッケージからのインストール / Q500・Q501: 翻訳・開発協力
