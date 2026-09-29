import { defineUserscript } from '../shared/meta.ts';

export default defineUserscript('telegram-custom-theme', {
  name: 'Telegram Custom Theme',
  description:
    'Telegram Web（K 版）のメッセージ表示の幅・間隔・余白・受信メッセージの上辺を調整する（見た目のみ変更）',
  version: '1.0.0',
  // 調整は Web K 版の DOM に合わせている。Web A 版（/a/）は構造が違うので対象外
  match: ['https://web.telegram.org/k/*'],
  // 狭い幅で一瞬描画されてから広がるのを避けるため、ページの読み込み前に CSS を入れる
  'run-at': 'document-start',
});
