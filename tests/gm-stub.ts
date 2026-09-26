// テスト時に '$'（vite-plugin-monkey の GM API）の代わりに読み込まれるスタブ。
// vitest.config.ts の alias で差し替える。必要な API はここに足す
import { vi } from 'vitest';

const store = new Map<string, unknown>();

export const GM_addStyle = vi.fn((css: string): HTMLStyleElement => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  return style;
});

export const GM_getValue = vi.fn(<T>(key: string, defaultValue?: T): T | undefined =>
  store.has(key) ? (store.get(key) as T) : defaultValue,
);

export const GM_setValue = vi.fn((key: string, value: unknown): void => {
  store.set(key, value);
});

export const GM_deleteValue = vi.fn((key: string): void => {
  store.delete(key);
});

export const GM_listValues = vi.fn((): string[] => [...store.keys()]);

export const GM_registerMenuCommand = vi.fn(
  (_name: string, _callback: (event: MouseEvent | KeyboardEvent) => void): string => 'menu-id',
);

export const GM_unregisterMenuCommand = vi.fn((_menuCommandId: string): void => {});

export const GM_xmlhttpRequest = vi.fn((): never => {
  throw new Error(
    'GM_xmlhttpRequest はスタブ未実装。テスト内で vi.mocked(...).mockImplementation() する',
  );
});

export const GM_info = { script: { name: 'test', version: '0.0.0' } };

// node 環境のテスト（tools/）でも読み込まれるため window ではなく globalThis を使う
export const unsafeWindow = globalThis as unknown as Window & typeof globalThis;
export const monkeyWindow = unsafeWindow;

/** テストから呼び出し回数などを参照するための束 */
export const gm = {
  GM_addStyle,
  GM_getValue,
  GM_setValue,
  GM_deleteValue,
  GM_listValues,
  GM_registerMenuCommand,
  GM_unregisterMenuCommand,
  GM_xmlhttpRequest,
};

export function resetGmStub(): void {
  store.clear();
  for (const mock of Object.values(gm)) mock.mockClear();
}
