import type { TalismanCopy } from '../en/talisman';

export const TALISMAN_KO: TalismanCopy = {
  gift: {

    eyebrow: (keeper) => `${keeper}이 건네는 작은 선물`,
    title: (n) => `부적 ${n}장`,
    lead: '운을 바꿔 주는 주문은 아니에요. 사주를 읽다 보니 비어 보이는 곳이 눈에 띄어서, 곁에 두고 보기 좋은 작은 부적을 골랐어요. 이미지로 저장해서 휴대폰 배경이나 사진첩에 넣어 두세요.',
    reason: {
      missing: '사주에 없는 오행이에요',
      weakest: '가장 적은 오행이에요',
      asked: '물어본 마음에 맞춰 골랐어요',
      gap: '사주에 이 자리가 비어 있어요',
    },
    look: '크게 보기',
    tap: '부적을 누르면 크게 보고 이미지로 저장할 수 있어요.',
  },
  shelf: {
    title: '내 부적',
    lead: '받은 부적이 모여 있어요. 누르면 크게 보고 이미지로 저장할 수 있어요.',
    count: (have, total) => `${have} / ${total}장`,
    empty: '아직 받은 부적이 없어요. 풀이를 한 편 다 읽을 때마다 부적을 한 장씩 건네요.',
    locked: '아직 받지 못했어요',
  },
  sheet: {
    close: '닫기',
    save: '이미지로 저장',
    note: '휴대폰 배경이나 사진첩에 넣어 두고 가끔 꺼내 보세요.',
  },
  items: {
    wood: { name: '나무 부적', line: '새싹처럼 시작하고 천천히 자라나는 마음을 담았어요.' },
    fire: { name: '불 부적', line: '따뜻하게 밝히고 한 걸음 나서는 마음을 담았어요.' },
    earth: { name: '흙 부적', line: '든든하게 버티고 차곡차곡 쌓아 가는 마음을 담았어요.' },
    metal: { name: '쇠 부적', line: '또렷하게 다듬고 깔끔하게 맺는 마음을 담았어요.' },
    water: { name: '물 부적', line: '막힘없이 흐르고 차분히 헤아리는 마음을 담았어요.' },
    love: { name: '연애 부적', line: '마음이 닿는 인연이 포근하게 이어지길 바라며 담았어요.' },
    wealth: { name: '재물 부적', line: '들어온 것을 알뜰히 지키고 천천히 불려 가길 바라며 담았어요.' },
    work: { name: '일 부적', line: '맡은 일이 한 걸음씩 풀리길 바라며 담았어요.' },
    study: { name: '학업 부적', line: '배운 것이 한 장씩 차곡차곡 쌓이길 바라며 담았어요.' },
    bond: { name: '사람 부적', line: '곁의 사람들과 사이가 부드럽게 이어지길 바라며 담았어요.' },
    mind: { name: '마음 부적', line: '어깨 힘을 빼고 마음 편히 쉬어 가길 바라며 담았어요.' },
  },
};
