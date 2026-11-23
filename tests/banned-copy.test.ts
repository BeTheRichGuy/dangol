import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const BANNED = /에너지|우주|매니페스트|エネルギー|宇宙|マニフェスト/;

describe('ko/ja copy has no banned words', () => {
  for (const locale of ['ko', 'ja']) {
    const dir = path.join(__dirname, '..', 'src', 'content', locale);
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
      it(`${locale}/${file}`, () => {
        const code = readFileSync(path.join(dir, file), 'utf8')
          .split('\n')
          .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*') && !line.trim().startsWith('/*'))
          .join('\n');
        const hit = code.split('\n').find((line) => BANNED.test(line));
        expect(hit ?? null).toBeNull();
      });
    }
  }
});
