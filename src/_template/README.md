# _template

新しいユーザースクリプトのひな形。`pnpm new <slug>` がこのディレクトリの `main.ts` `app.ts` `app.test.ts` をコピーし、`meta.ts` と `README.md` を生成する。

- `_` で始まるので配布ビルド（`dist/`）には出ない。開発ビルド（`pnpm dev _template`）は可能で、環境の動作確認に使う
- 対象: `https://example.com/*`。右下に「_template: active」のバッジを出す

## ファイルの役割

| ファイル | 役割 |
|---|---|
| `meta.ts` | メタデータ（名前・対象 URL・版）。配布 URL などの共通項目は `defineUserscript` が埋める |
| `main.ts` | エントリ。`start()` を呼ぶだけ |
| `app.ts` | 本体。テストから import できるよう処理はここに書く |
| `app.test.ts` | happy-dom 上のテスト。`$`（GM API）は `tests/gm-stub.ts` に差し替わる |
