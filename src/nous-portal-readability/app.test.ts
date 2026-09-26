import { describe, expect, it } from 'vitest';
import { gm } from '../../tests/gm-stub.ts';
import { SCRIPT_ID, STYLE, start } from './app.ts';

function addElement(tagName: string, { className = '', text = 'Sample' } = {}): HTMLElement {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  document.body.append(element);
  return element;
}

describe(SCRIPT_ID, () => {
  it('スタイルを 1 回だけ追加する', () => {
    start();
    start();

    expect(gm.GM_addStyle).toHaveBeenCalledTimes(1);
    expect(gm.GM_addStyle).toHaveBeenCalledWith(STYLE);
  });

  it('長体・大文字化・字間の指定を打ち消し、通常のフォントにする', () => {
    const label = addElement('span', { text: 'Buy Credits' });
    label.style.textTransform = 'uppercase';
    label.style.fontStretch = '50%';
    label.style.letterSpacing = '0.1em';
    label.style.fontVariationSettings = '"wdth" 50';
    label.style.fontFamily = '"Rules Condensed", sans-serif';

    start();

    const computed = getComputedStyle(label);
    expect(computed.textTransform).toBe('none');
    expect(computed.fontStretch).toBe('100%');
    expect(computed.fontVariationSettings).toBe('normal');
    expect(computed.fontFamily).toContain('Helvetica Neue');
    // happy-dom はインライン指定に対する letter-spacing: normal !important の優先を再現しない。
    // Chrome では normal になることを実ページで確認済み（2026-09-26）なので宣言の有無で検証する
    expect(STYLE).toContain('letter-spacing: normal !important');
  });

  it('コード（子要素を含む）とサイトの等幅指定の要素は等幅フォントにする', () => {
    const code = addElement('code');
    const highlighted = document.createElement('span');
    code.append(highlighted);
    const modelId = addElement('div', { className: 'font-[family-name:var(--font-mono)]' });

    start();

    for (const element of [code, highlighted, modelId]) {
      expect(getComputedStyle(element).fontFamily).toContain('SFMono-Regular');
    }
  });

  it('通常の要素は等幅にしない', () => {
    const paragraph = addElement('p');

    start();

    expect(getComputedStyle(paragraph).fontFamily).not.toContain('SFMono-Regular');
  });
});
