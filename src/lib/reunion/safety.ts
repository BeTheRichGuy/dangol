import type { Locale } from '@/content/locale';

export const SAFETY_CODES = ['ex_mind_state', 'ex_return_claim', 'third_party', 'reunion_odds'] as const;
export type SafetyCode = (typeof SAFETY_CODES)[number];

interface Rule {
  code: SafetyCode;

  hit: RegExp;

  subject?: RegExp;

  except: RegExp;
}

const RULES: Record<Locale, readonly Rule[]> = {
  ko: [
    {
      code: 'ex_mind_state',

      hit: /(상대방?|그 ?사람|그분|그쪽)(?:의|은|는|이|가|도|에게|쪽은)?[^.!?\n]{0,16}?(마음|감정|긴장|방어|빗장|결정|번복|잔물결|벽을|벽이|문이|문을|미련|그리움|보고 ?싶|후회|기다리고|아직 ?좋아|아직 ?사랑|서운|외로)/,
      except: /(몰라|알 수 없|알 길|단정|읽지|읽을 수|볼 수 없|보이지 않|짐작|말할 수 없|답은 .{0,6}없)/,
    },
    {
      code: 'ex_return_claim',
      hit: /(돌아올|돌아오지|연락이 ?(올|오지|와요|옵니다|올 거)|먼저 ?연락(할|해 올|이 올)|다시 ?찾아(올|오)|재회(할|하게 될|합니다|한다)|재회가 ?(이루어|될 것|돼요))/,
      except: /(쉬운|쉽|수 ?있|도 ?모르|알 수 없|단정|말할 수|기 ?전에|하더라도|아니에요|않아요|않습니다)/,
    },
    {
      code: 'third_party',
      hit: /(새 ?(연인|애인)|다른 ?(사람|이성)|환승|양다리|바람을|누군가와 ?(만나|사귀)|접근)/,
      subject: /(상대방?|그 ?사람|그분|그쪽)/,
      except: /(알 수 없|단정|말하지|다루지|읽지|예측하지|보이지 않)/,
    },
    { code: 'third_party', hit: /(환승|양다리|접근하는 ?사람)/, except: /(알 수 없|단정|말하지|다루지|읽지|예측하지|보이지 않|않아요|않습니다|아닙니다)/ },
    { code: 'reunion_odds', hit: /(\d+(?:\.\d+)?\s*[%％]|퍼센트|확률|가능성이? ?\d|\d+\s*점(?:이|입니다|이에요))/, except: /(없|않|말하지|매기지)/ },
  ],
  en: [
    {
      code: 'ex_mind_state',
      hit: /\b(they|their|them|your ex|that person|the other person)\b[^.!?\n]{0,40}?\b(feels?|feeling|still (?:love|loves|care|cares)|miss(?:es|ing)?|longing|is waiting|are waiting|regrets?|has moved on|have moved on|guard(?:ed)?|walls? (?:up|around)|heart (?:is|has|stays|remains))\b/i,
      except: /(can['’]?t|cannot|can not|no way to|don['’]?t know|do not know|not something|isn['’]?t something|doesn['’]?t show|won['’]?t tell|unknown|unknowable|may |might |if they|whether)/i,
    },
    {
      code: 'ex_return_claim',
      hit: /\b(will (?:come back|reach out|text|call|return|contact)|is coming back|are coming back|won['’]?t come back|will not come back|will find their way back)\b/i,
      except: /(can['’]?t|cannot|no way to|don['’]?t know|unknown|if |whether|easier|tends? to|may |might |could )/i,
    },
    {
      code: 'third_party',
      hit: /\b(someone new|new (?:partner|lover|love|flame)|seeing someone|moved on with|another (?:person|woman|man)|rebound)\b/i,
      subject: /\b(they|their|them|your ex|that person|the other person)\b/i,
      except: /(can['’]?t|cannot|no way to|don['’]?t know|unknown|not something|won['’]?t|do not|does not)/i,
    },
    { code: 'reunion_odds', hit: /(\d+(?:\.\d+)?\s*%|\bpercent\b|\bprobabilit|\bchance of \d|\bodds\b)/i, except: /(no |not |never|without|don['’]?t|won['’]?t)/i },
  ],
  ja: [
    {
      code: 'ex_mind_state',
      hit: /(相手|あの人|その人|元恋人)(?:の|は|も|が)[^。！？\n]{0,10}?(気持ち|本心|未練|寂しさ|後悔|心(?:は|が)|思って|待って|好きなまま)/,
      except: /(分かりません|わかりません|言えません|読めません|断言|決めつけ|見えません|読みません|分かりません)/,
    },
    {
      code: 'ex_return_claim',
      hit: /(戻ってき|戻ってこ|連絡(?:が|を)(?:来|くれ)|復縁(?:する|できる|します)|必ず(?:戻|連絡))/,

      subject: /(相手|あの人|その人|元恋人|連絡|復縁)/,
      except: /(やすい|かもしれ|できます?が|わかりません|分かりません|言えません|断言|ても|たら|なら|場合|とき)/,
    },
    {
      code: 'third_party',
      hit: /(新しい(?:恋人|人)|別の(?:人|相手)|乗り換え|浮気|誰かと(?:付き合|会って))/,
      subject: /(相手|あの人|その人|元恋人)/,
      except: /(分かりません|わかりません|言えません|読みません|断言|見えません)/,
    },
    { code: 'reunion_odds', hit: /(\d+(?:\.\d+)?\s*[%％]|確率|パーセント|\d+\s*点です)/, except: /(ありません|ない|しません|出しません)/ },
  ],
};

function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？])\s*|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function safetyHits(text: string, locale: Locale): Partial<Record<SafetyCode, string[]>> {
  const visible = text
    .split('\n')
    .filter((line) => !/^\s*>/.test(line))
    .join('\n');
  const out: Partial<Record<SafetyCode, string[]>> = {};
  for (const sentence of sentencesOf(visible)) {
    for (const rule of RULES[locale]) {
      if (!rule.hit.test(sentence)) continue;
      if (rule.subject && !rule.subject.test(sentence)) continue;
      if (rule.except.test(sentence)) continue;
      (out[rule.code] ??= []).push(sentence);
    }
  }
  return out;
}

export function reunionSafetyWarnings(text: string, locale: Locale): SafetyCode[] {
  return Object.keys(safetyHits(text, locale)) as SafetyCode[];
}
