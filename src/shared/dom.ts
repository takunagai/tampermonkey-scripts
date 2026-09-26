export type WaitForElementOptions = {
  root?: ParentNode;
  timeoutMs?: number;
  signal?: AbortSignal;
};

/**
 * selector に一致する要素が現れるまで待つ。SPA で後から描画される要素向け。
 * timeoutMs を過ぎたら null を返す（例外にしない）
 */
export function waitForElement<T extends Element = Element>(
  selector: string,
  { root = document, timeoutMs = 10_000, signal }: WaitForElementOptions = {},
): Promise<T | null> {
  const found = root.querySelector<T>(selector);
  if (found) return Promise.resolve(found);

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const element = root.querySelector<T>(selector);
      if (element) finish(element);
    });
    const timer = setTimeout(() => finish(null), timeoutMs);
    const onAbort = () => finish(null);

    function finish(result: T | null) {
      observer.disconnect();
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve(result);
    }

    signal?.addEventListener('abort', onAbort, { once: true });
    const target = root instanceof Document ? root.documentElement : root;
    observer.observe(target, { childList: true, subtree: true });
  });
}
