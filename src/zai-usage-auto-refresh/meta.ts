import { defineUserscript } from '../shared/meta.ts';

export default defineUserscript('zai-usage-auto-refresh', {
  name: 'Z.ai Usage Auto Refresh',
  description:
    'Z.ai GLM Coding Plan の Usage ページで、右上のリフレッシュボタンを 1 分ごとに自動で押す',
  version: '1.0.0',
  // SPA のため Usage ページへ画面内遷移しても動くよう /manage-apikey/ 配下に注入し、押すかどうかはパスで判定する
  match: ['https://z.ai/manage-apikey/*'],
  grant: 'none',
});
