# Z.ai Usage Auto Refresh

Z.ai の GLM Coding Plan「Usage」ページで、右上のリフレッシュボタンを 1 分ごとに自動で押す。

## 対象ページ

- 動作するページ: `https://z.ai/manage-apikey/coding-plan/<プラン>/usage`（例: `/manage-apikey/coding-plan/personal/usage`）
- 注入先（`@match`）: `https://z.ai/manage-apikey/*`。画面内遷移（SPA）で Usage ページに入った場合にも動かすため、少し広めに注入し、押すかどうかは毎回 URL のパスで判定する

## 機能

- Usage ページを開いてから 1 分ごとに、リフレッシュボタン（右上の回転矢印）を押す
- タブが非表示（別タブを表示中・ウィンドウ最小化）の間は押さない。表示に戻ったとき、前回から 1 分以上たっていればすぐ 1 回押す
- 押すのは次の条件をすべて満たすボタンが**ちょうど 1 つ**あるときだけ。条件に合うボタンが無い・複数ある・押せない状態なら何もしない
  - アクセシブルネームが `Refresh`（`aria-label="Refresh"`）
  - 回転矢印アイコン（`lucide-rotate-ccw`）を含む
  - `type="button"`（フォーム送信にならない）
  - 表示されていて、無効化（`disabled` / `aria-disabled="true"`）されていない
- ページの内容は読まない。確かめるのは URL のパスとボタンの有無だけ

注意:

- Usage ページを複数のタブで表示していると、タブごとに 1 分 1 回押す
- ボタンの見た目や名前がサイト側で変わると、安全側に倒れて押さなくなる（コンソールに `[zai-usage-auto-refresh]` の警告が出る場合がある）

## 権限と理由

| @grant | 理由 |
|---|---|
| `none` | GM API を使わないため権限を持たない。ページと同じ権限でボタンを押すだけで、ページ自身ができること以上の操作はしない |

通信・保存・Cookie の読み書きは一切しない。

## インストール

[dist/zai-usage-auto-refresh.user.js](../../dist/zai-usage-auto-refresh.user.js) を開き、Tampermonkey のインストール画面で「インストール」。

## 止め方

Tampermonkey のダッシュボードでこのスクリプトを無効にしてページを再読み込みする。

## 変更履歴

- 1.0.0 初版
