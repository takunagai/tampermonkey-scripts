import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findRefreshCandidates,
  isUsagePage,
  REFRESH_INTERVAL_MS,
  SCRIPT_ID,
  start,
} from './app.ts';

const USAGE_PATH = '/manage-apikey/coding-plan/personal/usage';

type ButtonOptions = {
  withIcon?: boolean;
  disabled?: boolean;
  ariaDisabled?: boolean;
  type?: 'button' | 'submit';
  isVisible?: boolean;
};

function addRefreshButton({
  withIcon = true,
  disabled = false,
  ariaDisabled = false,
  type = 'button',
  isVisible = true,
}: ButtonOptions = {}): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = type;
  button.setAttribute('aria-label', 'Refresh');
  button.disabled = disabled;
  if (ariaDisabled) button.setAttribute('aria-disabled', 'true');
  if (withIcon) {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'lucide lucide-rotate-ccw');
    button.append(icon);
  }
  // happy-dom はレイアウトを計算しないので、表示状態は直接与える
  button.checkVisibility = () => isVisible;
  document.body.append(button);
  return button;
}

function watchClicks(button: HTMLButtonElement) {
  const onClick = vi.fn();
  button.addEventListener('click', onClick);
  return onClick;
}

function setHidden(isHidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => isHidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe(SCRIPT_ID, () => {
  let stop: () => void = () => {};

  beforeEach(() => {
    vi.useFakeTimers();
    history.pushState({}, '', USAGE_PATH);
    setHidden(false);
  });

  afterEach(() => {
    stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('1 分ごとにリフレッシュボタンを押す', () => {
    const onClick = watchClicks(addRefreshButton());

    stop = start();
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS - 1);
    expect(onClick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2);
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('二重に起動してもタイマーは 1 つ', () => {
    const onClick = watchClicks(addRefreshButton());

    stop = start();
    start();
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('タブが非表示の間は押さず、表示に戻ったら古ければすぐ押す', () => {
    const onClick = watchClicks(addRefreshButton());

    stop = start();
    setHidden(true);
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 3);
    expect(onClick).not.toHaveBeenCalled();

    setHidden(false);
    expect(onClick).toHaveBeenCalledTimes(1);
    // 押した時点から数え直す
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS - 1);
    expect(onClick).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('表示に戻っても前回から 1 分たっていなければ押さない', () => {
    const onClick = watchClicks(addRefreshButton());

    stop = start();
    setHidden(true);
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS / 2);
    setHidden(false);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('Usage 以外のページでは押さない', () => {
    history.pushState({}, '', '/manage-apikey/apikey-list');
    const onClick = watchClicks(addRefreshButton());

    stop = start();
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('SPA で Usage ページに入れば押し、出れば押さない', () => {
    history.pushState({}, '', '/manage-apikey/apikey-list');
    const onClick = watchClicks(addRefreshButton());

    stop = start();
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    expect(onClick).not.toHaveBeenCalled();

    history.pushState({}, '', USAGE_PATH);
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    expect(onClick).toHaveBeenCalledTimes(1);

    history.pushState({}, '', '/manage-apikey/apikey-list');
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['無効化されたボタン', { disabled: true }],
    ['aria-disabled のボタン', { ariaDisabled: true }],
    ['アイコンの無い Refresh ボタン', { withIcon: false }],
    ['submit ボタン（フォーム送信になる）', { type: 'submit' }],
    ['非表示のボタン', { isVisible: false }],
  ] satisfies [string, ButtonOptions][])('%s は押さない', (_label, options) => {
    const onClick = watchClicks(addRefreshButton(options));

    stop = start();
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('候補が複数あるときはどれも押さず、警告は 1 回だけ出す', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const first = watchClicks(addRefreshButton());
    const second = watchClicks(addRefreshButton());

    stop = start();
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 3);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('非表示の同名ボタンが残っていても、表示中の 1 つは押す', () => {
    watchClicks(addRefreshButton({ isVisible: false }));
    const onClick = watchClicks(addRefreshButton());

    stop = start();
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ボタンが後から描画されても次の周期で押す', () => {
    stop = start();
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS);

    const onClick = watchClicks(addRefreshButton());
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('停止後はタイマーでも表示切り替えでも押さない', () => {
    const onClick = watchClicks(addRefreshButton());

    stop = start();
    stop();
    vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2);
    setHidden(true);
    setHidden(false);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('isUsagePage / findRefreshCandidates', () => {
  it('Usage ページのパスだけを対象にする', () => {
    expect(isUsagePage(USAGE_PATH)).toBe(true);
    expect(isUsagePage('/manage-apikey/coding-plan/team/usage/')).toBe(true);
    expect(isUsagePage('/manage-apikey/coding-plan/personal/usage/detail')).toBe(false);
    expect(isUsagePage('/manage-apikey/apikey-list')).toBe(false);
  });

  it('アイコン付き・type="button"・表示中の Refresh ボタンだけを候補にする', () => {
    addRefreshButton({ withIcon: false });
    addRefreshButton({ type: 'submit' });
    addRefreshButton({ isVisible: false });
    const target = addRefreshButton();
    expect(findRefreshCandidates()).toEqual([target]);
  });
});
