// ==UserScript==
// @name         Nous Portal Readability
// @namespace    https://github.com/takunagai/tampermonkey-scripts
// @version      1.0.0
// @author       Taku Nagai
// @description  Nous Portal の長体フォント・大文字化・字間を通常の表示に戻して読みやすくする（見た目のみ変更）
// @license      MIT
// @homepageURL  https://github.com/takunagai/tampermonkey-scripts/tree/main/src/nous-portal-readability
// @supportURL   https://github.com/takunagai/tampermonkey-scripts/issues
// @downloadURL  https://raw.githubusercontent.com/takunagai/tampermonkey-scripts/main/dist/nous-portal-readability.user.js
// @updateURL    https://raw.githubusercontent.com/takunagai/tampermonkey-scripts/main/dist/nous-portal-readability.meta.js
// @match        https://portal.nousresearch.com/*
// @grant        GM_addStyle
// @run-at       document-start
// @noframes
// ==/UserScript==

(function() {
	"use strict";
	var _GM_addStyle = (() => typeof GM_addStyle != "undefined" ? GM_addStyle : void 0)();
	function createLogger(scriptId) {
		const prefix = `[${scriptId}]`;
		return {
			info: (message, context) => console.info(prefix, message, context ?? ""),
			warn: (message, context) => console.warn(prefix, message, context ?? ""),
			error: (message, context) => console.error(prefix, message, context ?? "")
		};
	}
	var SCRIPT_ID = "nous-portal-readability";
	var MARKER_ATTRIBUTE = `data-tm-${SCRIPT_ID}`;
	var log = createLogger(SCRIPT_ID);
	var STYLE = `
  html {
    --tm-font-sans: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", sans-serif;
    --tm-font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }
  html *,
  html *::before,
  html *::after {
    font-family: var(--tm-font-sans) !important;
    font-stretch: 100% !important;
    font-variation-settings: normal !important;
    text-transform: none !important;
    letter-spacing: normal !important;
  }
  /* コードと、サイトが等幅の役割で指定している要素（モデル ID 等）は本物の等幅フォントにする。
     サイトの --font-mono は長体フォントなので使わない */
  html :is(code, kbd, samp, pre, [class*="font-mono"]),
  html :is(code, kbd, samp, pre, [class*="font-mono"]) * {
    font-family: var(--tm-font-mono) !important;
  }
  html :is(td, th) {
    font-variant-numeric: tabular-nums;
  }
`;
	function start() {
		const root = document.documentElement;
		if (root.hasAttribute(MARKER_ATTRIBUTE)) return;
		root.setAttribute(MARKER_ATTRIBUTE, "active");
		_GM_addStyle(STYLE);
		log.info("style applied");
	}
	start();
})();
