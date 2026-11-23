'use client';

import { RevealText } from '@/components/mystic';
import { ROOMS_COPY } from '@/content/rooms';
import { ROOMS, type ProductKey } from '@/lib/rooms/themes';
import { bubbleDelay } from '../result/balloons';
import { splitSentences } from '../result/webtoon-text';
import { DustWhenSeen } from '../result/scenes';
import { Bubble, Narration, Panel, WritingBubble, type BubbleSide } from '../webtoon';
import type { WebtoonBeat } from './reading-blocks';
import { roomCopy } from './room-copy';
import { placeBeats, ROOM_STORY, storySrc, type PanelSay, type StoryPanel } from './room-story';

const other = (side: BubbleSide): BubbleSide => (side === 'left' ? 'right' : 'left');

const byLine = (text: string) => splitSentences(text).join('\n');

export function RoomStory({
  room,
  beats = [],
  writing = false,
}: {
  room: ProductKey;

  beats?: readonly WebtoonBeat[];

  writing?: boolean;
}) {
  const keeper = ROOMS_COPY.keepers[ROOMS[room].keeper].name;
  const says = placeBeats(roomCopy(room).story, beats, writing);
  return (
    <section className="rm-story" aria-label={ROOMS_COPY.page.storyLabel(keeper)}>
      {ROOM_STORY[room].map((panel, i) => (
        <StoryPanelView key={panel.file} panel={panel} say={says[i]} keeper={keeper} first={i === 0} />
      ))}
    </section>
  );
}

function StoryPanelView({ panel, say, keeper, first }: { panel: StoryPanel; say: PanelSay; keeper: string; first: boolean }) {
  const mouth = panel.mouth;

  const start: BubbleSide = mouth !== undefined && mouth >= 0.5 ? 'right' : 'left';
  const sideAt = (i: number): BubbleSide => (i % 2 === 0 ? start : other(start));

  return (
    <Panel
      image={storySrc(panel)}
      alt={panel.alt}
      aspect={panel.aspect}
      align={panel.align}
      objectPosition={panel.objectPosition}
      zoom={panel.zoom}
      eager={first}
      bloom={first}
      layer={first ? <DustWhenSeen density={0.5} /> : undefined}
    >
      {say.writing ? <WritingBubble side={start} /> : null}
      {say.lines.map((line, i) => {
        return (

          <Bubble
            key={`${i}:${line.text}`}
            who={keeper}
            side={sideAt(i)}
            tail={i === 0 && mouth !== undefined ? 'up' : 'none'}
            mouth={mouth}
            delayMs={bubbleDelay(i)}
          >
            {}
            <p className="rm-lines">
              <RevealText text={byLine(line.text)} delayMs={bubbleDelay(i)} />
            </p>
          </Bubble>
        );
      })}
      {say.stage ? (
        <Narration voice="stage">
          <p className="rm-lines">{byLine(say.stage)}</p>
        </Narration>
      ) : null}
    </Panel>
  );
}
