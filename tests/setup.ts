import { afterEach } from 'vitest';
import { resetGmStub } from './gm-stub.ts';

afterEach(() => {
  resetGmStub();
  // node 環境のテスト（tools/）では document が無い
  if (typeof document === 'undefined') return;
  document.head.replaceChildren();
  document.body.replaceChildren();
  for (const attribute of [...document.documentElement.attributes]) {
    document.documentElement.removeAttribute(attribute.name);
  }
});
