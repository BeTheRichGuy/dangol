'use client';

import Image from 'next/image';
import { UI } from '@/content/ui';
import { ENTER, ENTER_FRAME } from './scene/manifest';

const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
const POSITION = `${pct(ENTER_FRAME.position.x)} ${pct(ENTER_FRAME.position.y)}`;

export function IntroMedia() {
  return (

    <div data-intro-media className="absolute inset-0 overflow-hidden" style={{ background: 'var(--paper-deep)' }}>
      <Image
        src={ENTER.poster}
        alt={UI.landing.videoAlt}
        fill
        preload
        sizes="(min-width: 520px) 480px, 100vw"
        className="object-cover"
        style={{ objectPosition: POSITION }}
      />
    </div>
  );
}
