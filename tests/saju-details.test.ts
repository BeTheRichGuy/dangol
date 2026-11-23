import { describe, expect, it } from 'vitest';
import { Solar } from 'lunar-javascript';
import {
  HIDDEN_STEMS,
  branchGod,
  mainStemOf,
  relationsAmong,
  shinsalOf,
  stageOf,
  tenGod,
  voidBranches,
  yearGanzhi,
} from '@/lib/saju/details';
import { BRANCHES, branchElement, stemElement } from '@/lib/saju/tables';
import type { Branch, Stem } from '@/lib/saju/types';

interface LibDetail {
  getYear(): string;
  getMonth(): string;
  getDay(): string;
  getTime(): string;
  getYearHideGan(): string[];
  getMonthHideGan(): string[];
  getTimeHideGan(): string[];
  getYearShiShenGan(): string;
  getMonthShiShenGan(): string;
  getTimeShiShenGan(): string;
  getYearShiShenZhi(): string[];
  getMonthShiShenZhi(): string[];
  getTimeShiShenZhi(): string[];
  getYearDiShi(): string;
  getMonthDiShi(): string;
  getDayDiShi(): string;
  getTimeDiShi(): string;
  getDayXunKong(): string;
}

const GOD: Record<string, string> = {
  比肩: '比肩', 劫财: '劫財', 食神: '食神', 伤官: '傷官', 偏财: '偏財', 正财: '正財',
  七杀: '偏官', 正官: '正官', 偏印: '偏印', 正印: '正印',
};
const STAGE: Record<string, string> = {
  长生: '長生', 沐浴: '沐浴', 冠带: '冠帶', 临官: '建祿', 帝旺: '帝旺', 衰: '衰',
  病: '病', 死: '死', 墓: '墓', 绝: '絶', 胎: '胎', 养: '養',
};

function sample(n: number): LibDetail[] {
  const out: LibDetail[] = [];
  for (let i = 0; i < n; i += 1) {

    const year = 1950 + (i % 60);
    const month = 1 + ((i * 7) % 12);
    const day = 1 + ((i * 11) % 28);
    const hour = (i * 5) % 24;
    out.push(Solar.fromYmdHms(year, month, day, hour, 30, 0).getLunar().getEightChar() as unknown as LibDetail);
  }
  return out;
}

describe('지장간', () => {
  it('마지막 글자(본기)의 오행이 엔진의 지지 오행(본기 기준)과 같다', () => {
    for (const b of BRANCHES) {
      expect(stemElement(mainStemOf(b))).toBe(branchElement(b));
      expect(HIDDEN_STEMS[b].length).toBeGreaterThanOrEqual(2);
    }
  });

  it('lunar-javascript 의 지장간이 모두 들어 있고 본기가 같다', () => {
    for (const ec of sample(240)) {
      const cases: [string, string[]][] = [
        [ec.getYear().charAt(1), ec.getYearHideGan()],
        [ec.getMonth().charAt(1), ec.getMonthHideGan()],
        [ec.getTime().charAt(1), ec.getTimeHideGan()],
      ];
      for (const [branch, lib] of cases) {
        const ours = HIDDEN_STEMS[branch as Branch];
        expect(mainStemOf(branch as Branch)).toBe(lib[0]);
        for (const s of lib) expect(ours).toContain(s);
      }
    }
  });
});

describe('십신', () => {
  it('천간과 지장간의 십신이 lunar-javascript 와 같다', () => {
    for (const ec of sample(240)) {
      const me = ec.getDay().charAt(0) as Stem;
      const stems: [string, string][] = [
        [ec.getYear().charAt(0), ec.getYearShiShenGan()],
        [ec.getMonth().charAt(0), ec.getMonthShiShenGan()],
        [ec.getTime().charAt(0), ec.getTimeShiShenGan()],
      ];
      for (const [stem, lib] of stems) expect(tenGod(me, stem as Stem)).toBe(GOD[lib]);

      const hidden: [string[], string[]][] = [
        [ec.getYearHideGan(), ec.getYearShiShenZhi()],
        [ec.getMonthHideGan(), ec.getMonthShiShenZhi()],
        [ec.getTimeHideGan(), ec.getTimeShiShenZhi()],
      ];
      for (const [gans, gods] of hidden) {
        gans.forEach((g, i) => expect(tenGod(me, g as Stem)).toBe(GOD[gods[i]]));
      }
    }
  });

  it('지지의 십신은 본기로 본다', () => {
    expect(branchGod('甲', '午')).toBe('傷官');
    expect(branchGod('甲', '丑')).toBe('正財');
    expect(branchGod('丁', '亥')).toBe('正官');
  });
});

describe('십이운성', () => {
  it('일간이 연·월·일·시 지지에서 갖는 운성이 lunar-javascript 와 같다', () => {
    for (const ec of sample(240)) {
      const me = ec.getDay().charAt(0) as Stem;
      const cases: [string, string][] = [
        [ec.getYear().charAt(1), ec.getYearDiShi()],
        [ec.getMonth().charAt(1), ec.getMonthDiShi()],
        [ec.getDay().charAt(1), ec.getDayDiShi()],
        [ec.getTime().charAt(1), ec.getTimeDiShi()],
      ];
      for (const [branch, lib] of cases) expect(stageOf(me, branch as Branch)).toBe(STAGE[lib]);
    }
  });

  it('양간은 순행, 음간은 역행한다', () => {
    expect(stageOf('甲', '亥')).toBe('長生');
    expect(stageOf('甲', '寅')).toBe('建祿');
    expect(stageOf('甲', '卯')).toBe('帝旺');
    expect(stageOf('乙', '午')).toBe('長生');
    expect(stageOf('乙', '卯')).toBe('建祿');
    expect(stageOf('乙', '寅')).toBe('帝旺');
  });
});

describe('공망', () => {
  it('일주의 순중공망이 lunar-javascript 와 같다', () => {
    for (const ec of sample(240)) {
      const day = ec.getDay();
      expect(voidBranches(day.charAt(0) as Stem, day.charAt(1) as Branch).join('')).toBe(ec.getDayXunKong());
    }
  });
});

describe('해의 간지', () => {
  it('입춘 기준 해 간지', () => {
    expect(yearGanzhi(1984)).toBe('甲子');
    expect(yearGanzhi(2026)).toBe('丙午');
    expect(yearGanzhi(2027)).toBe('丁未');
    expect(yearGanzhi(2028)).toBe('戊申');
    expect(yearGanzhi(1950)).toBe('庚寅');
  });
});

describe('합충형파해', () => {
  const at = (pos: string, chars: string) => [
    { at: pos, char: chars.charAt(0) as Stem },
    { at: pos, char: chars.charAt(1) as Branch },
  ];

  it('천간합·충, 육합, 반합, 삼합, 방합을 찾는다', () => {
    const r = relationsAmong([...at('year', '甲子'), ...at('month', '己丑'), ...at('day', '庚辰'), ...at('hour', '丙申')]);
    const kinds = r.map((x) => `${x.kind}:${x.chars}`);
    expect(kinds).toContain('天干合:甲己');
    expect(kinds).toContain('天干沖:甲庚');
    expect(kinds).toContain('六合:子丑');
    expect(kinds).toContain('半合:子辰');
    expect(kinds).toContain('三合:申子辰');
    expect(kinds).toContain('破:丑辰');
  });

  it('충, 형, 자형, 해, 원진, 귀문을 찾는다', () => {
    const r = relationsAmong([...at('year', '庚午'), ...at('month', '己丑'), ...at('day', '甲午'), ...at('hour', '戊子')]);
    const kinds = r.map((x) => `${x.kind}:${x.chars}`);
    expect(kinds).toContain('沖:午子');
    expect(kinds).toContain('自刑:午午');
    expect(kinds).toContain('害:丑午');
    expect(kinds).toContain('怨嗔:丑午');
    expect(kinds).toContain('鬼門:丑午');
    expect(kinds).toContain('六合:丑子');
  });

  it('pivot 을 주면 그 자리가 든 관계만 남긴다', () => {
    const r = relationsAmong([...at('day', '甲午'), ...at('yearLuck', '庚子')], 'yearLuck');
    expect(r.every((x) => x.at.includes('yearLuck'))).toBe(true);
    expect(r.map((x) => x.kind)).toEqual(expect.arrayContaining(['天干沖', '沖']));
  });
});

describe('신살', () => {
  it('일간·년지·일지 기준 신살과 공망을 센다', () => {
    const natal = [
      { at: 'year', stem: '庚' as Stem, branch: '辰' as Branch },
      { at: 'month', stem: '己' as Stem, branch: '酉' as Branch },
      { at: 'day', stem: '甲' as Stem, branch: '子' as Branch },
      { at: 'hour', stem: '丁' as Stem, branch: '卯' as Branch },
    ];
    const s = shinsalOf(natal);
    const names = s.map((x) => `${x.name}@${x.at.join(',')}`);

    expect(names).toContain('桃花@month');

    expect(names).toContain('羊刃@hour');

    expect(s.some((x) => x.name === '空亡')).toBe(false);

    const luck = shinsalOf(natal, [{ at: 'yearLuck', stem: '乙' as Stem, branch: '亥' as Branch }]).map((x) => x.name);
    expect(luck).toContain('空亡');
  });
});
