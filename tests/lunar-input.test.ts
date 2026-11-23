import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { BirthDateField, type BirthDate } from '@/components/flow/birth-date-field';
import { checkBirthDate, convertDateText } from '@/components/flow/birth-date';
import { checkDate } from '@/components/flow/reading-form';
import { setActiveLocaleForTest } from '@/content/locale';
import { computeChart } from '@/lib/saju';
import { LUNAR_YEAR_MAX, LUNAR_YEAR_MIN, lunarToSolar, solarToLunar } from '@/lib/saju/lunar-date';

afterEach(() => setActiveLocaleForTest('en'));

const SEOUL = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };

describe('lunarToSolar / solarToLunar (알려진 날짜)', () => {

  const KNOWN: [number, number, number, boolean, string][] = [
    [1900, 1, 1, false, '1900-01-31'],
    [1929, 12, 20, false, '1930-01-19'],
    [1930, 1, 1, false, '1930-01-30'],
    [1995, 2, 14, false, '1995-03-14'],
    [1995, 8, 1, true, '1995-09-25'],
    [2000, 1, 1, false, '2000-02-05'],
    [2023, 2, 30, false, '2023-03-21'],
    [2023, 2, 1, true, '2023-03-22'],
    [2023, 2, 15, true, '2023-04-05'],
    [2025, 6, 1, true, '2025-07-25'],
    [2026, 12, 29, false, '2027-02-05'],
  ];

  it.each(KNOWN)('음력 %i.%i.%i (윤달 %s) = 양력 %s, 되돌려도 같다', (year, month, day, leap, iso) => {
    expect(lunarToSolar({ year, month, day, leap })).toEqual({ ok: true, iso });
    expect(solarToLunar(iso)).toEqual({ year, month, day, leap });
  });

  it('1930~2030 모든 날: 양력 → 음력 → 양력이 제자리로 돌아오고, 하루 지나면 음력도 하루(또는 다음 달 1일)', () => {
    let prev: ReturnType<typeof solarToLunar> = null;
    for (let t = Date.UTC(1929, 11, 1); t <= Date.UTC(2030, 11, 31); t += 86400_000) {
      const iso = new Date(t).toISOString().slice(0, 10);
      const l = solarToLunar(iso);
      expect(l, iso).not.toBeNull();
      expect(lunarToSolar(l!), iso).toEqual({ ok: true, iso });
      if (prev) {
        const sameMonth = prev.year === l!.year && prev.month === l!.month && prev.leap === l!.leap;
        if (sameMonth) expect(l!.day, iso).toBe(prev.day + 1);
        else expect(l!.day, iso).toBe(1);
      }
      prev = l;
    }
  }, 60_000);
});

describe('없는 음력 날짜는 이유와 함께 막는다', () => {
  it('그 달이 29일까지인데 30일을 넣으면 마지막 날을 알려 준다', () => {
    expect(lunarToSolar({ year: 2026, month: 12, day: 30, leap: false })).toEqual({ ok: false, error: 'day', maxDay: 29 });
    expect(lunarToSolar({ year: 2023, month: 2, day: 31, leap: false })).toEqual({ ok: false, error: 'day', maxDay: 30 });
    expect(lunarToSolar({ year: 2023, month: 2, day: 0, leap: false })).toMatchObject({ ok: false, error: 'day' });
  });

  it('윤달이 없는 해에 윤달을 고르면 거절하고, 그 해의 윤달(없으면 0)을 알려 준다', () => {
    expect(lunarToSolar({ year: 2024, month: 3, day: 1, leap: true })).toEqual({ ok: false, error: 'noLeap', leapMonth: 0 });
    expect(lunarToSolar({ year: 1995, month: 3, day: 1, leap: true })).toEqual({ ok: false, error: 'noLeap', leapMonth: 8 });
  });

  it('달이 1~12 밖이거나 표 밖의 해는 거절한다', () => {
    expect(lunarToSolar({ year: 2000, month: 13, day: 1, leap: false })).toMatchObject({ ok: false, error: 'month' });
    expect(lunarToSolar({ year: 2000, month: 0, day: 1, leap: false })).toMatchObject({ ok: false, error: 'month' });
    expect(lunarToSolar({ year: LUNAR_YEAR_MIN - 1, month: 1, day: 1, leap: false })).toMatchObject({ ok: false, error: 'year' });
    expect(lunarToSolar({ year: LUNAR_YEAR_MAX + 1, month: 1, day: 1, leap: false })).toMatchObject({ ok: false, error: 'year' });
    expect(solarToLunar('1899-12-31')).toBeNull();
    expect(solarToLunar('nope')).toBeNull();
  });
});

describe('checkBirthDate (입력 칸 검사)', () => {
  it('양력은 예전 검사(checkDate)와 똑같이 판단한다', () => {
    for (const text of ['1998.03.21', '1998.1.23', '1998.02.30', '1800.01.01', '', '98.3.21', '2999.01.01']) {
      const old = checkDate(text);
      const now = checkBirthDate(text, 'solar', false);
      expect(now.ok, text).toBe(old.ok);
      if (old.ok && now.ok) expect(now.iso).toBe(old.iso);
      if (!old.ok && !now.ok) expect(now.error).toBe(old.error);
    }
  });

  it('음력이면 양력으로 바꾼 날짜와 적은 음력을 함께 돌려준다', () => {
    expect(checkBirthDate('1995.02.14', 'lunar', false)).toEqual({
      ok: true,
      iso: '1995-03-14',
      lunar: { year: 1995, month: 2, day: 14, leap: false },
    });
    expect(checkBirthDate('1995.8.1', 'lunar', true)).toMatchObject({ ok: true, iso: '1995-09-25' });
  });

  it('입력이 막히는 경우: 30일 없는 달, 윤달 없는 해, 13월, 모양이 틀린 글자, 빈 칸', () => {
    expect(checkBirthDate('2026.12.30', 'lunar', false)).toMatchObject({ ok: false, error: 'noDay', maxDay: 29 });
    expect(checkBirthDate('2024.03.10', 'lunar', true)).toMatchObject({ ok: false, error: 'noLeap', leapMonth: 0 });
    expect(checkBirthDate('1995.03.10', 'lunar', true)).toMatchObject({ ok: false, error: 'noLeap', leapMonth: 8 });
    expect(checkBirthDate('2000.13.01', 'lunar', false)).toMatchObject({ ok: false, error: 'invalid' });
    expect(checkBirthDate('2000.00.10', 'lunar', false)).toMatchObject({ ok: false, error: 'invalid' });
    expect(checkBirthDate('2000.05.00', 'lunar', false)).toMatchObject({ ok: false, error: 'invalid' });
    expect(checkBirthDate('2000.05', 'lunar', false)).toMatchObject({ ok: false, error: 'invalid' });
    expect(checkBirthDate('', 'lunar', false)).toMatchObject({ ok: false, error: 'empty' });
  });

  it('환산한 양력이 1930년 앞이거나 오늘 뒤면 범위 오류다', () => {

    expect(checkBirthDate('1929.11.01', 'lunar', false)).toMatchObject({ ok: false, error: 'range' });

    expect(checkBirthDate('1929.12.20', 'lunar', false)).toMatchObject({ ok: true, iso: '1930-01-19' });

    const far = new Date().getFullYear() + 2;
    expect(checkBirthDate(`${far}.01.01`, 'lunar', false)).toMatchObject({ ok: false, error: 'range' });
    expect(checkBirthDate('1800.01.01', 'lunar', false)).toMatchObject({ ok: false, error: 'range' });
  });
});

describe('음력으로 넣어도 엔진에는 같은 양력 날짜가 간다', () => {
  it('음력 입력에서 나온 사주 = 그 양력 날짜를 직접 넣은 사주', () => {
    const lunar = checkBirthDate('1995.02.14', 'lunar', false);
    expect(lunar.ok).toBe(true);
    if (!lunar.ok) return;
    const viaLunar = computeChart({ date: lunar.iso, time: '09:30', place: SEOUL, sex: 'female' });
    const viaSolar = computeChart({ date: '1995-03-14', time: '09:30', place: SEOUL, sex: 'female' });
    expect(viaLunar).toEqual(viaSolar);
  });
});

describe('양력↔음력 단추 (저장은 양력 하나, 다시 열어도 같은 날)', () => {
  it('양력 → 음력 → 양력으로 눌러도 같은 글자로 돌아온다 (윤달 포함)', () => {
    for (const solar of ['1995.03.14', '1995.09.25', '2023.03.22', '2023.04.05', '1930.01.19', '2000.02.05', '2025.07.25']) {
      const toLunar = convertDateText(solar, 'solar', 'lunar', false);
      expect(toLunar.text, solar).not.toBe(solar);
      const back = convertDateText(toLunar.text, 'lunar', 'solar', toLunar.leap);
      expect(back, solar).toEqual({ text: solar, leap: false });
    }
    expect(convertDateText('1995.09.25', 'solar', 'lunar', false)).toEqual({ text: '1995.08.01', leap: true });
    expect(convertDateText('2023.03.14', 'solar', 'lunar', false)).toEqual({ text: '2023.02.23', leap: false });
  });

  it('아직 맞지 않는 글자는 그대로 두고, 같은 달력을 다시 눌러도 그대로다', () => {
    expect(convertDateText('1995.0', 'solar', 'lunar', false)).toEqual({ text: '1995.0', leap: false });
    expect(convertDateText('2026.12.30', 'lunar', 'solar', true)).toEqual({ text: '2026.12.30', leap: true });
    expect(convertDateText('1995.03.14', 'solar', 'solar', false)).toEqual({ text: '1995.03.14', leap: false });
  });

  it('음력으로 넣어 저장한 사람은 양력 날짜로 저장되고, 다시 열어 음력으로 바꾸면 처음 적은 음력이 나온다', () => {
    const typed = checkBirthDate('2023.02.15', 'lunar', true);
    expect(typed).toMatchObject({ ok: true, iso: '2023-04-05' });
    if (!typed.ok) return;
    const stored = typed.iso;
    expect(stored).toBe('2023-04-05');
    const reopened = stored.replaceAll('-', '.');
    expect(checkBirthDate(reopened, 'solar', false)).toMatchObject({ ok: true, iso: stored });
    expect(convertDateText(reopened, 'solar', 'lunar', false)).toEqual({ text: '2023.02.15', leap: true });
  });
});

function fakeBirth(over: Partial<BirthDate>): BirthDate {
  const calendar = over.calendar ?? 'lunar';
  const text = over.text ?? '';
  const leap = over.leap ?? false;
  return {
    calendar,
    text,
    leap,
    check: checkBirthDate(text, calendar, leap),
    onText: () => {},
    onLeap: () => {},
    onCalendar: () => {},
    setIso: () => {},
    ...over,
  };
}
const render = (birth: BirthDate, tried = false) =>
  renderToStaticMarkup(createElement(BirthDateField, { id: 'd', label: 'Date', birth, tried }));

describe('세 언어 입력 화면', () => {
  it('양력일 때는 윤달 칸과 환산 줄이 없고, 단추 둘이 있다', () => {
    const html = render(fakeBirth({ calendar: 'solar', text: '1995.03.14' }));
    expect(html).toContain('role="radiogroup"');
    expect(html).not.toContain('type="checkbox"');
    expect(html).not.toMatch(/Calculated with/);
  });

  it.each([
    ['en', 'Solar', 'Lunar', 'Leap month', 'Calculated with the solar date March 14, 1995.'],
    ['ko', '양력', '음력', '윤달', '양력 1995년 3월 14일로 계산해요.'],
    ['ja', '新暦', '旧暦', '閏月', '新暦 1995年3月14日として計算します。'],
  ] as const)('%s: 음력을 고르면 윤달 칸과 양력 환산 한 줄이 나온다', (locale, solar, lunar, leap, converted) => {
    setActiveLocaleForTest(locale);
    const html = render(fakeBirth({ text: '1995.02.14' }));
    expect(html).toContain(`>${solar}<`);
    expect(html).toContain(`>${lunar}<`);
    expect(html).toContain(`>${leap}<`);
    expect(html).toContain(converted);
    expect(html).toContain('aria-live="polite"');
  });

  it.each([
    ['en', 'only has 29 days'],
    ['ko', '29일까지 있어요'],
    ['ja', '29日までです'],
  ] as const)('%s: 29일까지인 달에 30일을 넣으면 오류 문장이 뜬다', (locale, part) => {
    setActiveLocaleForTest(locale);
    const html = render(fakeBirth({ text: '2026.12.30' }));
    expect(html).toContain(part);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('class="rf-error"');
  });

  it.each([
    ['en', 'no leap month. Untick'],
    ['ko', '윤달이 없어요'],
    ['ja', '閏月はありません'],
  ] as const)('%s: 윤달이 없는 해에 윤달을 고르면 오류 문장이 뜬다', (locale, part) => {
    setActiveLocaleForTest(locale);
    expect(render(fakeBirth({ text: '2024.03.10', leap: true }))).toContain(part);
  });
});
