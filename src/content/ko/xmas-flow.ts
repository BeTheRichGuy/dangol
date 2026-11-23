import type { Beat } from '@/components/story/types';
import type { XmasContact, XmasGoal, XmasStage } from '@/lib/xmas/relation';

const A = '/media/xmas';

export const XMAS_FLOW = {
  start: {

    steps: {
      hello: {
        image: `${A}/08-yeon-thread-b.jpg`,

        video: `${A}/motion/greet.mp4`,
        say: '왔네.\n눈 오는 날엔 꼭 누가 올라오더라.',
        go: '네, 왔어요',
      },
      name: { image: `${A}/12-yeon-cu.jpg`, say: '일단 이름부터.\n뭐라고 부르면 돼?', label: '이름', placeholder: '불리고 싶은 이름' },
      date: {
        image: `${A}/10-slack-b.jpg`,
        say: '{name}, 생일은 언제야?\n여기서 실 세 가닥이 풀려 나오거든.',
        label: '생일 (양력)',
        placeholder: '1997.09.12',
        hint: '음력 생일은 양력으로 바꿔서 적어 줘.',
      },
      time: {
        image: `${A}/13-window.jpg`,
        say: '몇 시에 태어났는지도 알아?\n모르면 모른다고 해.',
        label: '태어난 시간',
        placeholder: '14:30',
        unknown: '시간은 몰라요',
        hint: '몰라도 돼. 세 가닥으로도 볼 수 있어.',
      },
      sex: {
        image: `${A}/11-yeon-glance.jpg`,
        say: '하나만 더 물어볼게.\n태어난 성별에 따라 운이 흐르는 방향이 달라.',
        female: '여성',
        male: '남성',
        hint: '10년마다 바뀌는 운의 방향을 계산할 때만 써요.',
      },

      stage: {
        image: `${A}/18-yeon-soft.jpg`,
        video: `${A}/motion/ask.mp4`,
        say: '그 사람이랑은\n지금 어떤 사이야?',
        options: [
          { id: 'far', label: '멀리서만 보는 사람이에요' },
          { id: 'friend', label: '친구예요, 아는 사이' },
          { id: 'daily', label: '일터나 학교에서 매일 봐요' },
          { id: 'talking', label: '연락하면서 알아가는 중이에요' },
          { id: 'past', label: '예전엔 가까웠는데 멀어졌어요' },
        ] satisfies { id: XmasStage; label: string }[],
      },
      goal: {
        image: `${A}/07-yeon-turn.jpg`,
        say: '크리스마스까지\n제일 바라는 건 뭐야?',
        options: [
          { id: 'meet', label: '둘이 만나고 싶어요' },
          { id: 'closer', label: '지금보다 가까워지고 싶어요' },
          { id: 'confess', label: '제 마음을 전하고 싶어요' },
          { id: 'decide', label: '이 관계를 어떻게 할지 정하고 싶어요' },
        ] satisfies { id: XmasGoal; label: string }[],
      },
      contact: {
        image: `${A}/24-yeon-trace.jpg`,
        say: '요즘 그 사람이랑\n연락은 해?',
        options: [
          { id: 'often', label: '자주 해요' },
          { id: 'sometimes', label: '가끔 해요' },
          { id: 'rarely', label: '거의 안 해요' },
        ] satisfies { id: XmasContact; label: string }[],
        skip: '잘 모르겠어요',
      },
      partner: {
        image: `${A}/14-yeon-hand.jpg`,
        say: '그 사람 생일 알아?\n몰라도 괜찮아.',
        label: '그 사람 생일 (양력)',
        placeholder: '1996.03.21',
        hint: '알면 두 사람이 맞는 데까지 볼게. 이름이나 연락처는 묻지 않아요.',
        timeLabel: '그 사람 태어난 시간 (몰라도 돼요)',
        timePlaceholder: '09:30',
        timeUnknown: '시간은 몰라요',
        skip: '생일은 몰라요',
      },
    },
    next: '다음',
    back: '이전',
    done: '제 실 읽어 주세요',
    progress: '{n} / {total}',
    errors: {
      name: '이름을 적어 줘.',
      date: '날짜를 다시 확인해 줘. 예: 1997.09.12',
      time: '시간을 다시 확인해 줘. 예: 14:30',
      partnerDate: '그 사람 생일을 다시 확인해 줘. 모르면 "생일은 몰라요"를 눌러.',
      partnerTime: '시간을 다시 확인해 줘. 모르면 "시간은 몰라요"를 눌러.',
    },
    privacy: '내 이름과 생일, 그 사람 생일은 이 기기 안에서만 계산해요.',
  },

  result: {

    intro: [
      {
        kind: 'art',
        src: `${A}/21-ritual.jpg`,
        ratio: 2 / 3,
        fade: 'both',
        gap: 20,
        notes: [{ text: '연이 내 실을 물레에 걸었다.', x: 50, y: 86 }],
        says: [{ text: '{name}, 당긴다.\n꽉 잡아.', x: 30, y: 12, tail: 'dr', big: true }],
      },
      {
        kind: 'art',
        src: `${A}/22-strands.jpg`,
        ratio: 3 / 2,
        gap: 24,
        notes: [{ text: '꼬인 게 풀리니까 네 가닥이었다.', x: 50, y: 0 }],
      },
    ] satisfies Beat[] as Beat[],

    play: {
      pull: { label: '실 잡기', hint: '놓지 말고 꾹 누르고 있어요', skip: '건너뛰기' },
      frost: { hint: '창에 낀 서리를 닦아 보세요', skip: '바로 보기' },
    },
    pillars: { title: '{name}의 실, 네 가닥', labels: ['해', '달', '날', '시'], unknown: '모름' },

    insight: {
      over: '네가 말해 준 것',
      now: '지금',
      want: '바라는 것',
      say: '연의 한마디',
      stage: {
        far: '멀리서 보는 사이',
        friend: '친구, 아는 사이',
        daily: '일터나 학교에서 매일 보는 사이',
        talking: '연락하며 알아가는 사이',
        past: '예전엔 가까웠던 사이',
      } satisfies Record<XmasStage, string>,
      goal: {
        meet: '크리스마스에 둘이 만나기',
        closer: '지금보다 가까워지기',
        confess: '마음 전하기',
        decide: '이 관계를 어떻게 할지 정하기',
      } satisfies Record<XmasGoal, string>,
      line: {
        far: '처음부터 큰 고백은 준비하지 마.\n말을 붙일 작은 계기부터 찾자.',
        friend: '친구로 지낸 시간이 네 무기야.\n평소 말투에 둘만의 약속 하나만 얹어 보자.',
        daily: '매일 보는 데서 서두르지 마.\n그곳 밖에서 잠깐 보는 것부터야.',
        talking: '연락은 이미 하고 있잖아.\n이제 대화를 약속으로 바꿀 차례야.',
        past: '예전 얘기부터 꺼내진 마.\n가벼운 안부 한 줄이면 충분해.',
      } satisfies Record<XmasStage, string>,
    },

    pair: {
      title: '{name}의 실과 그 사람의 실',
      me: '나',
      other: '그 사람',
      unknown: '모름',
      note: '두 사람이 태어난 날에서 실이 이어져 있어.\n어디서 맞고 어디서 걸리는지는 결제하면 열려요.',
      noTime: '그 사람 시간은 몰라서 한 가닥은 비워 뒀어.',
      none: '그 사람 생일을 몰라도 괜찮아.\n그 사람 앞에서 네 실이 어떻게 구는지는 다 보여.',
    },
    aha: {
      kind: 'art',
      src: `${A}/23-yeon-aha.jpg`,
      ratio: 1,
      gap: 30,
      says: [{ text: '아… 이래서 그랬구나.', x: 28, y: 4, tail: 'dr', big: true }],
    } satisfies Beat as Beat,

    read: {
      beforeWhy: [{ kind: 'say', text: '근데 네가 진짜 궁금한 건\n이거잖아.', gap: 20 }] satisfies Beat[] as Beat[],
    },

    why: {
      lead: {
        far: '멀리서 혼자 좋아하고 있다고 했지?\n왜 한 발이 안 나가는지, 네 실에 답이 있어.',
        friend: '친구 사이라고 했지?\n왜 거기서 선을 못 넘는지, 네 실에 다 보여.',
        daily: '매일 보는 사이라고 했지?\n그런데도 제자리인 이유, 네 실에 있어.',
        talking: '연락은 하고 있다고 했지?\n근데 왜 진전이 없는지, 네 실에 답이 있어.',
        past: '예전엔 가까웠다고 했지?\n왜 멀어졌는지도 네 실에 보여.',
      } satisfies Record<XmasStage, string>,
      hidden: '네 실에서 읽은 이유는 결제하면 열려요',
    },

    when: {
      none: '크리스마스 전까지는\n튀는 날 없이 *평소대로* 가는 때야.',
      trace: {
        kind: 'art',
        src: `${A}/24-yeon-trace.jpg`,
        ratio: 2 / 3,
        fade: 'top',
        gap: 26,
        says: [{ text: '첫 번째가\n여기야.', x: 68, y: 16, tail: 'dl', big: true }],
      } satisfies Beat as Beat,
      ask: '며칠인데요?',
      hide: {
        kind: 'art',
        src: `${A}/25-yeon-hide.jpg`,
        ratio: 2 / 3,
        fade: 'bottom',
        gap: 16,
        says: [{ text: '여기부터는\n복채 받아야 돼.', x: 50, y: 9, tail: 'dl', big: true }],
      } satisfies Beat as Beat,
    },

    peek: {
      over: '이미 다 나왔어',
      title: '네 실에서 먼저 읽히는 건 여기까지야',
      ask: { label: '크리스마스 약속 잡기 좋은 날', hidden: '12월 ○○일' },
      first: { label: '그 사람한테 보낼 첫 문장', hidden: '"……"' },

      pair: { label: '두 사람 궁합 점수', hidden: '??' },
      self: { label: '그 사람 앞의 나', hidden: '???' },
      avoid: { label: '이번에 하면 안 되는 것', hidden: '세 가지' },
      eve: { label: '크리스마스 이브는', hidden: '좋은 날? 평범한 날?' },
      lock: '결제하면 바로 열려요',
    },

    stack: {
      title: '결제하면 받는 것',
      items: [
        '웹툰 열한 편과 1만 자가 넘는 풀이',
        '그 사람에게 끌리는 이유와 지금 둘 사이의 거리',
        '사주로 읽은 그 사람 마음, 잘 맞는 지점과 걸리는 지점',
        '크리스마스까지 날짜 달력과 약속 잡기 좋은 날, 연적이 끼어드는 날',
        '먼저 보낼 첫 문장 고르기',
        '하지 말 것 셋',
        '연의 편지와 저장용 카드',
      ],
    },

    third: {
      say: '특별히 너한테만\n해주는 거야.',
      title: '다른 웹툰 연애 사주의\n{n}분의 1 가격',
      other: '다른 웹툰 연애 사주',
      ours: '연의 크리스마스 연애 사주',
      note: '다른 곳 가격은 2026년 11월 기준으로 확인했어요.',
      line: '다른 웹툰 연애 사주의 {n}분의 1 가격이에요.',
    },

    preview: {
      title: '결제하면 이어지는 이야기',

      art: [
        { src: '/media/xmas/paid2/02c-bridge.jpg', ch: 3, line: '눈 덮인 돌다리를 건넜다.', kind: 'note' },
        { src: '/media/xmas/paid2/06b-window-wipe.jpg', ch: 5, line: '이 창에 낀 성에\n좀 닦아 볼래?', kind: 'say' },
        { src: '/media/xmas/paid2/07a-bracelet{me}.jpg', ch: 10, line: '연이 내 손목에 실을 감았다.', kind: 'note' },
      ],
    },
    locked: {
      over: '결제하면 열리는 것',
      title: '그 사람한테 어떻게 다가갈지,\n결제하면 다 정리해 줄게.',
      items: [
        { term: '일지(日支)와 십성', title: '그 사람이 자꾸 마음에 걸리는 이유', teaser: '네가 끌리는 결' },
        { term: '비겁과 식상', title: '지금 둘 사이의 거리', teaser: '유리한 것, 걸리는 것' },
        { term: '두 원국의 합(合)과 충(沖)', title: '그 사람과 나, 맞는 데와 걸리는 데', teaser: '그 사람 마음, 사주로 짚어 보면' },
        { term: '일진(日辰)', title: '크리스마스까지, 날짜로', teaser: '12월 ○일, ○일' },
        { term: '월지의 십성', title: '그 사람에게 자연스럽게 다가가는 자리', teaser: '겹치는 자리' },
        { term: '가장 센 기운', title: '그 사람 앞에서 나오는 내 버릇', teaser: '혼자 기대했다 접는 순간' },
        { term: '식상과 인성', title: '먼저 연락해도 될까', teaser: '보낼 첫 문장' },
        { term: '일진과 재성', title: '크리스마스 약속, 이렇게 잡아', teaser: '약속 잡기 좋은 날과 건넬 말' },
        { term: '충(沖)과 원진(怨嗔)', title: '이것만은 하지 마', teaser: '세 가지' },
        { term: '2027년 정미년(丁未年)', title: '크리스마스 이후의 너에게', teaser: '연이 건네는 편지' },
      ],
      button: '연의 풀이 전부 열기',
      sticky: '그 사람이랑 크리스마스, 열어 보기',

      payNote: '지금이면 {list} → {deal}',

      deal: {
        badge: '처음 온 손님 할인',
        timer: '할인 끝나기까지',
        ended: '첫 방문 할인이 끝났어요',
        list: '정가',
        off: '{n}% 할인',
      },
      note: '웹툰 열한 편과 긴 풀이를 받아요. 결제 전에 환불 안내를 확인할 수 있어요.',

      trust: [
        '딱 한 번만 결제돼요. 정기 구독이나 자동 결제는 없어요.',
        '생일로 만세력을 계산해요. 같은 생일이면 언제 봐도 같은 답이에요.',
        '이름과 생일, 그 사람 생일은 이 기기에서만 계산해요. 풀이에는 계산한 글자만 써요.',
        '날짜와 숫자는 모두 사주에서 계산한 값이에요.',
      ],
    },

    more: {
      sample: {
        over: '풀이 화면 예시',
        title: '연이 이렇게 읽어 줘요',

        asks: ['먼저 연락해도 될까?', '무슨 말로 시작하면 좋을까?', '답이 없으면 어디서 멈춰야 할까?'],
        art: '/media/xmas/paid2/07c-phone-peek-f.jpg',
        button: '내 풀이로 이어서 보기',
        note: '다른 사람의 사주로 만든 실제 풀이의 7편 일부예요.\n받으면 이 자리에 네 사주와 그 사람과의 사이로 쓴 글이 들어가요.',
        chapter: '07 · 먼저 연락해도 될까',
        lead: '어설프게 떠보는 스무 문장보다\n약속으로 이어지는 담백한 질문 하나.',
        quote: '"오늘 날씨 진짜 춥더라.\n저번에 말했던 따뜻한 차 파는 곳 어디였지?"',
        body: '안부와 예전에 나눈 대화를 한 번에 꺼내는 문장이에요. 상대가 쉽게 답할 이유를 만들어 주니까, 답하는 쪽도 머뭇거릴 일이 없어요.',
        more: '이어서: 이 사주에 맞는 말투, 답이 오면·안 오면 할 것',
      },
      compare: {
        title: '무료로 본 것, 결제하면 열리는 것',
        cols: ['', '무료', '결제 뒤'],
        rows: [
          ['끌리는 방식', '-', '그 사람에게 끌리는 까닭과 장면'],
          ['움직이기 좋은 날', '개수와 첫 번째 날짜', '하트 표시된 모든 날짜, 다가올 세 날의 행동 가이드'],
          ['크리스마스 약속', '-', '약속 잡기 좋은 날과 건넬 말, 대답이 애매할 때'],
          ['첫 문장', '-', '이 사이에 맞는 메시지 셋'],
          ['두 사람', '간지만', '맞는 데와 걸리는 데'],
          ['하지 말 것', '-', '셋과 한 발 물러설 때'],
        ],
      },
      engine: {
        over: 'DANGOL AI 사주 엔진',
        title: '감으로 쓰지 않아요.\n계산하고, 확인하고, 써요.',

        by: '연세대학교 컴퓨터과학과 출신 개발자가 직접 설계한 사주 엔진이에요.',

        advisor: '25년 경력 명리학 전문가의 자문을 받아 해석 기준을 세웠어요.',
        steps: [
          { k: '01', title: '만세력 계산', text: '생일과 태어난 시간으로 절기와 태양시까지 꼼꼼히 따져 네 기둥을 세워요. 같은 생일이면 언제 봐도 같은 값이에요.' },
          { k: '02', title: '사실표', text: '계산한 간지·오행·날짜 달력과 네가 고른 그 사람과의 사이를 사실표로 묶어요. 풀이는 이 표에 있는 값만 근거로 써요.' },
          { k: '03', title: '두 단계 AI', text: '분석 AI 가 적천수·자평진전 같은 명리 고전의 관점과 종합 해석으로 나눠 편마다 근거를 고르고, 집필 AI 둘이 열한 편을 나눠 동시에 써요.' },
          { k: '04', title: '자동 검수', text: '글에 나온 간지가 계산값과 다르거나, 목차가 빠지거나, 확률을 숫자로 말하면 그 풀이는 내보내지 않아요.' },
        ],
        foot: '그 사람과의 사이와 바라는 것에 따라 권해도 되는 행동을 코드가 먼저 정해요. 그 사람 마음을 아는 척하거나 떠보라고 하지 않아요.',
      },

      urge: {
        title: '그 사람이랑 이번 크리스마스,\n정말 같이 보내고 싶다면',
        lines: [
          '가만히 있으면, 크리스마스는 그냥 지나가.',
          '연말 약속은 생각보다 일찍 차.\n그 사람 달력도 마찬가지고.',
          '"다음에 말해야지" 하다가\n올해도 초 하나 꽂고 끝낼 거야?',
        ],
        close: '이대로 흘려보내고 후회하기 싫다면,\n어떻게 다가갈지 내가 알려 줄게.',
        button: '연한테 방법 듣기',
      },

      timing: {
        title: '크리스마스까지 {n}일',
        today: '오늘이 이브야',
        text: '크리스마스 약속은 12월 10일부터 18일 사이에 미리 물어 두는 게 좋아요.\n그 전에 네 날짜와 건넬 말을 받아 두세요.',
      },
      faq: {
        title: '자주 묻는 것',
        items: [
          { q: '그 사람 생일을 몰라도 돼요?', a: '괜찮아요. 생일을 모르면 없는 궁합을 꾸며 내지 않고, 그 사람 앞에서 네 실이 어떻게 구는지를 같은 분량으로 읽어 줘요. 생일을 알면 두 사람이 맞는 데와 걸리는 데까지 봐요.' },
          { q: '정확한가요?', a: '날짜와 간지는 만세력으로 계산한 값이에요. 풀이는 그 값을 근거로 쓴 해석이고, 그 사람 마음이나 결과를 맞히는 예언은 아니에요. 재미로 보되, 해 볼 일은 진지하게 해 보세요.' },
          { q: '얼마나 걸려요?', a: '결제하면 바로 쓰기 시작해요. 보통 3분 안팎이면 열한 편이 다 나와요.' },
          { q: '분량은 얼마나 돼요?', a: '웹툰 열한 편과 긴 풀이예요. 2026년 11월에 실제로 만든 풀이들은 줄글만 2만 자 안팎이었어요.' },
          { q: '개인정보는요?', a: '이름과 생일, 그 사람 생일은 이 기기에서만 계산해요. 서버와 AI 에는 계산한 글자만 가고, 그 사람 이름이나 연락처는 묻지 않아요.' },
          { q: '결제하면 어디서 봐요?', a: '결제하면 바로 이 화면에서 풀이가 열려요. 로그인하고 결제하면 보관함에 남아 언제든 다시 볼 수 있고, 로그인하지 않으면 지금 쓰는 브라우저 창에서만 볼 수 있어요.' },
          { q: '환불은요?', a: '결제 창에서 환불 기준을 먼저 확인한 뒤에 결제해요.' },
          { q: '문의는 어디로 해요?', a: '{email} 로 메일 주세요.' },
        ],
      },
      final: { title: '그 사람에게 무슨 말을 건넬지,\n같이 골라 보자.', button: '연의 풀이 전부 열기' },
    },
    missing: { title: '아직 생일을 못 들었어', button: '생일 알려 주러 가기' },
  },

  read: {
    badge: '견본',
    notice: '이 화면은 결제 뒤 본문의 새 모양을 보는 견본이에요. 글은 가상의 사주로 쓴 견본 풀이예요.',
    over: '연의 크리스마스 연애 사주',
    title: '{name}의 실',
    toc: '목차',
    empty: '견본 풀이를 불러오지 못했어요.',
  },
} as const;
