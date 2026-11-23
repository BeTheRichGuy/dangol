import type { ChatKey } from '@/lib/chat/characters';
import { REUNION_GUIDE_NAME } from '@/lib/reunion/product';

export const OTHER_KEEPERS_KO = {
  sectionLabel: '다른 캐릭터가 봐주는 사주',
  heading: '다른 캐릭터가 봐주는 사주도 있어!',
  lead: '고민에 따라 만나는 사람이 달라요. 메인 화면에서 마음 가는 방으로 들어가 보세요.',

  keepers: [
    { key: 'mansin', name: '만신', line: '10년 흐름과 2027년' },
    { key: 'yeon', name: '연', line: '연애와 곁에 닿을 인연' },
    { key: 'reunion', name: REUNION_GUIDE_NAME.ko.name, line: '이별 뒤 연락과 재회' },
  ] satisfies ReadonlyArray<{ key: ChatKey | 'reunion'; name: string; line: string }>,
  cta: '메인에서 만나 보기',
} as const;
