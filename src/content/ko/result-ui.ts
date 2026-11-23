import type { ChapterWhen, ResultUiCopy } from '../en/result-ui';
import type { DeepPartial } from '../locale';
import type { ChapterInfo } from '@/lib/reading/traits-types';
import { hasBatchim, iya } from './josa';

const ORDINAL = ['', '첫', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];

const COUNT = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
const ordinal = (n: number) => `${ORDINAL[n] ?? n} 번째`;
const counted = (n: number) => `${COUNT[n] ?? n} 개의`;

const rest = (c: ChapterInfo) => Math.max(0, c.total - c.index - 1 - (c.next ? 1 : 0));
const nextTitle = (c: ChapterInfo) => (!c.next ? null : c.next.title === c.title ? `다시 한번 ${c.next.title}` : c.next.title);

const subject = (title: string) => `‘${title}’${hasBatchim(title) ? '이' : '가'}`;

const object = (title: string) => `‘${title}’${hasBatchim(title) ? '을' : '를'}`;

const isIt = (title: string) => `‘${title}’${hasBatchim(title) ? '이야' : '야'}`;

const LOVE_YEARS = '근데 네 사랑이 제일 크게 열리는 해는 따로 있어. 몇 년도인지는 연이 알아.';

export const RESULT_UI_KO: DeepPartial<ResultUiCopy> = {
  whatISee: {
    yourAnswer: '내 대답:',
    progress: (done: number, total: number) => `${total}개 중 ${done}개 답했어요`,
    yulSays: '율:',
    reactions: {
      mostlyNo: [
        '그럴 수 있어. 세 줄로 사람 하나를 다 담을 순 없으니까.',
        '그럼 내가 틀렸네. 맞는 척하는 것보단 틀렸다고 듣는 게 나아.',
        '알았어, 이번엔 빗나갔네. 네가 다르다는데 맞는 척할 순 없지.',
      ],
    },
    timeNote: {
      unknown: '태어난 시간을 몰라서 생년월일로만 읽었어. 시간을 알면 빠진 두 글자도 같이 볼 수 있어.',
      nearMidnight: '자정 무렵에 태어났구나. 몇 분만 달라도 풀이가 바뀔 수 있으니까 시간이 맞는지 한번 봐 줄래?',
      linkUnknown: '태어난 시간 넣기',
      linkCheck: '태어난 시간 확인하기',
    },
    bonusTry: '하나만 더 맞혀 볼게.',
    bonusAfter: { yes: '거봐. 이제 좋은 소식 차례야.', no: '그래, 알았어. 그래도 좋은 소식은 알려 줄게.' },
  },
  chapters: {
    stripLabel: (current: number, total: number) => `인생의 장 ${total}개 가운데, 지금은 ${ordinal(current)} 장이야.`,
    stripLabelBefore: (total: number) => `인생의 장 ${total}개. 첫 번째 장은 아직 열리지 않았어.`,
    stripLabelClosed: '인생 지도는 아직 닫혀 있어요.',
    stripCaption: '한 칸이 10년이야. 숫자는 그 장이 시작되는 나이야.',
    here: '지금 여기',
    failed: '지금은 지도를 펼치지 못했어. 다시 해 볼래?',
    headline: (c: ChapterInfo, when: ChapterWhen | null) =>
      c.beforeStart
        ? { lead: '첫 번째 장은 아직 안 열렸어.', detail: `${c.startAge}살에 ${subject(c.title)} 시작돼.` }
        : {
            lead: `지금 너는 인생의 ${ordinal(c.index + 1)} 장, ${object(c.title)} 지나고 있어.`,
            detail: when
              ? `${when.year}년 ${when.month}, ${c.startAge}살에 시작됐고 10년 동안 이어져.`
              : `${c.startAge}살에 시작됐고 10년 동안 이어져.`,
          },
    next: (c: ChapterInfo, when: ChapterWhen | null) => {
      const title = nextTitle(c);
      if (!title || !c.next) return null;
      return when ? `${when.year + 10}년 ${when.month}부터, ‘${title}’.` : `${c.next.startAge}살부터, ‘${title}’.`;
    },
    restClosed: (c: ChapterInfo) => {
      const n = rest(c);
      if (n === 0) return null;
      return `남은 ${counted(n)} 장은 아직 닫아 뒀어. 문 여는 법은 만신이 쥐고 있거든.`;
    },
  },
  deeper: {
    sectionLabel: '더 깊은 이야기',
    lead: '이 문 너머에 방이 다섯 개 있어. 오늘은 문턱까지만 가 보자.',
    bridge: (c: ChapterInfo, name: string, _when: ChapterWhen | null, nextChapterTitle?: string | null) => {
      const who = name.trim();
      const next = nextChapterTitle === undefined ? (c.next?.title ?? null) : nextChapterTitle;
      const head = who ? `${who}, ` : '';
      return next
        ? `${head}다음 장은 ${isIt(next)}. ${LOVE_YEARS}`
        : `${head}네 지도를 조금 더 앞까지 봤어. ${LOVE_YEARS}`;
    },
    bridgeGeneric: `네 지도를 조금 더 앞까지 봤어. ${LOVE_YEARS}`,
    bridgeNoSex: '네 인생 지도는 아직 닫혀 있어. 위에서 펼치면 지금 네가 있는 장이 보이고, 나머지는 안쪽 방에 있어.',
    want: '더 궁금하면 안쪽 방으로 와. 언제 붙잡고 언제 놓을지는 거기 있어.',
    menuHeading: '신당 안쪽 방에서 읽어 주는 것',
    honest: (price: string) => `방 하나에 ${iya(price)}. 끌리는 방부터 들어와 봐.`,
    cta: '메인 화면으로 가기',
    writing: '율이 쓰는 중',
  },
};
