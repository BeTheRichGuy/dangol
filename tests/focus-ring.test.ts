import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(path.resolve(__dirname, '../src/app/globals.css'), 'utf8');

const NIGHT = '.dg-world--night :focus-visible:where(:not(.dg-field)) {';
const PAPER = '.dg-world--night :is(.dg-answer[data-paper="true"], .dg-sheet) :focus-visible:where(:not(.dg-field)) {';

function block(selector: string): string {
  const start = CSS.indexOf(selector);
  expect(start, `${selector} 규칙이 있어야 한다`).toBeGreaterThan(-1);
  return CSS.slice(start, CSS.indexOf('}', start));
}

describe('밤 화면 포커스 링', () => {
  it('밤 규칙은 링을 금빛으로 바꾼다', () => {
    expect(block(NIGHT)).toContain('outline: 2px solid var(--glow)');
  });

  it('종이 면(대화 종이 시트, 이메일 시트)에서는 링을 먹빛으로 되돌린다', () => {
    expect(block(PAPER)).toContain('outline-color: var(--ink)');
  });

  it('종이 면 규칙이 밤 규칙과 .dg-check 규칙보다 뒤에 있다(명시도가 같아도 뒤쪽이 이긴다)', () => {
    const paper = CSS.indexOf(PAPER);
    expect(paper).toBeGreaterThan(CSS.indexOf(NIGHT));
    expect(paper).toBeGreaterThan(CSS.indexOf('.dg-check:focus-visible {'));
  });

  it('입력 칸(.dg-field)은 종이 면 규칙에서도 빠진다', () => {
    expect(PAPER).toContain(':where(:not(.dg-field))');
  });
});
