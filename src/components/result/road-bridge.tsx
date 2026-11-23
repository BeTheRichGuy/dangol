'use client';

import { WEBTOON } from '@/content/webtoon';
import type { TypeKey } from '@/lib/saju';
import { Bubble, Narration, Panel } from '../webtoon';
import { artFor, framingProps, sideOf } from './art-plan';

export function RoadBridge({ type }: { type: TypeKey }) {
  return (
    <Panel image={artFor('bridge', type) ?? undefined} {...framingProps('bridge')}>
      <Bubble side={sideOf('bridge', 'right')} tail="up">
        <p>{WEBTOON.bridgeLine}</p>
      </Bubble>
      <Narration voice="stage">
        <p>{WEBTOON.bridgeStage}</p>
      </Narration>
    </Panel>
  );
}
