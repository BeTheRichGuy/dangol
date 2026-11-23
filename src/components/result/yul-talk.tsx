'use client';

import { RevealText } from '@/components/mystic';
import type { TypeKey } from '@/lib/saju';
import { Bubble, Panel } from '../webtoon';
import { artFor, framingProps, sideOf, type ArtSlot } from './art-plan';
import { bubbleDelay } from './balloons';
import { DustWhenSeen } from './scenes';
import './result.css';

export function YulTalk({ lines, slot, type, glyph, label }: { lines: string[]; slot?: ArtSlot; type: TypeKey; glyph?: string; label: string }) {
  if (lines.length === 0) return null;
  const image = slot ? (artFor(slot, type) ?? undefined) : undefined;
  const first = slot && image ? sideOf(slot) : 'left';
  return (
    <section aria-label={label} data-yul-talk={slot ?? 'plain'}>
      <Panel
        image={image}
        {...(slot && image ? framingProps(slot) : {})}
        glyph={image ? undefined : glyph}
        bloom={Boolean(image)}
        layer={image ? <DustWhenSeen density={0.5} /> : undefined}
        className="wt-mood-tease"
      >
        {lines.map((text, i) => (
          <Bubble
            key={text}
            side={i % 2 === 0 ? first : first === 'left' ? 'right' : 'left'}
            tail={image && i === 0 ? 'up' : 'none'}
            delayMs={bubbleDelay(i)}
          >
            <p>
              <RevealText text={text} delayMs={bubbleDelay(i)} />
            </p>
          </Bubble>
        ))}
      </Panel>
    </section>
  );
}
