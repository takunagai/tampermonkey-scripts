import { describe, expect, it } from 'vitest';
import { gm } from '../../tests/gm-stub.ts';
import { BADGE_CLASS, SCRIPT_ID, start } from './app.ts';

describe(SCRIPT_ID, () => {
  it('バッジとスタイルを 1 回だけ追加する', () => {
    start();
    start();

    expect(document.getElementsByClassName(BADGE_CLASS)).toHaveLength(1);
    expect(gm.GM_addStyle).toHaveBeenCalledTimes(1);
  });

  it('バッジの文言をテキストとして入れる', () => {
    start();

    const badge = document.getElementsByClassName(BADGE_CLASS)[0];
    expect(badge?.textContent).toBe(`${SCRIPT_ID}: active`);
    expect(badge?.children).toHaveLength(0);
  });
});
