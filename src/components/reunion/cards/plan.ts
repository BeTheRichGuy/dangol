import { saveCardUrl, type SaveCard, type SaveKind } from '@/app/api/reunion-card/params';
import type { Locale } from '@/content/locale';
import { dateCards, firstOpenMonth, kitPick, songDates, songLineIndex, windowCalendar, type KitPick, type WindowMonth } from '@/lib/reunion/cards';
import { WANT_IDS, type ReunionIntake, type WantId } from '@/lib/reunion/intake';
import { frayedKey, type FrayedKey } from '@/lib/reunion/pick';
import type { RoomPayload } from '@/lib/rooms/payload';

export type ReunionCardKey = 'readiness' | 'paths' | 'window' | 'kit' | 'days' | 'rules' | 'letgo';

export const REUNION_CARD_PLACE: Readonly<Record<ReunionCardKey, number>> = {
  readiness: 7,
  paths: 7,
  window: 8,
  kit: 9,
  days: 11,
  rules: 11,
  letgo: 12,
};

const CARD_ORDER = Object.keys(REUNION_CARD_PLACE) as ReunionCardKey[];

export function reunionCardsAfter(n: number): ReunionCardKey[] {
  return CARD_ORDER.filter((key) => REUNION_CARD_PLACE[key] === n);
}

export const MOVEMENT_STARTS: readonly number[] = [1, 3, 7, 11];

export function movementAt(n: number): number | null {
  const i = MOVEMENT_STARTS.indexOf(n);
  return i < 0 ? null : i;
}

export function wantsLetGo(intake: Pick<ReunionIntake, 'want'>): boolean {
  return intake.want === 'letgo';
}

export function cardFolded(key: ReunionCardKey, intake: Pick<ReunionIntake, 'want'>): boolean {
  const at = REUNION_CARD_PLACE[key];
  return wantsLetGo(intake) && at >= 7 && at <= 10;
}

export function startOpenChapters(intake: Pick<ReunionIntake, 'want'>): number[] {
  return wantsLetGo(intake) ? [12] : [];
}

export function splitNote(text: string): { quote: string; note: string } {
  const m = /^([\s\S]*?)\s*[(（]([^()（）]+)[)）]\s*$/.exec(text);
  return m && m[1].trim() ? { quote: m[1].trim(), note: m[2].trim() } : { quote: text.trim(), note: '' };
}

export interface KitSizes {
  plain: number;
  apology: number;
  news: number;
  dontSend: number;
}

export interface ReunionCardData {
  intake: ReunionIntake;
  calendar: WindowMonth[];
  dates: WindowMonth[];
  open: WindowMonth | null;
  kit: KitPick;
  frayed: FrayedKey;

  songLine: number;
  songDates: WindowMonth[];
}

export function reunionCardData(payload: RoomPayload, sizes: KitSizes): ReunionCardData | null {
  const intake = payload.reunion;
  if (payload.room !== 'reunion' || !intake || !payload.partner) return null;
  const calendar = windowCalendar(payload);
  return {
    intake,
    calendar,
    dates: dateCards(calendar),
    open: firstOpenMonth(calendar),
    kit: kitPick(payload, intake, sizes),
    frayed: frayedKey(payload.partner.cross),
    songLine: songLineIndex(payload, intake.want),
    songDates: songDates(calendar),
  };
}

export function songFlatIndex(want: WantId, line: number): number {
  return WANT_IDS.indexOf(want) * 3 + line;
}

export function saveCardsOf(data: ReunionCardData, locale: Locale): Record<SaveKind, SaveCard> {
  const first = data.calendar[0];
  return {
    window: { kind: 'window', locale, from: { year: first?.year ?? 2026, month: first?.month ?? 1 }, kinds: data.calendar.map((m) => m.kind) },
    kit:
      data.kit.mode === 'waiting'
        ? { kind: 'kit', locale, mode: 'waiting' }
        : { kind: 'kit', locale, mode: 'kit', plain: data.kit.plain, apology: data.kit.apology, news: data.kit.news, dontSend: data.kit.dontSend },
    song: { kind: 'song', locale, line: songFlatIndex(data.intake.want, data.songLine), dates: data.songDates.map((m) => ({ year: m.year, month: m.month })) },
  };
}

export function canSaveCards(data: ReunionCardData): boolean {
  return data.calendar.length === 12;
}

export { saveCardUrl };
