'use client';

import { ROOMS_COPY } from '@/content/rooms';

export function BundleLuckChooser({ onChoose }: { onChoose: (sex: 'female' | 'male') => void }) {
  const L = ROOMS_COPY.page.needLuck;
  return (
    <div className="rm-luck" role="group" aria-label={L.line}>
      <p className="m-0">{L.line}</p>
      <p className="rm-subject__meta m-0">{L.why}</p>
      <div className="rm-luck__row">
        <button type="button" className="rf-choice" onClick={() => onChoose('female')}>
          {L.woman}
        </button>
        <button type="button" className="rf-choice" onClick={() => onChoose('male')}>
          {L.man}
        </button>
      </div>
      <div className="rm-luck__row">
        <button type="button" className="rf-choice" onClick={() => onChoose('male')}>
          {L.yang}
        </button>
        <button type="button" className="rf-choice" onClick={() => onChoose('female')}>
          {L.yin}
        </button>
      </div>
      <p className="rm-subject__meta m-0">{L.nbHint}</p>
    </div>
  );
}
