export interface CityRecord {
  city: string;
  city_ascii: string;
  lat: number;
  lng: number;
  pop: number;
  country: string;
  iso2: string;
  province: string;
  timezone: string;
}

export type NameLocale = 'ko' | 'ja';

interface LocalCity {
  en: string;
  iso2: string;
  ko?: readonly string[];
  ja?: readonly string[];

  at?: { lat: number; lng: number; tz: string; pop: number };
}

const SEOUL = 'Asia/Seoul';
const TOKYO = 'Asia/Tokyo';
const kr = (en: string, ko: string, lat: number, lng: number, pop: number, ja?: string): LocalCity => ({
  en,
  iso2: 'KR',
  ko: [ko],
  ...(ja ? { ja: [ja] } : {}),
  at: { lat, lng, tz: SEOUL, pop },
});
const jp = (en: string, ja: string, lat: number, lng: number, pop: number): LocalCity => ({ en, iso2: 'JP', ja: [ja], at: { lat, lng, tz: TOKYO, pop } });

export const LOCAL_CITIES: readonly LocalCity[] = [

  { en: 'Seoul', iso2: 'KR', ko: ['서울'], ja: ['ソウル'] },
  { en: 'Busan', iso2: 'KR', ko: ['부산'], ja: ['釜山', 'プサン'] },
  { en: 'Incheon', iso2: 'KR', ko: ['인천'], ja: ['仁川', 'インチョン'] },
  { en: 'Daegu', iso2: 'KR', ko: ['대구'], ja: ['大邱', 'テグ'] },
  { en: 'Daejeon', iso2: 'KR', ko: ['대전'], ja: ['大田', 'テジョン'] },
  { en: 'Gwangju', iso2: 'KR', ko: ['광주'], ja: ['光州', 'クァンジュ'] },
  { en: 'Masan', iso2: 'KR', ko: ['마산'] },
  { en: 'Suwon', iso2: 'KR', ko: ['수원'], ja: ['水原', 'スウォン'] },
  { en: 'Ulsan', iso2: 'KR', ko: ['울산'], ja: ['蔚山', 'ウルサン'] },
  { en: 'Songnam', iso2: 'KR', ko: ['성남'] },
  { en: 'Goyang', iso2: 'KR', ko: ['고양', '일산'] },
  { en: "Puch'on", iso2: 'KR', ko: ['부천'] },
  { en: 'Cheongju', iso2: 'KR', ko: ['청주'] },
  { en: 'Ansan', iso2: 'KR', ko: ['안산'] },
  { en: 'Jeonju', iso2: 'KR', ko: ['전주'], ja: ['全州', 'チョンジュ'] },
  { en: 'Pohang', iso2: 'KR', ko: ['포항'] },
  { en: 'Jeju', iso2: 'KR', ko: ['제주'], ja: ['済州', 'チェジュ'] },
  { en: 'Yeosu', iso2: 'KR', ko: ['여수'] },
  { en: 'Mokpo', iso2: 'KR', ko: ['목포'] },
  { en: 'Iksan', iso2: 'KR', ko: ['익산'] },
  { en: 'Gunsan', iso2: 'KR', ko: ['군산'] },
  { en: 'Wonju', iso2: 'KR', ko: ['원주'] },
  { en: 'Chuncheon', iso2: 'KR', ko: ['춘천'] },
  { en: 'Gangneung', iso2: 'KR', ko: ['강릉'] },
  { en: 'Gyeongju', iso2: 'KR', ko: ['경주'], ja: ['慶州', 'キョンジュ'] },
  { en: 'Andong', iso2: 'KR', ko: ['안동'] },
  { en: 'Sokcho', iso2: 'KR', ko: ['속초'] },
  { en: 'Eumseong', iso2: 'KR', ko: ['음성'] },

  kr('Changwon', '창원', 35.23, 128.68, 1030000),
  kr('Gimhae', '김해', 35.23, 128.89, 530000),
  kr('Jinju', '진주', 35.18, 128.11, 340000),
  kr('Geoje', '거제', 34.88, 128.62, 240000),
  kr('Yangsan', '양산', 35.34, 129.04, 350000),
  kr('Tongyeong', '통영', 34.85, 128.43, 120000),
  kr('Sacheon', '사천', 35.0, 128.06, 110000),
  kr('Miryang', '밀양', 35.5, 128.75, 100000),
  kr('Cheonan', '천안', 36.81, 127.11, 650000),
  kr('Asan', '아산', 36.79, 127.0, 330000),
  kr('Seosan', '서산', 36.78, 126.45, 170000),
  kr('Dangjin', '당진', 36.89, 126.63, 160000),
  kr('Gongju', '공주', 36.45, 127.12, 100000),
  kr('Nonsan', '논산', 36.19, 127.1, 110000),
  kr('Boryeong', '보령', 36.33, 126.61, 95000),
  kr('Chungju', '충주', 36.99, 127.93, 210000),
  kr('Jecheon', '제천', 37.13, 128.19, 130000),
  kr('Sejong', '세종', 36.48, 127.29, 380000),
  kr('Gumi', '구미', 36.12, 128.34, 410000),
  kr('Gyeongsan', '경산', 35.83, 128.74, 270000),
  kr('Gimcheon', '김천', 36.14, 128.11, 140000),
  kr('Yeongju', '영주', 36.81, 128.62, 100000),
  kr('Sangju', '상주', 36.41, 128.16, 95000),
  kr('Yeongcheon', '영천', 35.97, 128.94, 100000),
  kr('Mungyeong', '문경', 36.59, 128.19, 70000),
  kr('Suncheon', '순천', 34.95, 127.49, 280000),
  kr('Gwangyang', '광양', 34.94, 127.7, 150000),
  kr('Naju', '나주', 35.02, 126.71, 115000),
  kr('Jeongeup', '정읍', 35.57, 126.86, 105000),
  kr('Namwon', '남원', 35.42, 127.39, 80000),
  kr('Gimje', '김제', 35.8, 126.88, 80000),
  kr('Yongin', '용인', 37.24, 127.18, 1070000),
  kr('Hwaseong', '화성', 37.2, 126.83, 900000),
  kr('Pyeongtaek', '평택', 36.99, 127.11, 580000),
  kr('Anyang', '안양', 37.39, 126.92, 550000),
  kr('Uijeongbu', '의정부', 37.74, 127.03, 460000),
  kr('Namyangju', '남양주', 37.64, 127.22, 730000),
  kr('Paju', '파주', 37.76, 126.78, 490000),
  kr('Gimpo', '김포', 37.62, 126.72, 480000),
  kr('Gwangmyeong', '광명', 37.48, 126.86, 290000),
  kr('Siheung', '시흥', 37.38, 126.8, 510000),
  kr('Gunpo', '군포', 37.36, 126.94, 260000),
  kr('Hanam', '하남', 37.54, 127.21, 330000),
  kr('Icheon', '이천', 37.27, 127.44, 220000),
  kr('Anseong', '안성', 37.01, 127.28, 190000),
  kr('Osan', '오산', 37.15, 127.07, 230000),
  kr('Guri', '구리', 37.59, 127.13, 190000),
  kr('Yangju', '양주', 37.79, 127.05, 240000),
  kr('Pocheon', '포천', 37.89, 127.2, 150000),
  kr('Dongducheon', '동두천', 37.9, 127.06, 90000),
  kr('Gwacheon', '과천', 37.43, 126.99, 80000),
  kr('Yeoju', '여주', 37.3, 127.64, 110000),

  { ...kr('Gwangju-si', '경기 광주', 37.43, 127.26, 390000), ko: ['경기 광주', '광주(경기)'] },
  kr('Donghae', '동해', 37.52, 129.11, 90000),
  kr('Samcheok', '삼척', 37.45, 129.17, 65000),
  kr('Taebaek', '태백', 37.16, 128.99, 40000),
  kr('Seogwipo', '서귀포', 33.25, 126.56, 180000),

  ...(
    [
      ['Tokyo', '東京', '도쿄'], ['Osaka', '大阪', '오사카'], ['Yokohama', '横浜', '요코하마'], ['Nagoya', '名古屋', '나고야'], ['Sapporo', '札幌', '삿포로'],
      ['Fukuoka', '福岡', '후쿠오카'], ['Sendai', '仙台', '센다이'], ['Kyoto', '京都', '교토'], ['Hiroshima', '広島', '히로시마'], ['Kobe', '神戸', '고베'],
      ['Kawasaki', '川崎', '가와사키'], ['Kitakyushu', '北九州', '기타큐슈'], ['Hamamatsu', '浜松'], ['Okayama', '岡山', '오카야마'], ['Kumamoto', '熊本', '구마모토'],
      ['Shizuoka', '静岡', '시즈오카'], ['Naha', '那覇', '나하'], ['Hachioji', '八王子'], ['Utsunomiya', '宇都宮'], ['Niigata', '新潟', '니가타'],
      ['Kagoshima', '鹿児島', '가고시마'], ['Matsuyama', '松山', '마쓰야마'], ['Kanazawa', '金沢', '가나자와'], ['Nagano', '長野', '나가노'], ['Otsu', '大津'],
      ['Nagasaki', '長崎', '나가사키'], ['Oita', '大分', '오이타'], ['Gifu', '岐阜'], ['Wakayama', '和歌山'], ['Tsu', '津'],
      ['Tokushima', '徳島'], ['Asahikawa', '旭川'], ['Kawagoe', '川越'], ['Takamatsu', '高松'], ['Toyama', '富山'],
      ['Iwaki', 'いわき'], ['Kochi', '高知'], ['Miyazaki', '宮崎'], ['Maebashi', '前橋'], ['Koriyama', '郡山'],
      ['Akita', '秋田'], ['Mito', '水戸'], ['Morioka', '盛岡'], ['Hakodate', '函館', '하코다테'], ['Aomori', '青森', '아오모리'],
      ['Fukushima', '福島', '후쿠시마'], ['Yamagata', '山形'], ['Fukui', '福井'], ['Shimonoseki', '下関'], ['Hachinohe', '八戸'],
      ['Sasebo', '佐世保'], ['Matsumoto', '松本'], ['Kure', '呉'], ['Kofu', '甲府'], ['Kushiro', '釧路'],
      ['Nagaoka', '長岡'], ['Hirosaki', '弘前'], ['Obihiro', '帯広'], ['Tomakomai', '苫小牧'], ['Matsue', '松江'],
      ['Tottori', '鳥取'], ['Otaru', '小樽'], ['Muroran', '室蘭'], ['Takaoka', '高岡'], ['Kitami', '北見'],
      ['Tsuruoka', '鶴岡'], ['Sakata', '酒田'], ['Kanoya', '鹿屋'], ['Maizuru', '舞鶴'],
    ] as const
  ).map(([en, ja, ko]: readonly string[]): LocalCity => ({ en, iso2: 'JP', ja: [ja], ...(ko ? { ko: [ko] } : {}) })),

  jp('Saitama', 'さいたま', 35.86, 139.65, 1340000),
  jp('Chiba', '千葉', 35.61, 140.12, 980000),
  jp('Sakai', '堺', 34.57, 135.48, 820000),
  jp('Sagamihara', '相模原', 35.57, 139.37, 720000),
  jp('Funabashi', '船橋', 35.69, 139.98, 640000),
  jp('Kawaguchi', '川口', 35.81, 139.72, 600000),
  jp('Himeji', '姫路', 34.82, 134.69, 530000),
  jp('Higashiosaka', '東大阪', 34.68, 135.6, 480000),
  jp('Nara', '奈良', 34.69, 135.8, 350000),
  jp('Saga', '佐賀', 33.26, 130.3, 230000),
  jp('Yamaguchi', '山口', 34.18, 131.47, 190000),
  jp('Tsukuba', 'つくば', 36.08, 140.11, 250000),
  jp('Kurashiki', '倉敷', 34.59, 133.77, 470000),
  jp('Fukuyama', '福山', 34.49, 133.36, 460000),
  jp('Toyota', '豊田', 35.08, 137.16, 420000),
  jp('Okazaki', '岡崎', 34.95, 137.17, 380000),
  jp('Machida', '町田', 35.55, 139.45, 430000),
  jp('Fujisawa', '藤沢', 35.34, 139.49, 440000),
  jp('Yokosuka', '横須賀', 35.28, 139.67, 390000),
  jp('Kashiwa', '柏', 35.87, 139.98, 430000),
  jp('Matsudo', '松戸', 35.79, 139.9, 500000),
  jp('Nishinomiya', '西宮', 34.74, 135.34, 480000),
  jp('Amagasaki', '尼崎', 34.73, 135.41, 460000),
  jp('Takatsuki', '高槻', 34.85, 135.62, 350000),
  jp('Toyonaka', '豊中', 34.78, 135.47, 400000),
  jp('Suita', '吹田', 34.76, 135.52, 380000),
  jp('Hirakata', '枚方', 34.81, 135.65, 400000),
  jp('Okinawa', '沖縄', 26.33, 127.8, 140000),

  { en: 'New York', iso2: 'US', ko: ['뉴욕'], ja: ['ニューヨーク'] },
  { en: 'Los Angeles', iso2: 'US', ko: ['로스앤젤레스', '엘에이'], ja: ['ロサンゼルス'] },
  { en: 'San Francisco', iso2: 'US', ko: ['샌프란시스코'], ja: ['サンフランシスコ'] },
  { en: 'Chicago', iso2: 'US', ko: ['시카고'], ja: ['シカゴ'] },
  { en: 'Seattle', iso2: 'US', ko: ['시애틀'], ja: ['シアトル'] },
  { en: 'Honolulu', iso2: 'US', ko: ['호놀룰루', '하와이'], ja: ['ホノルル', 'ハワイ'] },
  { en: 'Boston', iso2: 'US', ko: ['보스턴'], ja: ['ボストン'] },
  { en: 'Washington, D.C.', iso2: 'US', ko: ['워싱턴'], ja: ['ワシントン'] },
  { en: 'Toronto', iso2: 'CA', ko: ['토론토'], ja: ['トロント'] },
  { en: 'Vancouver', iso2: 'CA', ko: ['밴쿠버'], ja: ['バンクーバー'] },
  { en: 'London', iso2: 'GB', ko: ['런던'], ja: ['ロンドン'] },
  { en: 'Paris', iso2: 'FR', ko: ['파리'], ja: ['パリ'] },
  { en: 'Berlin', iso2: 'DE', ko: ['베를린'], ja: ['ベルリン'] },
  { en: 'Sydney', iso2: 'AU', ko: ['시드니'], ja: ['シドニー'] },
  { en: 'Melbourne', iso2: 'AU', ko: ['멜버른'], ja: ['メルボルン'] },
  { en: 'Auckland', iso2: 'NZ', ko: ['오클랜드'], ja: ['オークランド'] },
  { en: 'Beijing', iso2: 'CN', ko: ['베이징', '북경'], ja: ['北京', 'ペキン'] },
  { en: 'Shanghai', iso2: 'CN', ko: ['상하이', '상해'], ja: ['上海', 'シャンハイ'] },
  { en: 'Hong Kong', iso2: 'HK', ko: ['홍콩'], ja: ['香港'] },
  { en: 'Taipei', iso2: 'TW', ko: ['타이베이'], ja: ['台北'] },
  { en: 'Singapore', iso2: 'SG', ko: ['싱가포르'], ja: ['シンガポール'] },
  { en: 'Bangkok', iso2: 'TH', ko: ['방콕'], ja: ['バンコク'] },
  { en: 'Hanoi', iso2: 'VN', ko: ['하노이'], ja: ['ハノイ'] },
  { en: 'Ho Chi Minh City', iso2: 'VN', ko: ['호찌민', '호치민'], ja: ['ホーチミン'] },
  { en: 'Manila', iso2: 'PH', ko: ['마닐라'], ja: ['マニラ'] },
  { en: 'Jakarta', iso2: 'ID', ko: ['자카르타'], ja: ['ジャカルタ'] },
  { en: 'Pyongyang', iso2: 'KP', ko: ['평양'], ja: ['平壌', 'ピョンヤン'] },
];

export function hasLocalScript(s: string): boolean {
  return /[\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(s);
}

export function foldLocal(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, '')
    .replace(/(특별시|광역시|특별자치시|시|군|市|区)$/u, '')
    .normalize('NFD')
    .toLowerCase();
}

export interface LocalMatch {
  record: CityRecord;

  name: string;
}

const indexCache = new WeakMap<readonly CityRecord[], Map<string, CityRecord>>();
function indexOf(all: readonly CityRecord[]): Map<string, CityRecord> {
  let map = indexCache.get(all);
  if (!map) {
    map = new Map();
    for (const c of all) {
      const key = `${c.city_ascii}|${c.iso2}`;
      const prev = map.get(key);
      if (!prev || c.pop > prev.pop) map.set(key, c);
    }
    indexCache.set(all, map);
  }
  return map;
}

function recordFor(entry: LocalCity, index: Map<string, CityRecord>): CityRecord | null {
  if (entry.at) {
    return { city: entry.en, city_ascii: entry.en, lat: entry.at.lat, lng: entry.at.lng, pop: entry.at.pop, country: '', iso2: entry.iso2, province: '', timezone: entry.at.tz };
  }
  return index.get(`${entry.en}|${entry.iso2}`) ?? null;
}

export function searchLocalCities(all: readonly CityRecord[], query: string, locale: string, max = 8): LocalMatch[] {
  const needle = foldLocal(query);
  if (!needle) return [];
  const index = indexOf(all);
  const prefer: NameLocale = locale === 'ja' ? 'ja' : 'ko';
  const other: NameLocale = prefer === 'ja' ? 'ko' : 'ja';
  const hits: { m: LocalMatch; exact: boolean }[] = [];
  for (const entry of LOCAL_CITIES) {
    const names = [...(entry.ko ?? []), ...(entry.ja ?? [])];
    const matched = names.find((n) => foldLocal(n).startsWith(needle));
    if (!matched) continue;
    const record = recordFor(entry, index);
    if (!record) continue;
    const shown = entry[prefer]?.[0] ?? entry[other]?.[0] ?? matched;
    hits.push({ m: { record, name: shown }, exact: names.some((n) => foldLocal(n) === needle) });
  }
  hits.sort((x, y) => (x.exact !== y.exact ? (x.exact ? -1 : 1) : y.m.record.pop - x.m.record.pop));
  return hits.slice(0, max).map((h) => h.m);
}
