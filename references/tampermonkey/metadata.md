---
title: Tampermonkey ユーザースクリプト メタデータブロック リファレンス
sources:
  - https://www.tampermonkey.net/documentation.php?locale=en&q=name
  - https://www.tampermonkey.net/documentation.php?locale=en&q=version
  - https://www.tampermonkey.net/documentation.php?locale=en&q=description
  - https://www.tampermonkey.net/documentation.php?locale=en&q=icon
  - https://www.tampermonkey.net/documentation.php?locale=en&q=grant
  - https://www.tampermonkey.net/documentation.php?locale=en&q=author
  - https://www.tampermonkey.net/documentation.php?locale=en&q=homepage
  - https://www.tampermonkey.net/documentation.php?locale=en&q=antifeature
  - https://www.tampermonkey.net/documentation.php?locale=en&q=externals
  - https://www.tampermonkey.net/documentation.php?locale=en&q=include
  - https://www.tampermonkey.net/documentation.php?locale=en&q=run_at
  - https://www.tampermonkey.net/documentation.php?locale=en&q=run_in
  - https://www.tampermonkey.net/documentation.php?locale=en&q=sandbox
  - https://www.tampermonkey.net/documentation.php?locale=en&q=tag
  - https://www.tampermonkey.net/documentation.php?locale=en&q=connect
  - https://www.tampermonkey.net/documentation.php?locale=en&q=noframes
  - https://www.tampermonkey.net/documentation.php?locale=en&q=update_url
  - https://www.tampermonkey.net/documentation.php?locale=en&q=webRequest
  - https://www.tampermonkey.net/documentation.php?locale=en&q=unwrap
  - https://www.tampermonkey.net/documentation.php?locale=en&q=sri
  - https://www.tampermonkey.net/documentation.php?locale=en&q=CDATA
  - https://www.tampermonkey.net/documentation.php?locale=en&q=deploying
fetched: 2026-09-26
notes: 公式ドキュメント（英語）を日本語で構造化。原文の全文転載はしていない。GM_* API の詳細は gm-api.md。
---

# メタデータブロック リファレンス

## 開発上の要点

- `@match` は Chrome の match pattern 仕様に準拠した厳密な構文、`@include` は緩い独自構文（プレーン文字列 or 正規表現）。新規スクリプトは `@match` を優先する（構文の曖昧さが少ない）
- `@include` で `://` を含むパターンは `@match` 風に解釈される。`*://tmnk.net/*` は `https://example.com/?http://tmnk.net/` のような別ホストの URL にもマッチしうる
- `@grant` を省略すると「空リスト」扱いで、`@grant none` とは異なる（none はサンドボックス自体を無効化し `GM_info` のみ使える特殊モード）
- `unsafeWindow` や `window.close` / `window.focus` / `window.onurlchange` も `@grant` で明示許可が必要
- `@connect` は必要なドメインを列挙するのが基本。全ドメインが要るときだけ個別列挙 + `@connect *` を併用する
- `@require` / `@resource` は SRI（URL の hash フラグメント）で改ざん検知できる。外部リソースを読むなら付与する
- `@run-at document-start` が最速注入だが、`@require` の取得が遅いと実際の注入も遅れる
- `@run-at context-menu` では `@include` / `@exclude` が無視される（現状の仕様。将来変更の可能性ありと明記）
- `@sandbox` 省略時の既定は `raw`（MAIN_WORLD 優先、CSP 等で不可なら他のサンドボックスにフォールバック）。Tampermonkey 設定で `DOM` モードを有効化するのは危険（FAQ Q404）
- `@unwrap` はラッパーもサンドボックスも使わず生でページに注入する。スクリプトレット向けの特殊用途で、通常のセキュリティ境界を失う

---

## @name

**構文**: `// @name <文字列>` / 地域化: `// @name:<locale> <文字列>`

- スクリプトの名前。ロケール接尾辞で複数指定可（例: `@name:de`）

```
// @name    A test
// @name:de Ein Test
```

## @namespace

**構文**: `// @namespace <文字列>`

- スクリプトの名前空間
- `http://` で始まり `@homepage` が未指定なら、ホームページリンクとして使われる

## @copyright

**構文**: `// @copyright <文字列>`

- スクリプトエディタのヘッダー、スクリプト名の直下に表示される著作権表示

## @version

**構文**: `// @version <バージョン文字列>`

- 更新チェックに使われる。更新のたびに値を大きくする必要がある
- 独自の比較アルゴリズム。数値・プレリリース識別子（`-alpha` 等）・ビルドメタデータ（`+1` 等）・日付形式を解釈する
- 例: `1` == `1.0` == `1.0.0`、`16.4` == `16.04`、`1.10` == `1.10.0`（末尾ゼロは同値）
- 実務上は SemVer 風（`major.minor.patch`）で単調増加させれば問題ない

## @description

**構文**: `// @description <文字列>` / 地域化: `// @description:<locale> <文字列>`

```
// @description    This userscript does wonderful things
// @description:de Dieses Userscript tut wundervolle Dinge
```

## @icon, @iconURL, @defaulticon / @icon64, @icon64URL

- `@icon`（`@iconURL` `@defaulticon` は同義）: 低解像度アイコンの URL
- `@icon64`（`@icon64URL` は同義）: 64x64px アイコン。無いときは `@icon` が拡大表示される箇所がある

## @grant

**構文**: `// @grant <GM_*関数名 | GM.*関数名 | unsafeWindow | window.*関数名 | none>`

- `GM_*` / `GM.*` 関数、`unsafeWindow`、一部の強力な `window` 関数をホワイトリスト化する。複数指定可
- 特殊値 `none`: サンドボックスを無効化。`GM_*` 関数は使えず `GM_info` のみ利用可
- **省略時**: 「空リスト」（何も許可されない）扱い。`@grant none` とは挙動が異なる
- セキュリティ含意: 不要な権限は付与しない。`window.close` / `window.focus` / `window.onurlchange` も明示が必要

```
// @grant GM_setValue
// @grant GM.getValue
// @grant unsafeWindow
// @grant window.close
// @grant window.onurlchange
```

```
// @grant none
```

## @author

**構文**: `// @author <文字列>`

## @homepage, @homepageURL, @website, @source

**構文**: `// @homepage <URL>`（他 3 つは同義）

- オプションページでスクリプト名からリンクされる作者ページ
- `@namespace` が `http://` で始まり `@homepage` が無ければ、そちらが使われる

## @antifeature

**構文**: `// @antifeature <type> <説明文>` / 地域化: `// @antifeature:<locale> <type> <説明文>`

- マネタイズ手法の開示用（Greasy Fork では必須）。`<type>` は `ads` / `tracking` / `miner`。複数指定可

```
// @antifeature       ads         We show you ads
// @antifeature       tracking    We have some sort of analytics included
```

## @require（q=externals）

**構文**: `// @require <URL>[#<hashアルゴリズム>=<hash値>[,...]]`

- スクリプト本体の実行前に読み込み・実行される外部 JavaScript。複数指定可
- 注意: `@require` 側の `"use strict"` がユーザースクリプト本体の strict mode に影響しうる
- SRI でハッシュを付与できる（後述）

```
// @require https://code.jquery.com/jquery-2.1.3.min.js#sha256=23456...
```

## @resource（q=externals）

**構文**: `// @resource <名前> <URL>[#<hashアルゴリズム>=<hash値>[,...]]`

- `GM_getResourceURL` / `GM_getResourceText`（別途 `@grant` 必要）で参照するリソースを事前読み込みする。複数指定可。SRI 可

```
// @resource icon1       http://www.tampermonkey.net/favicon.ico
// @resource SRIsecured1 http://www.tampermonkey.net/favicon.ico#md5=123434...
```

---

## URL マッチング（@include / @match / @exclude）

### @include

**構文**: `// @include <URL パターン または /正規表現/>`

- 実行対象ページを指定。複数指定可
- **URL のハッシュ部（`#...`）はマッチ対象外**。ハッシュでの判定が要るなら `window.onurlchange` を使う
- 値の形式: プレーン文字列（`*` ワイルドカード）または `/正規表現/`
- `://` を含むパターンの特殊解釈:
  - `://` より前の `*` は `:` 以外の全文字にマッチ（スキーム部）
  - `://` の直後から次の `/` までは「ホスト部」扱いで、`/` 以外の全文字にマッチ
- **落とし穴**: `*://tmnk.net/*` が `tmnk.net` だけにマッチするとは限らない（`https://example.com/?http://tmnk.net/` にもマッチしうる）

```
// @include http://www.tampermonkey.net/*
// @include /^https:\/\/www\.tampermonkey\.net\/.*$/
```

### @match

**構文**: `// @match <protocol>://<domain><path>`

Chrome の match pattern 仕様（https://developer.chrome.com/docs/extensions/mv2/match_patterns/ ）に準拠。

| パーツ | 説明 | ワイルドカード |
|---|---|---|
| protocol | `http` / `https` 等 | `*` で `http` と `https` の両方。`http*://` も受け付ける |
| domain | ドメイン名 | `*.tmnk.net` で `tmnk.net` 自身と全サブドメイン |
| path | ドメイン以降のパス | `*` で任意の部分 |

- 複数指定可
- `<all_urls>` は未サポート（原文明記）

```
// @match https://*/*
// @match http://*/foo*
// @match https://*.tampermonkey.net/foo*bar
```

### @exclude

**構文**: `// @exclude <URL パターン または /正規表現/>`

- `@include` / `@match` で含めた URL を除外する。記法は `@include` と同じ。複数指定可

---

## @run-at

注入される**最短**タイミング（下限）。`@require` の取得が遅いと実注入はさらに遅れる。指定タイミング後に発火した `DOMNodeInserted` / `DOMContentLoaded` / `load` は、サンドボックスの `window.addEventListener` で登録したリスナーへキャッシュ配送される。

| 値 | タイミング | 備考 |
|---|---|---|
| `document-start` | 可能な限り最速 | |
| `document-body` | `<body>` 要素が存在した時点 | |
| `document-end` | `DOMContentLoaded` 発火時またはそれ以降 | |
| `document-idle`（既定） | `DOMContentLoaded` 発火後 | 省略時の既定 |
| `context-menu` | ブラウザの右クリックメニュー、またはポップアップメニュー（v5.5+）からクリックされたとき | `@include` / `@exclude` は無視される |

## @run-in（v5.3+）

注入先のブラウザコンテキストを制御する。未指定なら全タブに注入。

| 値 | 説明 |
|---|---|
| `normal-tabs` | 通常タブ（非シークレット・デフォルトコンテナ）のみ |
| `incognito-tabs` | シークレットタブのみ。Firefox では default 以外の cookie store を使う全タブ |
| `container-id-<N>` | Firefox のコンテナ ID 指定（ID は `GM_info.container` で確認） |

- 複数値の併記可否は原文に明記なし（未確認）

---

## @sandbox（v4.18+）

どの実行コンテキストに注入するかを「必要なアクセス」で宣言する。

| 値 | 意味 | 挙動・注意点 |
|---|---|---|
| `raw`（既定） | 互換性のため常にページコンテキスト（`MAIN_WORLD`）で動く必要があるスクリプト向け | CSP 等で不可なら raw → JavaScript → DOM の順で有効な他のサンドボックスにフォールバック |
| `JavaScript` | `unsafeWindow` へのアクセスが必要なスクリプト向け | Firefox では `USERSCRIPT_WORLD` を作り CSP も回避。オブジェクト共有に `cloneInto` / `exportFunction` が要る場合あり。他ブラウザでは `raw` にフォールバック |
| `DOM` | DOM アクセスのみで `unsafeWindow` 不要なスクリプト向け | 有効なら拡張機能コンテキスト（`ISOLATED_WORLD`）で実行。それ以外は DOM アクセスを持つ他の有効なコンテキスト |

- **セキュリティ含意（FAQ Q404 原文）**: Tampermonkey の設定で利用可能なサンドボックスモードを構成できるが、**`DOM` モードを有効にする設定は潜在的に危険**。拡張機能コンテキストで動くスクリプトは拡張機能のほぼ全権限を持ち、他のユーザースクリプトの改変・新規インストールすらできる。したがって Tampermonkey 側で `DOM` モードを有効化しない。スクリプト側で `@sandbox DOM` と宣言しても、`DOM` モードが無効なら他の有効なコンテキストで動く
- Chrome（MV3）では `JavaScript` も `raw` にフォールバックするため、実質は `raw`（ページコンテキスト）で動くと考えておく。ページ側 JS から干渉されうる前提で、秘密をスクリプトに持たせない・GM 関数や内部状態を `window` に公開しない

```
// @sandbox raw
```

---

## @tag

**構文**: `// @tag <タグ名>`

- システムのタグ一覧にあるタグならスクリプト一覧に表示される。分類用。複数指定可

## @connect

**構文**: `// @connect <value>`

`GM_xmlhttpRequest` が取得を許可されるドメイン（トップレベルドメイン単体は不可。サブドメインを含む）。

| 値 | 例 | 説明 |
|---|---|---|
| ドメイン名 | `example.com` | サブドメインもすべて許可 |
| サブドメイン名 | `subdomain.example.com` | そのサブドメインのみ |
| `self` | `self` | スクリプトが実行中のドメイン |
| `localhost` | `localhost` | localhost |
| IP アドレス | `1.2.3.4` | 特定 IP |
| ワイルドカード | `*` | 全ドメイン |

- 複数指定可。**初期 URL と最終 URL（リダイレクト先）の両方**がチェックされる
- 全ドメインを宣言できないときの原文のベストプラクティス: 既知ドメインを列挙して確認ダイアログを減らし、さらに `@connect *` を足して「Always allow all domains」ボタンを出せるようにする
- ユーザー側でもスクリプト設定タブのドメインホワイトリストに `*` を追加できる
- 後方互換として Scriptish の `@domain` も解釈される

## @noframes

**構文**: `// @noframes`（値なし）

- メインページでのみ実行し、iframe 内では実行しない

## @updateURL / @downloadURL / @supportURL

- `@updateURL <URL>`: 更新チェック用 URL。`@version` 必須
- `@downloadURL <URL | none>`: 更新検知時のダウンロード元。`none` で更新チェック自体を行わない
- `@supportURL <URL>`: 問題報告先

## @webRequest

**構文**: `// @webRequest <JSON>`

- `GM_webRequest` の rule と同形式の JSON。スクリプト読み込み前からルールを適用できる
- 実験的 API。**Manifest V3 版（Chrome 系 5.2+）では利用不可**

## @unwrap

**構文**: `// @unwrap`（値なし）

- ラッパー・サンドボックスなしでページに直接注入する。スクリプトレット用
- セキュリティ含意（推測を含む）: サンドボックス保護を失う。信頼できるスクリプトのみ

---

## Subresource Integrity（SRI）

`@require` / `@resource` の URL 末尾にハッシュフラグメントを付与し、改ざんを検知する。

**書式**: `<URL>#<アルゴリズム>=<hash値>[,<アルゴリズム>=<hash値>...]`（区切りはカンマまたはセミコロン。`=` の代わりに `-` も可）

```
// @require https://code.jquery.com/jquery-2.1.2.min.js#md5-ac56d...,sha256-6e789...
// @require https://code.jquery.com/jquery-3.6.0.min.js#sha256-/xUj+3OJU...ogEvDej/m4=
```

- `SHA-256` と `MD5` はネイティブ対応。`SHA-1` / `SHA-384` / `SHA-512` は `window.crypto` 依存
- 複数ハッシュ指定時は、対応しているものの中で**最後に書かれたもの**が使われる
- エンコーディングは hex または Base64
- インストール時にハッシュを計算して比較し、不一致ならリソースの読み込みを拒否する

## CDATA 記法（`<>...</>`）

- E4X 風の `<><![CDATA[ ... ]]></>` を使う古いスクリプトとの互換オプション。Tampermonkey が必要性を自動検出する。新規開発では使わない

## 企業配布（Deploying）要約

- 管理ブラウザポリシーで拡張機能を強制インストールし、Dashboard の Utilities からエクスポートした JSON（スクリプト・ストレージ・設定・外部リソース）を配布できる（v5.5+、Chromium 系と Firefox デスクトップ）
- 手順: ポリシーで強制インストール → JSON を HTTPS でホスト → ポリシーの `jsonImport`（`hash` / `url` / `haltOnError` / `installAsSystemScripts`）を設定
- 各エントリに内容ハッシュが必須。不一致はエラーで、`haltOnError: true` なら Tampermonkey 自体が起動しない
- 拡張機能 ID は FAQ Q406
