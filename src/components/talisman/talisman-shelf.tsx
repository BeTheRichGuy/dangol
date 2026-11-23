'use client';

import Image from 'next/image';
import { useState } from 'react';
import { TALISMAN } from '@/content/talisman';
import { TALISMAN_IDS, type TalismanId } from '@/lib/talisman';
import { talismanImageUrl } from '@/lib/talisman/art';
import { useLocale } from '../locale-provider';
import { TalismanSheet } from './talisman-sheet';
import { useShelf } from './use-shelf';
import './talisman.css';

export function TalismanShelf() {
  useLocale();
  const S = TALISMAN.shelf;
  const have = useShelf();
  const [open, setOpen] = useState<TalismanId | null>(null);

  return (
    <section aria-labelledby="tl-shelf-title" className="tl-shelf">
      <div className="tl-shelf__head">
        <h2 id="tl-shelf-title" className="tl-shelf__title">
          {S.title}
        </h2>
        <span className="tl-shelf__count">{S.count(have.length, TALISMAN_IDS.length)}</span>
      </div>
      <p className="tl-shelf__lead">{have.length === 0 ? S.empty : S.lead}</p>
      <ul className="tl-shelf__row">
        {TALISMAN_IDS.map((id) => {
          const owned = have.includes(id);
          const name = TALISMAN.items[id].name;
          return (
            <li key={id}>
              <button
                type="button"
                className="tl-icon"
                data-owned={owned}
                disabled={!owned}
                onClick={() => setOpen(id)}
                aria-label={owned ? name : `${name} (${S.locked})`}
              >
                <Image src={talismanImageUrl(id, { width: 192 })} alt="" width={192} height={288} unoptimized loading="lazy" />
              </button>
            </li>
          );
        })}
      </ul>
      {open ? <TalismanSheet id={open} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}
