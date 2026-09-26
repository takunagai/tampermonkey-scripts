import { defineUserscript } from '../shared/meta.ts';

export default defineUserscript('nous-portal-readability', {
  name: 'Nous Portal Readability',
  description:
    'Nous Portal の長体フォント・大文字化・字間を通常の表示に戻して読みやすくする（見た目のみ変更）',
  version: '1.0.0',
  match: ['https://portal.nousresearch.com/*'],
  // 元のフォントで一瞬描画されるのを避けるため、ページの読み込み前に CSS を入れる
  'run-at': 'document-start',
});
