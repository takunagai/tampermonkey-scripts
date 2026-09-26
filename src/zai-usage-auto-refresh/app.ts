import { createLogger } from '../shared/log.ts';

export const SCRIPT_ID = 'zai-usage-auto-refresh';
export const REFRESH_INTERVAL_MS = 60_000;

const MARKER_ATTRIBUTE = `data-tm-${SCRIPT_ID}`;
const USAGE_PATH_PATTERN = /^\/manage-apikey\/coding-plan\/[^/]+\/usage\/?$/;
// ボタンはアクセシブルネームとアイコンの両方で特定する（別の「Refresh」ボタンを押さないため）
const REFRESH_BUTTON_SELECTOR = 'button[aria-label="Refresh"]';
const REFRESH_ICON_SELECTOR = 'svg.lucide-rotate-ccw';

const log = createLogger(SCRIPT_ID);

export const isUsagePage = (pathname: string): boolean => USAGE_PATH_PATTERN.test(pathname);

const isVisible = (element: Element): boolean =>
  typeof element.checkVisibility === 'function' ? element.checkVisibility() : true;

const isDisabled = (button: HTMLButtonElement): boolean =>
  button.disabled || button.getAttribute('aria-disabled') === 'true';

/**
 * 押してよいリフレッシュボタンの候補。
 * type="button"（フォーム送信にならない）・アイコン付き・表示中のものだけを数える
 */
export function findRefreshCandidates(root: ParentNode = document): HTMLButtonElement[] {
  return [...root.querySelectorAll<HTMLButtonElement>(REFRESH_BUTTON_SELECTOR)].filter(
    (button) =>
      button.type === 'button' &&
      button.querySelector(REFRESH_ICON_SELECTOR) !== null &&
      isVisible(button),
  );
}

export type StartOptions = {
  intervalMs?: number;
};

/**
 * Usage ページのリフレッシュボタンを intervalMs ごとに押す。
 * - 候補がちょうど 1 つのときだけ押す（0 個・複数なら何もしない）
 * - タブが非表示の間は押さず、表示に戻ったときに前回から intervalMs 以上たっていればすぐ押す
 * 戻り値の関数で停止する
 */
export function start({ intervalMs = REFRESH_INTERVAL_MS }: StartOptions = {}): () => void {
  const root = document.documentElement;
  if (root.hasAttribute(MARKER_ATTRIBUTE)) return () => {};
  root.setAttribute(MARKER_ATTRIBUTE, 'active');

  // ページを開いた時点のデータは新しいので、最初の自動更新は intervalMs 後
  let lastRefreshAt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let hasWarnedAmbiguous = false;

  const refreshIfPossible = (): void => {
    if (document.hidden || !isUsagePage(location.pathname)) return;
    const candidates = findRefreshCandidates();
    if (candidates.length > 1 && !hasWarnedAmbiguous) {
      hasWarnedAmbiguous = true;
      log.warn('リフレッシュボタンの候補が複数あるため押さない', { count: candidates.length });
    }
    const [button] = candidates;
    if (candidates.length !== 1 || !button || isDisabled(button)) return;
    button.click();
    lastRefreshAt = Date.now();
  };

  const tick = (): void => {
    refreshIfPossible();
    schedule();
  };

  const schedule = (): void => {
    clearTimeout(timer);
    timer = setTimeout(tick, intervalMs);
  };

  const onVisibilityChange = (): void => {
    if (!document.hidden && Date.now() - lastRefreshAt >= intervalMs) tick();
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  schedule();
  log.info('started', { intervalMs });

  return () => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    root.removeAttribute(MARKER_ATTRIBUTE);
  };
}
