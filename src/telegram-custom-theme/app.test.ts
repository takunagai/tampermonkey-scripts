import { describe, expect, it } from 'vitest';
import { gm } from '../../tests/gm-stub.ts';
import {
  CHAT_MAX_WIDTH,
  MESSAGE_GAP,
  MESSAGE_GROUP_GAP,
  MESSAGE_PADDING,
  SCRIPT_ID,
  STYLE,
  start,
} from './app.ts';

describe(SCRIPT_ID, () => {
  it('スタイルを 1 回だけ追加する', () => {
    start();
    start();

    expect(gm.GM_addStyle).toHaveBeenCalledTimes(1);
    expect(gm.GM_addStyle).toHaveBeenCalledWith(STYLE);
  });

  it('JS がインラインで入れる列の幅を !important で上書きする', () => {
    // happy-dom はインライン指定のカスタムプロパティに対する !important の優先を再現しない。
    // Chrome では --chat-width が 696px から 1000px になり、.bubbles-inner と入力欄が 1000px に
    // 広がることを実ページで確認済み（2026-09-29）なので宣言の有無で検証する
    expect(STYLE).toContain(`--chat-width: ${CHAT_MAX_WIDTH} !important;`);
  });

  it('各メッセージの 30rem 上限を広い画面でだけ 85% に戻す', () => {
    // Chrome では各メッセージの最大幅が 480px から 850px（列 1000px の 85%）になることを
    // 実ページで確認済み（2026-09-29）
    expect(STYLE).toMatch(
      /@media only screen and \(min-width: 601px\) \{\s*\.bubbles-inner:not\(\.is-broadcast\) \.bubble:not\(\.service\) \{\s*--max-width: 85%;/,
    );
  });

  describe('幅の統一', () => {
    function addBubble(bubbleClass: string, innerClass = 'bubbles-inner'): HTMLElement {
      const inner = document.createElement('div');
      inner.className = innerClass;
      const bubble = document.createElement('div');
      bubble.className = `bubble ${bubbleClass}`;
      const wrapper = document.createElement('div');
      wrapper.className = 'bubble-content-wrapper';
      const content = document.createElement('div');
      content.className = 'bubble-content';
      wrapper.append(content);
      bubble.append(wrapper);
      inner.append(bubble);
      document.body.append(inner);
      return wrapper;
    }

    // Chrome では文字数の違うテキストのメッセージがすべて 850px にそろうことを実ページで確認済み（2026-09-29）
    it.each([
      ['テキスト', 'is-in'],
      ['自分の送信', 'is-out'],
      ['返信', 'is-in is-reply'],
      ['ファイル', 'is-in document-message'],
      ['リンクプレビュー付き', 'is-in has-webpage single-media photo'],
    ])('%s は上限まで伸ばす', (_label, bubbleClass) => {
      const wrapper = addBubble(bubbleClass);

      start();

      expect(getComputedStyle(wrapper).width).toBe('100%');
    });

    it.each([
      ['画像', 'is-in photo'],
      ['動画', 'is-in video'],
      ['ステッカー', 'is-in sticker'],
      ['大きな絵文字', 'is-in emoji-big'],
      ['丸い動画', 'is-in round'],
      ['アルバム', 'is-in is-album'],
      ['日付などの区切り', 'service'],
    ])('%s は伸ばさない', (_label, bubbleClass) => {
      const wrapper = addBubble(bubbleClass);

      start();

      expect(getComputedStyle(wrapper).width).not.toBe('100%');
    });

    it('チャンネルは伸ばさない', () => {
      const wrapper = addBubble('is-in', 'bubbles-inner is-broadcast');

      start();

      expect(getComputedStyle(wrapper).width).not.toBe('100%');
    });
  });

  describe('間隔と受信メッセージの上辺', () => {
    const OUT_COLOR = 'rgb(83, 142, 77)';

    function addBubble(bubbleClass: string): { bubble: HTMLElement; content: HTMLElement } {
      const inner = document.createElement('div');
      inner.className = 'bubbles-inner';
      // Telegram はテーマの変数を :root に定義している
      inner.style.setProperty('--message-out-background-color', OUT_COLOR);
      const bubble = document.createElement('div');
      bubble.className = `bubble ${bubbleClass}`;
      const content = document.createElement('div');
      content.className = 'bubble-content';
      bubble.append(content);
      inner.append(bubble);
      document.body.append(inner);
      return { bubble, content };
    }

    it('メッセージ間と連続の最後の後の間隔を広げる', () => {
      const { bubble } = addBubble('is-in');
      const { bubble: last } = addBubble('is-in is-group-last');

      start();

      // 計算値は px（1rem = 16px）
      expect(getComputedStyle(bubble).marginBottom).toBe(
        `${Number.parseFloat(MESSAGE_GAP) * 16}px`,
      );
      expect(getComputedStyle(last).marginBottom).toBe(
        `${Number.parseFloat(MESSAGE_GROUP_GAP) * 16}px`,
      );
    });

    // Chrome では受信メッセージの上辺の角丸が 0 になり、ボーダーが送信メッセージの背景色になることを
    // 実ページで確認済み（2026-09-29）
    it('受信メッセージは上辺の角丸を消し、送信メッセージの色の上ボーダーを付ける', () => {
      const { bubble, content } = addBubble('is-in is-group-first');

      start();

      const bubbleStyle = getComputedStyle(bubble);
      expect(bubbleStyle.getPropertyValue('--border-start-start-radius').trim()).toBe('0');
      expect(bubbleStyle.getPropertyValue('--border-start-end-radius').trim()).toBe('0');
      const contentStyle = getComputedStyle(content);
      expect(contentStyle.borderTopWidth).toBe('2px');
      expect(contentStyle.borderTopColor).toBe(OUT_COLOR);
    });

    it.each([
      ['送信メッセージ', 'is-out'],
      ['ステッカー', 'is-in sticker'],
      ['大きな絵文字', 'is-in emoji-big'],
      ['丸い動画', 'is-in round'],
      ['メディアだけ', 'is-in just-media'],
      ['日付などの区切り', 'service'],
    ])('%s の上辺は変えない', (_label, bubbleClass) => {
      const { bubble, content } = addBubble(bubbleClass);

      start();

      expect(getComputedStyle(bubble).getPropertyValue('--border-start-start-radius')).toBe('');
      expect(getComputedStyle(content).borderTopColor).not.toBe(OUT_COLOR);
    });
  });

  describe('内側の余白', () => {
    // Telegram は子要素の margin で余白を作っている（本文 .message は 4px 8px 5px）
    function addSiteStyle(): void {
      const style = document.createElement('style');
      style.textContent = '.bubble-content > div { margin: 4px 8px 5px; }';
      document.head.append(style);
    }

    function addBubble(
      bubbleClass: string,
      { hasTail = false } = {},
    ): { content: HTMLElement; reply: HTMLElement; message: HTMLElement } {
      const inner = document.createElement('div');
      inner.className = 'bubbles-inner';
      const bubble = document.createElement('div');
      bubble.className = `bubble ${bubbleClass}`;
      const content = document.createElement('div');
      content.className = 'bubble-content';
      const addChild = (className: string): HTMLElement => {
        const child = document.createElement('div');
        child.className = className;
        content.append(child);
        return child;
      };
      const reply = addChild('reply');
      const message = addChild('message');
      if (hasTail) addChild('bubble-tail');
      bubble.append(content);
      inner.append(bubble);
      document.body.append(inner);
      addSiteStyle();
      return { content, reply, message };
    }

    // Chrome では テキスト・返信・送信・リンクプレビュー付き・ファイルの枠から中身までが
    // 上下 15px・左右 10px ちょうどになることを実ページで確認済み（2026-09-29）
    it.each([
      ['受信', 'is-in'],
      ['送信', 'is-out'],
      ['リンクプレビュー付き', 'is-in has-webpage photo'],
    ])('%s は padding を入れ、子要素の左右の margin を 0 にする', (_label, bubbleClass) => {
      const { content, reply, message } = addBubble(bubbleClass);

      start();

      expect(getComputedStyle(content).padding).toBe(MESSAGE_PADDING);
      for (const child of [reply, message]) {
        const style = getComputedStyle(child);
        expect(style.marginLeft).toBe('0px');
        expect(style.marginRight).toBe('0px');
      }
    });

    it('先頭の上と末尾の下の margin を 0 にし、子要素どうしの間の margin は残す', () => {
      const { reply, message } = addBubble('is-in', { hasTail: true });

      start();

      expect(getComputedStyle(reply).marginTop).toBe('0px');
      expect(getComputedStyle(reply).marginBottom).toBe('5px');
      expect(getComputedStyle(message).marginTop).toBe('4px');
      // 末尾の .bubble-tail は数えない
      expect(getComputedStyle(message).marginBottom).toBe('0px');
    });

    it.each([
      ['画像', 'is-in photo'],
      ['ステッカー', 'is-in sticker'],
      ['メディアだけ', 'is-in just-media'],
      ['日付などの区切り', 'service'],
    ])('%s は変えない', (_label, bubbleClass) => {
      const { content, message } = addBubble(bubbleClass);

      start();

      expect(getComputedStyle(content).padding).not.toBe(MESSAGE_PADDING);
      expect(getComputedStyle(message).marginLeft).toBe('8px');
    });
  });
});
