import { GM_addStyle } from '$';
import { createLogger } from '../shared/log.ts';

export const SCRIPT_ID = 'nous-portal-readability';
const MARKER_ATTRIBUTE = `data-tm-${SCRIPT_ID}`;

const log = createLogger(SCRIPT_ID);

// サイトは可変フォント "Rules Variable" の幅軸（wdth 50）や Compressed/Condensed 系フォントで長体にし、
// text-transform: uppercase を多用している。フォント指定はクラス・CSS 変数・要素ごとに散らばるため、
// クラス名に依存せず全要素の文字まわりだけを上書きする（配色・レイアウトは変えない）
export const STYLE = `
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

/** 読みやすさ用の CSS を 1 回だけ入れる */
export function start(): void {
  const root = document.documentElement;
  if (root.hasAttribute(MARKER_ATTRIBUTE)) return;
  root.setAttribute(MARKER_ATTRIBUTE, 'active');

  GM_addStyle(STYLE);
  log.info('style applied');
}
