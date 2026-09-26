import { GM_addStyle } from '$';
import { createLogger } from '../shared/log.ts';

export const SCRIPT_ID = '_template';
export const BADGE_CLASS = `tm-${SCRIPT_ID}-badge`;
const MARKER_ATTRIBUTE = `data-tm-${SCRIPT_ID}`;

const log = createLogger(SCRIPT_ID);

const STYLE = `
  .${BADGE_CLASS} {
    position: fixed;
    right: 12px;
    bottom: 12px;
    z-index: 2147483647;
    padding: 6px 10px;
    border-radius: 6px;
    background: #1f2937;
    color: #f9fafb;
    font: 12px/1.4 "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif;
  }
`;

/**
 * ページに目印のバッジを表示する。
 * 二重に実行されても 1 回分しか反映しない（Tampermonkey の再注入・SPA の再描画対策）
 */
export function start(): void {
  const root = document.documentElement;
  if (root.hasAttribute(MARKER_ATTRIBUTE)) return;
  root.setAttribute(MARKER_ATTRIBUTE, 'active');

  GM_addStyle(STYLE);

  // HTML 文字列は組み立てない。要素は createElement、文字は textContent で入れる
  const badge = document.createElement('div');
  badge.className = BADGE_CLASS;
  badge.textContent = `${SCRIPT_ID}: active`;
  document.body.append(badge);

  log.info('started');
}
