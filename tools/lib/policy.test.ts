// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { distUrls, REPOSITORY_URL } from '../../src/shared/meta.ts';
import { checkUserscript } from './policy.ts';

const SLUG = 'sample';

function header(lines: string[]): string {
  return ['// ==UserScript==', ...lines, '// ==/UserScript=='].join('\n');
}

function validHeaderLines({ version = '1.0.0', grant = ['GM_addStyle'] } = {}): string[] {
  const urls = distUrls(SLUG);
  return [
    '// @name         Sample',
    `// @namespace    ${REPOSITORY_URL}`,
    `// @version      ${version}`,
    '// @description  sample',
    '// @match        https://example.com/*',
    ...grant.map((value) => `// @grant        ${value}`),
    `// @downloadURL  ${urls.downloadURL}`,
    `// @updateURL    ${urls.updateURL}`,
    '// @noframes',
  ];
}

function run(
  lines: string[],
  { body = "\n(function () { GM_addStyle('a{}'); })();\n", base = null as string | null } = {},
) {
  const headerText = header(lines);
  return checkUserscript({
    slug: SLUG,
    source: headerText + body,
    metaSource: headerText,
    baseSource: base,
  });
}

const errors = (issues: ReturnType<typeof run>) =>
  issues.filter((issue) => issue.level === 'error').map((issue) => issue.message);

describe('checkUserscript', () => {
  it('正しい配布物はエラーも警告も出さない', () => {
    expect(run(validHeaderLines())).toEqual([]);
  });

  it('メタデータブロックが無ければエラー', () => {
    const issues = checkUserscript({
      slug: SLUG,
      source: 'console.log(1)',
      metaSource: null,
      baseSource: null,
    });
    expect(errors(issues)).toHaveLength(1);
  });

  it('@include を禁止する', () => {
    expect(errors(run([...validHeaderLines(), '// @include *']))).toContainEqual(
      expect.stringContaining('@include'),
    );
  });

  it('全サイト対象の @match を禁止する', () => {
    const lines = validHeaderLines().map((line) =>
      line.includes('@match') ? '// @match        *://*/*' : line,
    );
    expect(errors(run(lines))).toContainEqual(expect.stringContaining('広すぎる'));
  });

  it('@connect * を禁止する', () => {
    const lines = [...validHeaderLines({ grant: ['GM_xmlhttpRequest'] }), '// @connect *'];
    expect(errors(run(lines, { body: '\nGM_xmlhttpRequest({});\n' }))).toContainEqual(
      expect.stringContaining('@connect *'),
    );
  });

  it('SRI の無い @require を禁止する', () => {
    const lines = [...validHeaderLines(), '// @require https://cdn.example.com/lib.js'];
    expect(errors(run(lines))).toContainEqual(expect.stringContaining('SRI'));
  });

  it('SRI 付きの @require は通す', () => {
    const lines = [
      ...validHeaderLines(),
      '// @require https://cdn.example.com/lib.js#sha256=abcDEF123+/==',
    ];
    expect(errors(run(lines))).toEqual([]);
  });

  it('@grant none で GM API を使っていればエラー', () => {
    const lines = validHeaderLines({ grant: ['none'] });
    expect(errors(run(lines))).toContainEqual(expect.stringContaining('@grant none'));
  });

  it('@grant none で GM_info だけなら通す', () => {
    const lines = validHeaderLines({ grant: ['none'] });
    expect(errors(run(lines, { body: '\nconsole.log(GM_info.script.name);\n' }))).toEqual([]);
  });

  it('@grant が無ければエラー', () => {
    expect(errors(run(validHeaderLines({ grant: [] })))).toContainEqual(
      expect.stringContaining('@grant'),
    );
  });

  it('配信 URL が違えばエラー', () => {
    const lines = validHeaderLines().map((line) =>
      line.includes('@downloadURL')
        ? '// @downloadURL  https://evil.example.com/sample.user.js'
        : line,
    );
    expect(errors(run(lines))).toContainEqual(expect.stringContaining('@downloadURL'));
  });

  it('eval を含む本体はエラー', () => {
    expect(errors(run(validHeaderLines(), { body: '\neval("1");\n' }))).toContainEqual(
      expect.stringContaining('eval'),
    );
  });

  it('.meta.js がヘッダーと食い違えばエラー', () => {
    const headerText = header(validHeaderLines());
    const issues = checkUserscript({
      slug: SLUG,
      source: `${headerText}\nGM_addStyle('');`,
      metaSource: header(validHeaderLines({ version: '0.9.0' })),
      baseSource: null,
    });
    expect(errors(issues)).toContainEqual(expect.stringContaining('meta.js'));
  });

  it('内容が変わったのに @version が同じならエラー', () => {
    const base = `${header(validHeaderLines())}\nGM_addStyle('old');`;
    expect(errors(run(validHeaderLines(), { base }))).toContainEqual(
      expect.stringContaining('@version'),
    );
  });

  it('@version を上げていれば通す', () => {
    const base = `${header(validHeaderLines())}\nGM_addStyle('old');`;
    expect(errors(run(validHeaderLines({ version: '1.0.1' }), { base }))).toEqual([]);
  });

  it('@noframes が無ければ警告', () => {
    const lines = validHeaderLines().filter((line) => !line.includes('@noframes'));
    expect(run(lines)).toEqual([expect.objectContaining({ level: 'warning' })]);
  });
});
