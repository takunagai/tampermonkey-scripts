import { describe, expect, it } from 'vitest';
import {
  DIST_BASE_URL,
  definePrivateUserscript,
  defineUserscript,
  PRIVATE_NAMESPACE,
  REPOSITORY_URL,
} from './meta.ts';

const base = {
  name: 'Sample',
  description: 'sample',
  version: '1.2.3',
  match: ['https://example.com/*'],
};

describe('defineUserscript', () => {
  it('共通項目と配信 URL を埋める', () => {
    const meta = defineUserscript('sample', base);
    expect(meta).toMatchObject({
      namespace: REPOSITORY_URL,
      noframes: true,
      downloadURL: `${DIST_BASE_URL}/sample.user.js`,
      updateURL: `${DIST_BASE_URL}/sample.meta.js`,
    });
  });

  it('開発専用スクリプトは更新確認を止める', () => {
    const meta = defineUserscript('_sandbox', base);
    expect(meta.downloadURL).toBe('none');
    expect(meta.updateURL).toBeUndefined();
  });

  it('不正な slug・版・空の match を拒否する', () => {
    expect(() => defineUserscript('Bad_Slug', base)).toThrow();
    expect(() => defineUserscript('sample', { ...base, version: '1.0' })).toThrow();
    expect(() => defineUserscript('sample', { ...base, match: [] })).toThrow();
  });

  it('非公開スクリプトは配信 URL と公開リポジトリへのリンクを持たない', () => {
    const meta = definePrivateUserscript('my-private', base);
    expect(meta).toMatchObject({ namespace: PRIVATE_NAMESPACE, downloadURL: 'none' });
    expect(meta.updateURL).toBeUndefined();
    expect(meta.homepageURL).toBeUndefined();
    expect(meta.supportURL).toBeUndefined();
    expect(JSON.stringify(meta)).not.toContain(`${REPOSITORY_URL}/`);
  });
});
