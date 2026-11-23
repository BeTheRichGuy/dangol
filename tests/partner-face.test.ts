import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PartnerCard } from '../src/components/result/fate-visuals';
import { defaultFace, partnerImage } from '../src/components/result/partner-face';
import { FateCard } from '../src/components/rooms/fate-cards';
import { setActiveLocaleForTest } from '../src/content/locale';
import { fateMapOf } from '../src/lib/reading/fate-map';
import { buildRoomPayload } from '../src/lib/rooms/payload';
import { computeChart, type BirthInput } from '../src/lib/saju';

beforeAll(() => setActiveLocaleForTest('ko'));
afterAll(() => setActiveLocaleForTest('en'));

const SEOUL = { name: 'Seoul', country: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' };
const NOW = '2026-11-02T03:00:00.000Z';
const input = (sex: BirthInput['sex']): BirthInput => ({ date: '1997-09-12', time: '21:40', place: SEOUL, sex });

describe('인연 얼굴 기본 모습', () => {
  it('여성이면 남성(m), 남성이면 여성(f), 모르면 f', () => {
    expect(defaultFace('female')).toBe('m');
    expect(defaultFace('male')).toBe('f');
    expect(defaultFace(null)).toBe('f');
  });

  it('무료 서랍의 카드는 넘겨받은 본인 성별의 반대 얼굴을 그린다(그림 주소로 본다)', () => {
    const chart = computeChart(input('female'));
    const fate = fateMapOf(chart, NOW);
    const html = (sex: 'female' | 'male' | null) => decodeURIComponent(renderToStaticMarkup(createElement(PartnerCard, { partner: fate.partner, kind: fate.partnerKind, locked: false, visible: 3, sex })));
    expect(html('female')).toContain(partnerImage(fate.partnerKind, 'm', false));
    expect(html('male')).toContain(partnerImage(fate.partnerKind, 'f', false));
    expect(html('female')).not.toContain(partnerImage(fate.partnerKind, 'f', false));
  });

  it('결제 뒤·보관함 카드도 같다(FateCard 의 sex)', () => {
    const chart = computeChart(input('male'));
    const payload = buildRoomPayload({ room: 'love', locale: 'ko', chart, nowIso: NOW, question: '' });
    const html = (sex: 'female' | 'male') => decodeURIComponent(renderToStaticMarkup(createElement(FateCard, { payload, room: 'love', part: 'partner', sex })));
    const kind = fateMapOf(chart, NOW).partnerKind;
    expect(html('female')).toContain(partnerImage(kind, 'm', false));
    expect(html('male')).toContain(partnerImage(kind, 'f', false));
  });
});
