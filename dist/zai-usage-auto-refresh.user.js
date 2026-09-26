// ==UserScript==
// @name         Z.ai Usage Auto Refresh
// @namespace    https://github.com/takunagai/tampermonkey-scripts
// @version      1.0.0
// @author       Taku Nagai
// @description  Z.ai GLM Coding Plan の Usage ページで、右上のリフレッシュボタンを 1 分ごとに自動で押す
// @license      MIT
// @homepageURL  https://github.com/takunagai/tampermonkey-scripts/tree/main/src/zai-usage-auto-refresh
// @supportURL   https://github.com/takunagai/tampermonkey-scripts/issues
// @downloadURL  https://raw.githubusercontent.com/takunagai/tampermonkey-scripts/main/dist/zai-usage-auto-refresh.user.js
// @updateURL    https://raw.githubusercontent.com/takunagai/tampermonkey-scripts/main/dist/zai-usage-auto-refresh.meta.js
// @match        https://z.ai/manage-apikey/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function() {
	"use strict";
	function createLogger(scriptId) {
		const prefix = `[${scriptId}]`;
		return {
			info: (message, context) => console.info(prefix, message, context ?? ""),
			warn: (message, context) => console.warn(prefix, message, context ?? ""),
			error: (message, context) => console.error(prefix, message, context ?? "")
		};
	}
	var SCRIPT_ID = "zai-usage-auto-refresh";
	var REFRESH_INTERVAL_MS = 6e4;
	var MARKER_ATTRIBUTE = `data-tm-${SCRIPT_ID}`;
	var USAGE_PATH_PATTERN = /^\/manage-apikey\/coding-plan\/[^/]+\/usage\/?$/;
	var REFRESH_BUTTON_SELECTOR = "button[aria-label=\"Refresh\"]";
	var REFRESH_ICON_SELECTOR = "svg.lucide-rotate-ccw";
	var log = createLogger(SCRIPT_ID);
	var isUsagePage = (pathname) => USAGE_PATH_PATTERN.test(pathname);
	var isVisible = (element) => typeof element.checkVisibility === "function" ? element.checkVisibility() : true;
	var isDisabled = (button) => button.disabled || button.getAttribute("aria-disabled") === "true";
	function findRefreshCandidates(root = document) {
		return [...root.querySelectorAll(REFRESH_BUTTON_SELECTOR)].filter((button) => button.type === "button" && button.querySelector(REFRESH_ICON_SELECTOR) !== null && isVisible(button));
	}
	function start({ intervalMs = REFRESH_INTERVAL_MS } = {}) {
		const root = document.documentElement;
		if (root.hasAttribute(MARKER_ATTRIBUTE)) return () => {};
		root.setAttribute(MARKER_ATTRIBUTE, "active");
		let lastRefreshAt = Date.now();
		let timer;
		let hasWarnedAmbiguous = false;
		const refreshIfPossible = () => {
			if (document.hidden || !isUsagePage(location.pathname)) return;
			const candidates = findRefreshCandidates();
			if (candidates.length > 1 && !hasWarnedAmbiguous) {
				hasWarnedAmbiguous = true;
				log.warn("リフレッシュボタンの候補が複数あるため押さない", { count: candidates.length });
			}
			const [button] = candidates;
			if (candidates.length !== 1 || !button || isDisabled(button)) return;
			button.click();
			lastRefreshAt = Date.now();
		};
		const tick = () => {
			refreshIfPossible();
			schedule();
		};
		const schedule = () => {
			clearTimeout(timer);
			timer = setTimeout(tick, intervalMs);
		};
		const onVisibilityChange = () => {
			if (!document.hidden && Date.now() - lastRefreshAt >= intervalMs) tick();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		schedule();
		log.info("started", { intervalMs });
		return () => {
			clearTimeout(timer);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			root.removeAttribute(MARKER_ATTRIBUTE);
		};
	}
	start();
})();
