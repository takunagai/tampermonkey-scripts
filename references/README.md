# references ─ 参照資料

一次情報（公式ドキュメント・FAQ・変更履歴・ソース）を日本語で構造化した参照資料。各ファイル冒頭の frontmatter に出典 URL と取得日を書く。

| ファイル | 内容 |
|---|---|
| [tampermonkey/metadata.md](tampermonkey/metadata.md) | メタデータブロック全タグ（@match / @grant / @connect / @sandbox / SRI 等） |
| [tampermonkey/gm-api.md](tampermonkey/gm-api.md) | GM_* / GM.* API、unsafeWindow、window.onurlchange、Content Script API |
| [tampermonkey/chrome-setup.md](tampermonkey/chrome-setup.md) | Chrome の初期設定、Config mode、**Track from disk（ローカルファイル追跡）の仕様** |
| [tampermonkey/faq-dev.md](tampermonkey/faq-dev.md) | 公式 FAQ の開発者向け要約 |
| [tampermonkey/changelog.md](tampermonkey/changelog.md) | Chrome 版 5.4.0〜5.5.0 の変更点 |
| [tampermonkey-mcp.md](tampermonkey-mcp.md) | 公式 MCP サーバーの仕組み・ツール・セキュリティ上の注意 |
| [toolchain.md](toolchain.md) | ESLint プラグイン・型定義・フォーマッタ・構成案比較・セキュリティ慣行 |

## 更新の仕方

- 取得日（`fetched`）より新しい Tampermonkey がリリースされたら、変更履歴（https://www.tampermonkey.net/changelog.php?show=dhdg ）から見直す
- ドキュメントは項目ごとの URL（`documentation.php?locale=en&q=<項目>`、`faq.php?locale=en&q=<Q番号>`）で取得できる
- 公式に書かれていない挙動（Track from disk 等）は、インストール済み拡張の `extension.js` と `_locales/*/messages.json` から確認した。版が上がったら同じ方法で再確認する
