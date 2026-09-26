export type HeaderEntry = { key: string; value: string };

export type ParsedUserscript = {
  entries: HeaderEntry[];
  /** `// ==UserScript==` から `// ==/UserScript==` までの原文 */
  headerText: string;
  body: string;
};

const HEADER_START = '// ==UserScript==';
const HEADER_END = '// ==/UserScript==';
const ENTRY_PATTERN = /^\/\/\s*@(\S+)(?:\s+(.*))?$/;

/** 先頭のメタデータブロックを解析する。形式が崩れていれば null */
export function parseUserscript(source: string): ParsedUserscript | null {
  const lines = source.replaceAll('\r\n', '\n').split('\n');
  if (lines[0]?.trim() !== HEADER_START) return null;
  const endIndex = lines.findIndex((line) => line.trim() === HEADER_END);
  if (endIndex === -1) return null;

  const entries: HeaderEntry[] = [];
  for (const line of lines.slice(1, endIndex)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed === '//') continue;
    const match = ENTRY_PATTERN.exec(trimmed);
    if (!match?.[1]) return null;
    entries.push({ key: match[1], value: (match[2] ?? '').trim() });
  }

  return {
    entries,
    headerText: lines.slice(0, endIndex + 1).join('\n'),
    body: lines.slice(endIndex + 1).join('\n'),
  };
}

export const valuesOf = (entries: HeaderEntry[], key: string): string[] =>
  entries.filter((entry) => entry.key === key).map((entry) => entry.value);

/** x.y.z 同士の比較。a が新しければ正、同じなら 0、古ければ負 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let index = 0; index < Math.max(partsA.length, partsB.length); index += 1) {
    const difference = (partsA[index] ?? 0) - (partsB[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
