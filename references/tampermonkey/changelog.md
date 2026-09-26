---
title: Tampermonkey Chrome 版 変更履歴（開発者向け抜粋）
sources:
  - https://www.tampermonkey.net/changelog.php?show=dhdg
  - https://www.tampermonkey.net/changelog.php
fetched: 2026-09-26
notes: 取得できたのは 5.5.0 / 5.4.1 / 5.4.0 の 3 版分。5.3.x 以前は未取得。
---

# 変更履歴（Chrome 版・開発者向け抜粋）

## 現在の安定版

**5.5.0**（2026-05-08 リリース、ウェブストア表示は 2026-05-09）。ドキュメントには 5.6 系ベータ（v5.6.62xx+）の機能も載っているので、使う前に版注記を確認する。

## 5.5.0（2026-05-08）

- **スクリプトの注入に特別な拡張機能権限が必要になった**（"Injecting a userscript now requires a special extension permission."）。"Allow User Scripts" トグルか Developer Mode（FAQ Q209、`chrome-setup.md`）
- [Chrome] **ローカルのユーザースクリプトファイルを開き、ディスク上の変更を追跡できるようになった**（"Added support for opening a local userscript file and tracking its changes on disk to speed up development"）。エディタの File → Track from disk（`chrome-setup.md` 4 章）
- [General] **MCP（Model Context Protocol）による AI ツール連携に対応**。Tampermonkey Editors 拡張と、ユーザー操作による有効化が必要（`../tampermonkey-mcp.md`）
- [General] OS ポリシー経由のスクリプト配布（provisioning）に対応
- [General] `@run-at context-menu` のスクリプトをポップアップメニューから起動可能に
- [General] `GM_addElement` が作成要素か `null` を常に返すよう変更
- [General] 更新チェックと実際の更新処理を分離（「Automatic installation」設定で調整）
- [General] 更新時のデスクトップ通知を削減、`GM_xmlhttpRequest` の性能改善、`GM_download` の headers・`conflictAction` 修正
- [Chrome] 保存・ダウンロードのたびに任意権限（downloads）の確認が出るようになった（Download Mode を `Native` で回避）
- [Chrome] "Allow User Scripts" 有効化の検出を高速化
- [Chrome] `GM_xmlhttpRequest` の反復呼び出しで `filtered_service_worker_events` が空エントリで埋まる問題を回避

## 5.4.1（2025-11-20）

- `window.location` への相対パス設定の修正
- `GM_xmlhttpRequest` で重複キーを持つ `FormData` の送信に対応
- ストレージエディタを Ctrl+S で保存可能に
- インストール・インポート処理の改善、更新カラムの修正

## 5.4.0（2025-09-15）

- `GM_download` が `Blob` / `File` に対応
- `GM_xmlhttpRequest` で `ArrayBuffer` / `UInt8Array` の送信に対応
- スクリプトテンプレートで `$DATETIME$` 変数を使用可能に
- ストレージ実装の刷新、サンドボックスの `console` 再実装
- `pushState` によるハッシュ変更でも `onurlchange` が発火するよう修正
- エディタのリンターで次/前の問題へジャンプするコマンドを追加
- 無効化済みスクリプトと有効スクリプトの UI 上の区別を改善
- 同期で「ユーザー変更済み」フラグを導入（同期後にローカル変更が上書きされない）
- 各種修正（fetch モードの大きなレスポンス、"Message length exceeded"、大きな data: URI のダウンロード 等）
