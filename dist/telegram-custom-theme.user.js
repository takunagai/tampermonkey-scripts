// ==UserScript==
// @name         Telegram Custom Theme
// @namespace    https://github.com/takunagai/tampermonkey-scripts
// @version      1.0.0
// @author       Taku Nagai
// @description  Telegram Web（K 版）のメッセージ表示の幅・間隔・余白・受信メッセージの上辺を調整する（見た目のみ変更）
// @license      MIT
// @homepageURL  https://github.com/takunagai/tampermonkey-scripts/tree/main/src/telegram-custom-theme
// @supportURL   https://github.com/takunagai/tampermonkey-scripts/issues
// @downloadURL  https://raw.githubusercontent.com/takunagai/tampermonkey-scripts/main/dist/telegram-custom-theme.user.js
// @updateURL    https://raw.githubusercontent.com/takunagai/tampermonkey-scripts/main/dist/telegram-custom-theme.meta.js
// @match        https://web.telegram.org/k/*
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
	var SCRIPT_ID = "telegram-custom-theme";
	var MARKER_ATTRIBUTE = `data-tm-${SCRIPT_ID}`;
	var CHAT_MAX_WIDTH = "1000px";
	var MESSAGE_GAP = ".375rem";
	var MESSAGE_GROUP_GAP = ".625rem";
	var MESSAGE_PADDING = "15px 10px";
	var log = createLogger(SCRIPT_ID);
	var TEXT_BUBBLE = `.bubbles-inner:not(.is-broadcast) .bubble:is(.has-webpage, :not(.sticker, .emoji-big, .round, .just-media, .photo, .video, .is-album)):not(.service)`;
	var INCOMING_BUBBLE = `.bubbles-inner .bubble.is-in:not(.service, .sticker, .emoji-big, .round, .just-media)`;
	var PADDED_BUBBLE = `.bubbles-inner .bubble:is(.is-in, .is-out):is(.has-webpage, :not(.service, .sticker, .emoji-big, .round, .just-media, .photo, .video, .is-album))`;
	var CONTENT_CHILD = `:not(.bubble-tail, .bubble-content-background)`;
	var STYLE = `
  html:root {
    --chat-width: ${CHAT_MAX_WIDTH} !important;
  }
  .bubbles-inner .bubble:not(.service, .is-sponsored) {
    margin-bottom: ${MESSAGE_GAP};
  }
  .bubbles-inner .bubble.is-group-last:not(.service, .is-sponsored) {
    margin-bottom: ${MESSAGE_GROUP_GAP};
  }
  ${INCOMING_BUBBLE} {
    --border-start-start-radius: 0;
    --border-start-end-radius: 0;
  }
  ${INCOMING_BUBBLE} .bubble-content {
    border-top: 2px solid var(--message-out-background-color);
  }
  ${PADDED_BUBBLE} .bubble-content {
    padding: ${MESSAGE_PADDING};
  }
  ${PADDED_BUBBLE} .bubble-content > ${CONTENT_CHILD} {
    margin-left: 0;
    margin-right: 0;
  }
  ${PADDED_BUBBLE} .bubble-content > :nth-child(1 of ${CONTENT_CHILD}),
  ${PADDED_BUBBLE} .document-container.is-first .document {
    margin-top: 0;
  }
  ${PADDED_BUBBLE} .bubble-content > :nth-last-child(1 of ${CONTENT_CHILD}),
  ${PADDED_BUBBLE} .document-container.is-last .document {
    margin-bottom: 0;
  }
  @media only screen and (min-width: 601px) {
    .bubbles-inner:not(.is-broadcast) .bubble:not(.service) {
      --max-width: 85%;
    }
    ${TEXT_BUBBLE} {
      --max-content-width: 100%;
    }
    ${TEXT_BUBBLE} .bubble-content-wrapper,
    ${TEXT_BUBBLE} .bubble-content {
      width: 100%;
    }
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
