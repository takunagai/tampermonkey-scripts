# Nous Portal Readability

[Nous Portal](https://portal.nousresearch.com/) の文字を読みやすくする。見た目（CSS）だけを変え、ページの操作・データには触れない。

## 対象ページ

- `https://portal.nousresearch.com/*`（ダッシュボード全体）

## 機能

| 元の表示 | 変更後 |
|---|---|
| 長体（横幅を詰めた）フォント。可変フォントの幅軸 `wdth 50` や Compressed / Condensed 系の書体 | 標準幅のフォント（Helvetica Neue ほか、OS 標準の書体） |
| `text-transform: uppercase` による大文字化（例: `BUY CREDITS`） | 本来の大文字・小文字（`Buy Credits`、モデル ID は `google/gemini-3.7-flash`） |
| ラベルの広い字間 | 標準の字間 |
| モデル ID など等幅の役割の箇所も長体フォント | 本物の等幅フォント（l/1/I、0/O を見分けやすい） |

- 表の数値は桁をそろえる（`tabular-nums`）
- 配色・レイアウト・アイコンは変えない

仕組み: サイトのフォント指定はクラス・CSS 変数・要素ごとに散らばっているため、クラス名に依存せず全要素の文字まわりの指定だけを `!important` で上書きする。サイト側のクラス名が変わっても効き続ける。

## 権限と理由

| @grant / @run-at | 理由 |
|---|---|
| `GM_addStyle` | 上書き用の CSS をページに追加するため。CSS は固定の文字列で、ページの内容を読んだり埋め込んだりしない |
| `@run-at document-start` | 元のフォントで一瞬描画されてから切り替わる（ちらつく）のを避けるため、ページの読み込み前に CSS を入れる |

通信・保存・Cookie の読み書きは一切しない。

## インストール

[dist/nous-portal-readability.user.js](../../dist/nous-portal-readability.user.js) を開き、Tampermonkey のインストール画面で「インストール」。

## 止め方

Tampermonkey のダッシュボードでこのスクリプトを無効にしてページを再読み込みする。

## 変更履歴

- 1.0.0 初版
