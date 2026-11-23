export type Tail = 'dl' | 'dr' | 'ul' | 'ur' | 'none';

export interface Say {
  text: string;
  x: number;
  y: number;
  tail?: Tail;

  big?: boolean;

  me?: boolean;
}

export interface Note {
  text: string;
  x: number;
  y: number;
}

export interface ChatLine {
  who?: string;
  text: string;
  me?: boolean;
}

interface Base {

  gap?: number;
}

export type Beat = Base &
  (
    | { kind: 'clock'; text: string; sub?: string }

    | { kind: 'text'; lines: string[]; size?: 'lg' | 'sm' }

    | { kind: 'hook'; lines: { text: string; box?: boolean; small?: boolean }[] }
    | { kind: 'thoughts'; lines: string[] }
    | { kind: 'sfx'; text: string; side: 'left' | 'right' }
    | { kind: 'me'; text: string }

    | { kind: 'say'; text: string; side?: 'left' | 'right'; big?: boolean }

    | { kind: 'typing'; to: string; text: string; send: string }
    | { kind: 'chat'; title: string; lines: ChatLine[] }
    | {
        kind: 'art';
        src: string;

        ratio: number;

        width?: number;
        side?: 'left' | 'right';

        fade?: 'top' | 'bottom' | 'both';

        slant?: 'a' | 'b';

        shape?: 'soft';
        position?: string;

        hush?: boolean;
        says?: Say[];
        notes?: Note[];
      }
    | { kind: 'clip'; src: string; poster: string; ratio: number;  loop?: boolean }
    | { kind: 'flip'; frames: string[]; ratio: number; says?: Say[] }
    | { kind: 'lanterns'; labels: string[]; stir?: boolean; says?: string[] }
    | { kind: 'choice'; label: string; hint: string }
  );
