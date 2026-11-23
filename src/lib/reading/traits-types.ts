import type { Element, GodGroup, TypeKey } from '@/lib/saju/types';

export type TraitStrength = 'strong' | 'balanced' | 'gentle';

export type TraitKind = 'core' | 'pattern' | 'love' | 'tension' | 'missing';

export interface TraitLine {
  id: string;
  text: string;
}

export interface TraitFeatures {
  strength: TraitStrength;

  dominant: GodGroup;

  palace: GodGroup;

  missing: Element | null;

  tension: boolean;
}

export interface TraitHit {
  id: string;
  kind: TraitKind;
  text: string;
}

export interface TraitReading {
  features: TraitFeatures;

  hits: TraitHit[];

  bonus: TraitHit | null;
}

export interface TraitChapterText {
  title: string;
  line: string;
}

export interface ChapterInfo {

  index: number;
  total: number;

  startAge: number;
  endAge: number;

  startYear: number;
  endYear: number;

  ganzhi: string;

  group: GodGroup;

  samePolarity?: boolean;
  title: string;
  line: string;

  next: { title: string; startAge: number } | null;

  beforeStart?: boolean;
}

export interface TraitLibrary {

  core: Record<TypeKey, Record<TraitStrength, TraitLine[]>>;

  pattern: Record<GodGroup, TraitLine[]>;

  love: Record<GodGroup, TraitLine[]>;

  tension: TraitLine[];

  missing: Record<Element, TraitLine[]>;

  chapters: Record<GodGroup, TraitChapterText>;

  chapters10?: Record<GodGroup, { same: TraitChapterText; other: TraitChapterText }>;
}
