'use client';

import Link from 'next/link';
import { OTHER_KEEPERS as T } from '@/content/continue';
import { CHAT_CHARACTERS } from '@/lib/chat/characters';
import { BundleBanner } from '../bundle/bundle-banner';
import { BUNDLES_ON } from '@/lib/payments/bundle';
import { Narration } from '../webtoon';
import './result.css';

const REUNION_FACE = '/media/chat/reunion.jpg';

export function OtherKeepers() {
  return (
    <section aria-label={T.sectionLabel} className="mt-12 grid gap-4">
      <Narration serif className="rs-menu rs-others">
        <p className="rs-menu__lead">{T.heading}</p>
        <p className="rs-others__lead">{T.lead}</p>
        <ul className="rs-others__list">
          {T.keepers.map((k) => (
            <li key={k.key} data-keeper={k.key}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="rs-others__face" src={k.key === 'reunion' ? REUNION_FACE : CHAT_CHARACTERS[k.key].art} alt="" width={64} height={64} loading="lazy" draggable={false} />
              <strong>{k.name}</strong>
              <span>{k.line}</span>
            </li>
          ))}
        </ul>
      </Narration>
      <div className="grid justify-items-stretch">
        <Link href="/home#rooms" className="dg-btn dg-btn--glow rs-cta">
          {T.cta}
        </Link>
      </div>
      {BUNDLES_ON ? <BundleBanner /> : null}
    </section>
  );
}
