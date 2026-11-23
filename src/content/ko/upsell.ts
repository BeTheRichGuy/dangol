import type { UpsellCopy } from '../en/upsell';
import type { DeepPartial } from '../locale';
import type { ChapterInfo } from '@/lib/reading/traits-types';

export const UPSELL_KO: DeepPartial<UpsellCopy> = {
  whatISee: {
    heading: '내 눈에 보이는 것',
    intro: '네 사주 보면서 제일 먼저 보인 세 가지야.',
    labels: {
      core: '너의 본모습',
      pattern: '너도 모르게 되풀이하는 것',
      love: '사랑할 때',
      tension: '사랑할 때',
      missing: '네가 끌리는 사람',
    },
    thatsMe: '맞아, 나야',
    notQuite: '음, 좀 달라',
    bonusHeading: '네가 끌리는 사람',
    bonusIntro: '딱 하나만 더. 이것까지 맞혀도 뻔뻔하다고 나무라진 마.',
    reactions: {
      mostlyYes: [
        '거봐, 내 눈은 못 속인다니까. 자, 이제 좋은 소식 풀어볼까?',
        '그렇게 토끼 눈 할 것 없어. 난 그냥 네 하늘에 적힌 대로 읽었을 뿐인걸.',
        '오호, 역시 맞았네. 그럼 이제 달콤한 소식 차례야.',
        '소금은 자느라 못 들었는데, 넌 다 들었지?',
      ],
      mostlyNo: [
        '아직 내가 미처 못 본 모습이 숨어 있나 보네. 그게 뭔지 더 궁금해지는데.',
        '오늘은 내가 살짝 빗겨 짚었나 봐. 솔직하게 말해 줘서 고마워.',
        '고작 석 줄로 사람 속을 다 꿰뚫어 볼 순 없지. 네 이야기를 더 들어보고 싶네.',
      ],
    },
  },
  chapters: {
    eyebrow: '네 인생 지도',
    intro: '사주에선 10년마다 크게 바뀌는 흐름을 대운이라고 불러. 지금 네가 걷고 있는 곳은 바로 여기야.',
    headline: (c: ChapterInfo) =>
      c.beforeStart
        ? `첫 번째 장은 아직 안 열렸어. ${c.startAge}살에 ‘${c.title}’이 시작돼.`
        : `지금은 ${c.index + 1}번째 장, ‘${c.title}’(${c.startAge}~${c.endAge}살, ${c.startYear}~${c.endYear}년)`,
    nextLabel: '다음 장',
    next: (c: ChapterInfo) =>
      c.next
        ? c.next.title === c.title
          ? `${c.next.startAge}살부터, 다시 한번 ‘${c.next.title}’.`
          : `${c.next.startAge}살부터, ‘${c.next.title}’.`
        : null,
    lastChapter: '이 흐름의 마지막 장이야. 조급해하지 말고 편안하게 누려 봐.',
    restClosed: (c: ChapterInfo) => {
      const n = Math.max(0, c.total - c.index - 1 - (c.next ? 1 : 0));
      return n === 0 ? null : `남은 ${n}개 장은 아직 닫아 뒀어. 문 여는 법은 만신이 쥐고 있거든.`;
    },
    needSex: {
      line: '인생 지도를 펼치려면 하나만 더 알려 줘.',
      why: '사주에서는 오래된 규칙에 따라 운이 흐르는 방향을 정해. 그 규칙은 답이 둘뿐이라서, 이것만 따로 물어볼게.',
      group: '운의 흐름 방향',
      woman: '여성',
      man: '남성',
      nonbinary: '논바이너리',
    },
  },
  deeper: {
    yul: [
      '오늘 보여준 건 겉표지 한 장일 뿐이야. 난 이미 네 뒤 이야기까지 다 읽어 뒀지만, 한꺼번에 쏟아내면 재미없잖아.',
      '그 뒷이야기도 궁금해? 네 인생의 굽이마다 언제 큰 기회가 오는지, 사랑이든 일이든 뛰어들어도 좋을 달이 언제인지 다 적혀 있거든.',
      '달콤한 말도, 뼈 때리는 조언도 하나도 빼놓지 않고 다 들려줄게.',
      '근데 솔직히 말하면 안쪽 방 문은 아직 살짝 걸어 잠가 뒀어. 문 열리는 날 제일 먼저 부를 테니까, 연락처 하나 남겨 둘래?',
    ],
    notOpen: '아직 열지 않았어요. 이메일을 남기면 가장 먼저 알려 드리고, 출시 가격으로 이용하실 수 있어요.',
    noCountdown: '타이머도 카운트다운도 없어. 방이 아직 안 열렸을 뿐이야.',
  },
};
