import { GM_addStyle } from '$';
import { createLogger } from '../shared/log.ts';

export const SCRIPT_ID = 'telegram-custom-theme';
const MARKER_ATTRIBUTE = `data-tm-${SCRIPT_ID}`;

/** メッセージ列（と入力欄）の最大幅。広い画面でも 1 行が長くなりすぎない値 */
export const CHAT_MAX_WIDTH = '1000px';
/** メッセージ間の間隔（Telegram は .125rem）と、連続の最後の後の間隔（Telegram は .375rem） */
export const MESSAGE_GAP = '.375rem';
export const MESSAGE_GROUP_GAP = '.625rem';
/** 受信・送信メッセージの内側の余白 */
export const MESSAGE_PADDING = '15px 10px';

const log = createLogger(SCRIPT_ID);

// Telegram Web K（/k/）の幅の上限は 2 段ある（2026-09-29 実ページで確認）
// 1. 列全体: JS が <html style="--chat-width: 696px"> を入れ、.bubbles-inner と .chat-input-main がこれを上限にする
//    インライン指定の変数は、スタイルシート側の !important で上書きできる
// 2. 各メッセージ: `.bubbles-inner:not(.is-broadcast) .bubble { --max-width: 30rem }` が
//    Telegram 自身の広い画面用の指定（`.bubble:not(.service) { --max-width: 85% }`）より優先され、480px で止まる
//    .bubble-content-wrapper の max-width が var(--max-width) を参照する
// 3. 幅の統一: .bubble は flex で、.bubble-content-wrapper が中身の幅まで縮む。width: 100% で上限（85%）まで伸ばす
//    ファイルは `.bubble.document-message { --max-content-width: 325px }` の上限もあるので外す
//    画像・動画・ステッカー等はメディアの寸法で決まるので伸ばさない。リンクプレビュー付き（.has-webpage）は
//    バブルに photo / video クラスが付くが本体はテキストなので伸ばす（プレビュー画像自体は Telegram の上限のまま）
// 狭い画面（600px 以下）は Telegram 側の指定のままにする
// 4. 間隔: Telegram は `.bubble { margin-bottom: .125rem }`、連続の最後（.is-group-last）だけ .375rem
// 5. 受信メッセージの上辺: 角丸は .bubble の変数 --border-start-start-radius / --border-start-end-radius で決まる。
//    .bubble-content の直指定でなく変数で消すと、キャプション付き画像など中のメディアの角も一緒に四角になる
//    ボーダー色は送信メッセージの背景色の変数（ライト・ダークどちらのテーマでも定義されている）
//    背景を持たないステッカー・大きな絵文字・丸い動画・メディアだけのメッセージは対象外
const TEXT_BUBBLE = `.bubbles-inner:not(.is-broadcast) .bubble:is(.has-webpage, :not(.sticker, .emoji-big, .round, .just-media, .photo, .video, .is-album)):not(.service)`;

const INCOMING_BUBBLE = `.bubbles-inner .bubble.is-in:not(.service, .sticker, .emoji-big, .round, .just-media)`;

// 6. 内側の余白: .bubble-content は padding 0 で、子要素の margin（本文 .message は 4px 8px 5px、返信引用は 8px 8px -2px 等）
//    で余白を作っている。padding を入れて子の外周の margin（左右・先頭の上・末尾の下）を 0 にし、見た目の余白を
//    padding の値ちょうどにする。.bubble-tail と .bubble-content-background（ファイル等の背景）は余白の計算から外す
//    ファイルは .document の margin: 8px 0 が親を突き抜けて足されるので、先頭の上・末尾の下を 0 にする（複数ファイル間の間隔は残す）
//    画像・動画など端までメディアを表示するものは対象外（幅の統一と同じ範囲。リンクプレビュー付きは含める）
const PADDED_BUBBLE = `.bubbles-inner .bubble:is(.is-in, .is-out):is(.has-webpage, :not(.service, .sticker, .emoji-big, .round, .just-media, .photo, .video, .is-album))`;
const CONTENT_CHILD = `:not(.bubble-tail, .bubble-content-background)`;

export const STYLE = `
  html:root {
    --chat-width: ${CHAT_MAX_WIDTH} !important;
  }
  .bubbles-inner .bubble:not(.service, .is-sponsored) {
    margin-bottom: ${MESSAGE_GAP};
  }
  .bubbles-inner .bubble.is-group-last:not(.service, .is-sponsored) {
    margin-bottom: ${MESSAGE_GROUP_GAP};
  }
  ${INCOMING_BUBBLE} {
    --border-start-start-radius: 0;
    --border-start-end-radius: 0;
  }
  ${INCOMING_BUBBLE} .bubble-content {
    border-top: 2px solid var(--message-out-background-color);
  }
  ${PADDED_BUBBLE} .bubble-content {
    padding: ${MESSAGE_PADDING};
  }
  ${PADDED_BUBBLE} .bubble-content > ${CONTENT_CHILD} {
    margin-left: 0;
    margin-right: 0;
  }
  ${PADDED_BUBBLE} .bubble-content > :nth-child(1 of ${CONTENT_CHILD}),
  ${PADDED_BUBBLE} .document-container.is-first .document {
    margin-top: 0;
  }
  ${PADDED_BUBBLE} .bubble-content > :nth-last-child(1 of ${CONTENT_CHILD}),
  ${PADDED_BUBBLE} .document-container.is-last .document {
    margin-bottom: 0;
  }
  @media only screen and (min-width: 601px) {
    .bubbles-inner:not(.is-broadcast) .bubble:not(.service) {
      --max-width: 85%;
    }
    ${TEXT_BUBBLE} {
      --max-content-width: 100%;
    }
    ${TEXT_BUBBLE} .bubble-content-wrapper,
    ${TEXT_BUBBLE} .bubble-content {
      width: 100%;
    }
  }
`;

/** 見た目を調整する CSS を 1 回だけ入れる */
export function start(): void {
  const root = document.documentElement;
  if (root.hasAttribute(MARKER_ATTRIBUTE)) return;
  root.setAttribute(MARKER_ATTRIBUTE, 'active');

  GM_addStyle(STYLE);
  log.info('style applied');
}
