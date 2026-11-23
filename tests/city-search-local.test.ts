import { describe, expect, it } from 'vitest';
import { cityMapping } from 'city-timezones';
import { searchCities } from '@/components/flow/city-search';
import { foldLocal, hasLocalScript, LOCAL_CITIES, searchLocalCities, type CityRecord } from '@/lib/places/local-cities';

const all = cityMapping as unknown as CityRecord[];

describe('한국어·일본어 도시 찾기', () => {
  it('이름표의 도시는 모두 데이터나 직접 적은 좌표로 찾아진다', () => {
    const byKey = new Set(all.map((c) => `${c.city_ascii}|${c.iso2}`));
    const missing = LOCAL_CITIES.filter((e) => !e.at && !byKey.has(`${e.en}|${e.iso2}`)).map((e) => e.en);
    expect(missing).toEqual([]);
  });

  it('직접 적은 좌표는 한국·일본 땅 안이다', () => {
    for (const e of LOCAL_CITIES.filter((x) => x.at)) {
      const { lat, lng } = e.at!;
      if (e.iso2 === 'KR') {
        expect(lat).toBeGreaterThan(33);
        expect(lat).toBeLessThan(38.7);
        expect(lng).toBeGreaterThan(124.5);
        expect(lng).toBeLessThan(130);
      } else {
        expect(lat).toBeGreaterThan(24);
        expect(lat).toBeLessThan(46);
        expect(lng).toBeGreaterThan(122);
        expect(lng).toBeLessThan(146);
      }
    }
  });

  it('한글로 친 서울을 찾고 화면 언어로 이름을 붙인다', () => {
    const [first] = searchCities(all, '서울', 'ko');
    expect(first.record.city_ascii).toBe('Seoul');
    expect(first.record.timezone).toBe('Asia/Seoul');
    expect(first.label).toBe('서울, 대한민국');
  });

  it('덜 친 글자(받침 전)와 끝의 시도 받아 준다', () => {
    expect(searchLocalCities(all, '부', 'ko').map((m) => m.record.city_ascii)).toContain('Busan');
    expect(searchLocalCities(all, '창원시', 'ko')[0].record.city_ascii).toBe('Changwon');
  });

  it('데이터에 없는 한국 도시도 좌표와 시간대로 나온다', () => {
    const [m] = searchLocalCities(all, '천안', 'ko');
    expect(m.record.city_ascii).toBe('Cheonan');
    expect(m.record.timezone).toBe('Asia/Seoul');
  });

  it('일본어 화면은 일본어 이름과 나라 이름', () => {
    const [first] = searchCities(all, '東京', 'ja');
    expect(first.record.city_ascii).toBe('Tokyo');
    expect(first.label).toBe('東京, 日本');
    expect(searchCities(all, '津', 'ja')[0].record.city_ascii).toBe('Tsu');
  });

  it('한국어 화면에서 일본 도시를 한글로, 일본어 화면에서 한국 도시를 일본어로', () => {
    expect(searchCities(all, '오사카', 'ko')[0].label).toBe('오사카, 일본');
    expect(searchCities(all, 'ソウル', 'ja')[0].label).toBe('ソウル, 韓国');
  });

  it('해외 도시도 한글·가나로', () => {
    expect(searchCities(all, '뉴욕', 'ko')[0].record.city_ascii).toBe('New York');
    expect(searchCities(all, 'ロンドン', 'ja')[0].record.iso2).toBe('GB');
  });

  it('영어 검색은 예전 그대로', () => {
    expect(hasLocalScript('Seoul')).toBe(false);
    expect(searchCities(all, 'Seoul', 'ko')[0].label).toBe('Seoul, KR');
    expect(foldLocal(' 광주광역시 ')).toBe(foldLocal('광주'));
  });
});
