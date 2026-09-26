import { defineUserscript } from '../shared/meta.ts';

// 開発専用のひな形（_ で始まるスクリプトは dist/ に出さない）。
// pnpm new <slug> がこのディレクトリをコピーして新しいスクリプトを作る
export default defineUserscript('_template', {
  name: 'Template (example.com)',
  description: 'ユーザースクリプトのひな形。example.com に目印を表示する',
  version: '0.1.0',
  match: ['https://example.com/*'],
  // @grant は使った GM API から自動で付く。GM API を使わないスクリプトは grant: 'none' を書く
});
