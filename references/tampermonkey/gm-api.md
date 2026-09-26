---
title: Tampermonkey ユーザースクリプト API リファレンス（GM_* / GM.* / unsafeWindow / window.* / Content Script API）
sources:
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_addElement
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_addStyle
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_audio
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_cookie
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_download
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_getResource
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_info
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_log
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_notification
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_openInTab
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_registerMenuCommand
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_setClipboard
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_tabs
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_values
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_webRequest
  - https://www.tampermonkey.net/documentation.php?locale=en&q=GM_xmlhttpRequest
  - https://www.tampermonkey.net/documentation.php?locale=en&q=unsafeWindow
  - https://www.tampermonkey.net/documentation.php?locale=en&q=window
  - https://www.tampermonkey.net/documentation.php?locale=en&q=content_script_api
fetched: 2026-09-26
notes: 公式ドキュメント（英語）を日本語で再構成。原文の全文転載はしていない。メタデータタグの詳細は metadata.md。ドキュメントは 5.6 系ベータの機能（v5.6.62xx+ 表記）も含む。Chrome 安定版は 5.5.0（changelog.md）。
---

# ユーザースクリプト API リファレンス

## 索引

危険度: 高 = 同一生成元制約の回避・Cookie 操作・ページ JS 空間への直接アクセス / 中 = CSP 回避・ファイル・クリップボード・タブ制御など外部作用 / 低 = 読み取り専用またはスクリプト内に閉じた操作。

| API | 必要な @grant | Promise 版（GM.*） | バージョン注記 | 危険度 |
|---|---|---|---|---|
| GM_addElement | `GM_addElement` | GM.addElement | ─ | 中（CSP を迂回して要素を注入できる） |
| GM_addStyle | `GM_addStyle` | GM.addStyle | ─ | 低 |
| GM_audio.* | `GM_audio` | GM.audio | ─ | 中（タブの音声状態を操作） |
| GM_cookie.list/set/delete | `GM_cookie` | GM.cookie | partitionKey v5.2+、httpOnly 取得は BETA のみ | 高 |
| GM_download | `GM_download` | GM.download | anonymous v5.5+、Blob/File v5.4.6226+ | 中 |
| GM_getResourceText / URL | 各名 | GM.getResourceText / **GM.getResourceUrl** | ─ | 低 |
| GM_info | 不要 | ─（プロパティ） | sandboxMode 4.18+、userAgentData 4.19+、container・run-in 5.3+ | 低 |
| GM_log | `GM_log` | ─ | ─ | 低 |
| GM_notification | `GM_notification` | GM.notification | tag・url v5.0+ | 低 |
| GM_openInTab | `GM_openInTab` | GM.openInTab | ─ | 中 |
| GM_registerMenuCommand / GM_unregisterMenuCommand | 各名 | GM.registerMenuCommand | options v4.20+、id・title v5.0+、clickedFrame v5.6.6242+ | 低 |
| GM_setClipboard | `GM_setClipboard` | GM.setClipboard | ─ | 中 |
| GM_getTab / GM_saveTab / GM_getTabs | 各名 | GM.getTab 等 | ─ | 低 |
| GM_setValue / getValue / deleteValue / listValues | 各名 | GM.setValue 等 | ─ | 低 |
| GM_setValues / getValues / deleteValues | 各名 | GM.setValues 等 | v5.3+ | 低 |
| GM_addValueChangeListener / GM_removeValueChangeListener | 各名 | GM.addValueChangeListener（Promise） | ─ | 低 |
| GM_webRequest | `GM_webRequest` | ─ | 実験的。**MV3 版 5.2+（Chrome 系）では利用不可** | 高 |
| GM_xmlhttpRequest | `GM_xmlhttpRequest` + `@connect` | **GM.xmlHttpRequest**（大文字 H） | proxy は v5.5.6233+ Firefox のみ、cookie v5.6.6239+、cookiePartition v5.2+ | 高 |
| unsafeWindow | `unsafeWindow` | ─ | ─ | 高 |
| window.onurlchange | `window.onurlchange` | ─ | ─ | 低 |
| window.close | `window.close` | ─ | ─ | 中 |
| window.focus | `window.focus` | ─ | ─ | 低 |
| Content Script API（拡張設定） | ─ | ─ | Firefox / Chrome MV3 | 中（注入タイミングに影響） |

---

## GM_addElement

`GM_addElement(tag_name, attributes)` / `GM_addElement(parent_node, tag_name, attributes)`

- ページに HTML 要素を追加する。主目的は、CSP が `script` や `img` の追加を制限しているページでも要素を注入できること
- `parent_node` 省略時は `document.head` または `document.body`。shadowDOM も指定可
- `attributes` は `textContent` / `src` / `type` 等
- 戻り値: 作成した要素。失敗時は `null`（5.5.0 で常にどちらかを返すよう変更）
- セキュリティ: CSP を意図的に迂回する機能。任意コード実行につながりうる

## GM_addStyle

`GM_addStyle(css)` ─ CSS 文字列をページに追加し、注入した `<style>` 要素を返す。見た目の変更だけならこれで足りる。

## GM_audio

- `GM_audio.setMute({ isMuted }, callback?)`
- `GM_audio.getState(callback)` ─ `{ isMuted?, muteReason?('user'|'capture'|'extension'), isAudible? }`
- `GM_audio.addStateChangeListener(listener, callback)` / `removeStateChangeListener(listener, callback)`（登録時と同じ関数参照を渡す）
- いずれも Promise 版（`GM.audio.*`）あり

## GM_cookie

`@include` / `@match` で対象 URL へのアクセス権があることが前提。

- `GM_cookie.list(details, callback?)` ─ details: `url` / `domain` / `name` / `path` / `partitionKey.topLevelSite`（v5.2+）。callback `(cookies[], error)`。**httpOnly Cookie の取得は BETA 版のみ**
- `GM_cookie.set(details, callback?)` ─ Chrome cookies API の `set` 準拠（`url` / `name` / `value` / `domain` / `path` / `secure` / `httpOnly` / `expirationDate` / `partitionKey` 等）
- `GM_cookie.delete(details, callback)` ─ `url` / `name` 必須
- セキュリティ: httpOnly を含む Cookie の読み書き・削除が可能で、セッション奪取に直結しうる。最も危険な API の一つ

## GM_download

`GM_download(details)` / `GM_download(url, name)`

| details | 説明 |
|---|---|
| url | URL、または `Blob` / `File`（v5.4.6226+） |
| name | 保存ファイル名（拡張子が Tampermonkey 設定のホワイトリストにある必要あり） |
| headers | リクエストヘッダ |
| saveAs / conflictAction | 保存先確認 / `uniquify`・`overwrite`・`prompt`（browser API モードのみ） |
| anonymous（v5.5+） | Cookie を送らない |
| onload / onerror / onprogress / ontimeout | コールバック |

- `onerror` の `error`: `not_enabled` / `not_whitelisted` / `not_permitted` / `not_supported` / `not_succeeded`
- 戻り値 `{ abort() }`。`GM_info.downloadMode` は `native` / `disabled` / `browser`
- 5.5.0 から Chrome では保存・ダウンロードのたびに任意権限（downloads）の確認が出る。Download Mode を `Native` にすると出ない

## GM_getResourceText / GM_getResourceURL

`@resource` で宣言したリソースの中身 / URL を返す。Promise 版は `GM.getResourceText` と `GM.getResourceUrl`（綴りの大小が異なる）。

## GM_info

スクリプトと Tampermonkey のメタ情報（プロパティ）。`@grant` なしで取得できる。

- トップレベル: `downloadMode` / `isIncognito` / `sandboxMode`（4.18+、`js` | `raw` | `dom`）/ `scriptHandler` / `scriptUpdateURL` / `userAgentData`（4.19+）/ `container`（5.3+、Firefox）
- `script`: `name` / `version` / `grant[]` / `matches[]` / `includes[]` / `excludes[]` / `resources[]` / `run-at` / `run-in`（5.3+）/ `unwrap` / `options`

## GM_log

`GM_log(message)` ─ コンソール出力。Promise 版なし。

## GM_notification

`GM_notification(details, ondone)` / `GM_notification(text, title, image, onclick)`

| details | 説明 |
|---|---|
| text / title / image | 本文 / タイトル / 画像 URL |
| tag（v5.0+） | 同じ tag なら既存通知を更新 |
| highlight | 通知元タブを強調（text 未指定時は必須） |
| silent / timeout | 無音 / 自動で閉じるまでの ms |
| url（v5.0+） | クリック時に開く URL（`event.preventDefault()` で抑止可） |
| onclick / ondone | コールバック |

- `url` も `tag` も無いとき、v5.0+ ではスクリプトのアンロード時に通知が自動で閉じる

## GM_openInTab

`GM_openInTab(url, options)` / `GM_openInTab(url, loadInBackground)`

- options: `active`（既定 false）/ `insert` / `setParent` / `incognito` / `loadInBackground`
- 戻り値 `{ close(), onclose, closed }`

## GM_registerMenuCommand / GM_unregisterMenuCommand

`GM_registerMenuCommand(name, callback, options_or_accessKey)` ─ Tampermonkey のメニューに項目を追加。戻り値はメニュー ID。

| options（v4.20+） | 説明 |
|---|---|
| id（v5.0+） | 既存 ID なら更新、未指定なら新規 |
| accessKey | アクセスキー |
| autoClose | 選択後にポップアップを閉じるか（既定 true） |
| title（v5.0+） | ツールチップ |
| clickedFrame（v5.6.6242+） | true ならクリックされたフレームでのみ実行 |

- callback には `MouseEvent | KeyboardEvent`（4.14+）が渡る。同名・同 title・同 accessKey の項目は複数フレームから登録されても 1 つに統合される

## GM_setClipboard

`GM_setClipboard(data, info, cb)` ─ `info` は `'text'` | `'html'` か `{ type, mimetype }`。ユーザーのクリップボードを上書きする。

## GM_getTab / GM_saveTab / GM_getTabs

タブ単位の永続オブジェクト。`GM_getTab(cb)` で取得、`GM_saveTab(tab, cb?)` で保存、`GM_getTabs(cb)` で全タブ分をタブ ID キーで取得。

## GM_setValue 系（スクリプト専用ストレージ）

- `GM_setValue(key, value)` ─ 値は `null` / object / string / number / undefined / boolean（ネストも同様）
- `GM_getValue(key, defaultValue)` / `GM_deleteValue(key)` / `GM_listValues()`
- v5.3+: `GM_setValues({ ... })` / `GM_getValues(keys | defaults)` / `GM_deleteValues(keys)`
- `GM_addValueChangeListener(key, (key, oldValue, newValue, remote) => void)` ─ `remote` は別インスタンス（別タブ等）からの変更なら true。戻り値の ID を `GM_removeValueChangeListener` に渡して解除
- ストレージは暗号化されない。秘密（API キー・トークン）を保存しない。Tampermonkey の Storage タブ（FAQ Q400）や MCP の `<uuid>/storage` から読める

## GM_webRequest

`GM_webRequest(rules, listener)` ─ 実験的。**Chrome 系 MV3 版（5.2+）では利用不可**。対象は `sub_frame` / `script` / `xhr` / `websocket`。action は `cancel` または `redirect`。

## GM_xmlhttpRequest

`GM_xmlhttpRequest(details)` / Promise 版 `GM.xmlHttpRequest(details)`（大文字 H）

- **`@connect` で接続先ドメインを宣言する**。初期 URL と最終 URL（リダイレクト後）の両方がチェックされる
- リクエストは Tampermonkey のバックグラウンドから送出される（ページの CORS 制約を受けない）

| details | 説明 |
|---|---|
| method / url / headers / data | 基本。`url` は `URL` や `Blob`/`File`（v5.4.6226+）も可 |
| redirect | `follow` / `error` / `manual`（build 6180+ で fetch モードを強制） |
| cookie（v5.6.6239+） | 送信 Cookie に 1 個マージ |
| cookiePartition.topLevelSite（v5.2+） | パーティション Cookie の key |
| binary / nocache / revalidate / timeout | 送信・キャッシュ・タイムアウト制御 |
| context | レスポンスにそのまま付く任意値 |
| responseType | `arraybuffer` / `blob` / `json` / `stream` |
| overrideMimeType | MIME 上書き |
| **anonymous** | Cookie を送らない（fetch モードを強制） |
| fetch | XHR の代わりに fetch を使う。Chrome では `timeout` と `onprogress` が効かず、`onreadystatechange` は DONE のみ |
| proxy | Firefox のみ（v5.5.6233+） |
| user / password | 認証 |
| onabort / onerror / onloadstart / onprogress / onreadystatechange / ontimeout / onload | コールバック |

- response: `finalUrl` / `readyState` / `status` / `statusText` / `responseHeaders` / `response` / `responseXML` / `responseText`
- プロキシ・証明書はブラウザのネットワークスタックに従う。401/407 はブラウザ側か `user`/`password` で解決する
- 戻り値 `{ abort() }`。`synchronous` は非サポート
- セキュリティ: 同一生成元ポリシーを迂回する。`@connect` の最小化が唯一の歯止め。既定では対象サイトの Cookie が付くので、不要なら `anonymous: true`

## unsafeWindow

ページ側の `window` への直接アクセス。ページで定義された JS 変数・ライブラリを触る必要があるときだけ使う。

- リスク: ページの JS 空間に直接触れるため、ページ側から観測・改変される経路になる。ページ由来の値は信頼できない入力として扱う。スクリプトの関数や GM API を `unsafeWindow` に公開しない

## window.onurlchange / window.close / window.focus

```js
// @grant window.onurlchange
if (window.onurlchange === null) {
  // null なら対応、undefined なら未対応
  window.addEventListener('urlchange', (info) => { /* info.url */ });
}
```

- SPA の URL 変化検知に使う（5.4.0 で `pushState` によるハッシュ変更でも発火するよう修正）
- `window.close`: `@grant window.close` で呼べる。最後の 1 タブは閉じられない
- `window.focus`: ウィンドウを前面化する

## Content Script API（拡張機能の設定項目）

ラッパーコードの注入方式。Firefox と Chrome（MV3）で選択可。

| 設定値 | 挙動 |
|---|---|
| Content Script（既定） | content script として実行。スクリプトをメッセージングで取得するため真の `document-start` は非対応 |
| UserScripts API | ブラウザの UserScripts API で注入。Chrome はメッセージング経由（`document-start` 非対応）、Firefox は即時実行 |
| UserScripts API Dynamic | ラッパーとスクリプト本体の両方を UserScripts API で注入。即時実行で `document-start` に対応 |

- MV3 の既知の制限: Dynamic では正規表現の `@include` が全フレームに注入されることがある / 外部 `@resource` が自動更新されない
- ページ読み込み前のフックなど `document-start` が必須のスクリプトは、この設定で挙動が変わる
