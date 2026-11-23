'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ROOMS_COPY } from '@/content/rooms';
import { ROOMS, ROOM_KEYS, type RoomKey } from '@/lib/rooms/themes';
import { REUNION_GUIDE_NAME } from '@/lib/reunion/product';
import { track } from '@/lib/analytics/track';
import { XMAS_ROW } from '@/content/xmas';
import { XMAS_OPEN } from '@/lib/xmas/open';
import { daysToClose } from '@/lib/xmas/season';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import { FREE_CARD_ART } from '../scene/manifest';
import { markContinue } from './continue';
import { useLocale } from '../locale-provider';
import { railEdges, railStep } from './rail-scroll';
import { RoomArt } from './room-art';
import { dealText } from './price-deal';
import { useRoomPrice } from './use-room-price';
import './rooms.css';

export function RoomCard({ room, index, total }: { room: RoomKey; index: number; total: number }) {
  const copy = ROOMS_COPY.rooms[room];
  const keeper = ROOMS_COPY.keepers[ROOMS[room].keeper];
  return (
    <Link
      href={`/room/${room}`}
      onClick={() => {

        markContinue(room, 'home');
        track('room_click', { room, pos: index + 1 });
      }}
      className="rm-card"
      aria-label={`${copy.title}, ${keeper.name}`}
    >
      <span className="rm-card__art">
        <RoomArt room={room} glyph={keeper.hanja} sizes="(max-width: 520px) 76vw, 360px" />
      </span>
      <span className="rm-card__shade" aria-hidden="true" />
      <span className="rm-card__count" aria-hidden="true">
        {ROOMS_COPY.home.counter(index + 1, total)}
      </span>
      <span className="rm-card__body">
        <span className="rm-card__keeper">{keeper.name}</span>
        <span className="rm-card__title">{copy.title}</span>
        <span className="rm-card__quote">{ROOMS_COPY.quote(copy.quote)}</span>
        <span className="rm-card__foot">
          <span className="rm-card__enter">
            {ROOMS_COPY.home.enter}
            <ChevronRightIcon size={16} />
          </span>
        </span>
      </span>
    </Link>
  );
}

function ReunionCard({ index, total }: { index: number; total: number }) {
  const locale = useLocale();
  const copy = ROOMS_COPY.reunion;
  const keeper = ROOMS_COPY.keepers.u12;
  return (
    <Link
      href="/room/reunion"
      onClick={() => track('room_click', { room: 'reunion', pos: index + 1 })}
      className="rm-card rm-card--new"
      aria-label={`${ROOMS_COPY.home.newRelease}, ${copy.title}, ${keeper.name}`}
    >
      <span className="rm-card__art">
        <RoomArt room="reunion" glyph={REUNION_GUIDE_NAME[locale].hanja} sizes="(max-width: 520px) 76vw, 360px" />
      </span>
      <span className="rm-card__shade" aria-hidden="true" />
      <span className="rm-card__new">{ROOMS_COPY.home.newRelease}</span>
      <span className="rm-card__count" aria-hidden="true">
        {ROOMS_COPY.home.counter(index + 1, total)}
      </span>
      <span className="rm-card__body">
        <span className="rm-card__keeper">{keeper.name}</span>
        <span className="rm-card__title">{copy.title}</span>
        <span className="rm-card__quote">{ROOMS_COPY.quote(copy.quote)}</span>
        <span className="rm-card__foot">
          <span className="rm-card__enter">
            {ROOMS_COPY.home.enter}
            <ChevronRightIcon size={16} />
          </span>
        </span>
      </span>
    </Link>
  );
}

function FreeCard({ total }: { total: number }) {
  const f = ROOMS_COPY.home.free;
  return (
    <Link href="/reading" className="rm-card" aria-label={`${f.title}, ${f.badge}`}>
      <span className="rm-card__art">
        <span className="rm-art">
          <Image src={FREE_CARD_ART} alt="" fill sizes="(max-width: 520px) 76vw, 360px" className="rm-art__img" />
        </span>
      </span>
      <span className="rm-card__shade" aria-hidden="true" />
      <span className="rm-card__count" aria-hidden="true">
        {ROOMS_COPY.home.counter(1, total)}
      </span>
      <span className="rm-card__body">
        <span className="rm-card__keeper">{f.label}</span>
        <span className="rm-card__title">{f.title}</span>
        <span className="rm-card__quote">{ROOMS_COPY.quote(f.quote)}</span>
        <span className="rm-card__foot">
          <span className="rm-price">{f.badge}</span>
          <span className="rm-card__enter">
            {f.cta}
            <ChevronRightIcon size={16} />
          </span>
        </span>
      </span>
    </Link>
  );
}

function RoomRow({ room, index }: { room: RoomKey; index: number }) {
  const copy = ROOMS_COPY.rooms[room];
  const keeper = ROOMS_COPY.keepers[ROOMS[room].keeper];
  return (
    <Link
      href={`/room/${room}`}
      onClick={() => {
        markContinue(room, 'home');
        track('room_click', { room, pos: index + 1 });
      }}
      className="rm-row"
      aria-label={`${copy.title}, ${keeper.name}`}
    >
      <span className="rm-row__art">
        <RoomArt room={room} glyph={keeper.hanja} sizes="104px" />
      </span>
      <span className="rm-row__body">
        <span className="rm-row__keeper">{keeper.name}</span>
        <span className="rm-row__title">{copy.title}</span>
        <span className="rm-row__gain">{copy.gain}</span>
        <span className="rm-row__foot">
          <span className="rm-card__enter">
            {ROOMS_COPY.home.enter}
            <ChevronRightIcon size={16} />
          </span>
        </span>
      </span>
    </Link>
  );
}

function FreeRow() {
  const f = ROOMS_COPY.home.free;
  return (
    <Link href="/reading" className="rm-row" aria-label={`${f.title}, ${f.badge}`}>
      <span className="rm-row__art">
        <span className="rm-art">
          <Image src={FREE_CARD_ART} alt="" fill sizes="104px" className="rm-art__img" />
        </span>
      </span>
      <span className="rm-row__body">
        <span className="rm-row__keeper">{f.label}</span>
        <span className="rm-row__title">{f.title}</span>
        <span className="rm-row__gain">{f.gain}</span>
        <span className="rm-row__foot">
          <span className="rm-price">{f.badge}</span>
          <span className="rm-card__enter">
            {f.cta}
            <ChevronRightIcon size={16} />
          </span>
        </span>
      </span>
    </Link>
  );
}

function ReunionPaidRow({ index }: { index: number }) {
  const locale = useLocale();
  const copy = ROOMS_COPY.reunion;
  const keeper = ROOMS_COPY.keepers.u12;
  return (
    <Link
      href="/room/reunion"
      onClick={() => track('room_click', { room: 'reunion', pos: index + 1 })}
      className="rm-row rm-row--new"
      aria-label={`${ROOMS_COPY.home.newRelease}, ${copy.title}, ${keeper.name}`}
    >
      <span className="rm-row__art">
        <RoomArt room="reunion" glyph={REUNION_GUIDE_NAME[locale].hanja} sizes="104px" />
      </span>
      <span className="rm-row__body">
        <span className="rm-new">{ROOMS_COPY.home.newRelease}</span>
        <span className="rm-row__keeper">{keeper.name}</span>
        <span className="rm-row__title">{copy.title}</span>
        <span className="rm-row__gain">{copy.gain}</span>
        <span className="rm-row__foot">
          <span className="rm-card__enter">
            {ROOMS_COPY.home.enter}
            <ChevronRightIcon size={16} />
          </span>
        </span>
      </span>
    </Link>
  );
}

export function FreeList({ heading: Heading = 'h2' }: { heading?: 'h2' | 'h3' }) {
  const h = ROOMS_COPY.home;
  return (
    <>
      <Heading className="rm-list__head">{h.freeHead}</Heading>
      <ul className="rm-list" aria-label={h.freeHead}>
        <li>
          <FreeRow />
        </li>
      </ul>
    </>
  );
}

function XmasRow() {
  const locale = useLocale();
  const closed = useSyncExternalStore(noop, () => daysToClose(Date.now()) === 0, () => undefined);
  if (!XMAS_OPEN || closed !== false) return null;
  const x = XMAS_ROW;
  return (
    <li>
      <Link href="/xmas" onClick={() => track('room_click', { to: 'xmas', from: 'rooms_band' })} className="rm-row rm-row--new" lang={locale} aria-label={`${x.badge}, ${x.title}, ${x.keeper}`}>
        <span className="rm-row__art">
          <span className="rm-art">
            <Image src={x.art} alt="" fill sizes="104px" className="rm-art__img" />
          </span>
        </span>
        <span className="rm-row__body">
          <span className="rm-new">{x.badge}</span>
          <span className="rm-row__keeper">{x.keeper}</span>
          <span className="rm-row__title">{x.title}</span>
          <span className="rm-row__gain">{x.gain}</span>
          <span className="rm-row__foot">
            <span className="rm-card__enter">
              {ROOMS_COPY.home.enter}
              <ChevronRightIcon size={16} />
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}
const noop = () => () => {};

export function RoomList({ label, free = true }: { label: string; free?: boolean }) {
  const h = ROOMS_COPY.home;
  return (
    <>
      {free ? <FreeList heading="h3" /> : null}
      <h3 className="rm-list__head">{h.paidHead}</h3>
      <ul className="rm-list" aria-label={label}>
        <XmasRow />
        <li>
          <ReunionPaidRow index={0} />
        </li>
        {ROOM_KEYS.map((key, i) => (
          <li key={key}>
            <RoomRow room={key} index={i + 1} />
          </li>
        ))}
      </ul>
    </>
  );
}

export function RoomRailList({ exclude, label, withFree = false, withReunion = true }: { exclude?: RoomKey; label: string; withFree?: boolean; withReunion?: boolean }) {
  const keys = ROOM_KEYS.filter((k) => k !== exclude);

  const lead = (withFree ? 1 : 0) + (withReunion ? 1 : 0);
  const total = keys.length + lead;
  const rail = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ prev: false, next: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () => setEdges(railEdges({ left: el.scrollLeft, width: el.clientWidth, scrollWidth: el.scrollWidth }));

    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', update);
    };
  }, []);

  function go(dir: 1 | -1) {
    const el = rail.current;
    const item = el?.querySelector<HTMLElement>('.rm-rail__item');
    if (!el || !item) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * railStep(item.offsetWidth, gap), behavior: 'smooth' });
  }

  return (
    <div className="rm-rail-wrap">
      <ul ref={rail} className="rm-rail" aria-label={label}>
        {withFree ? (
          <li className="rm-rail__item">
            <p className="rm-rail__question">{ROOMS_COPY.home.free.question}</p>
            <p className="rm-rail__gain">{ROOMS_COPY.home.free.gain}</p>
            <FreeCard total={total} />
          </li>
        ) : null}
        {withReunion ? (
          <li className="rm-rail__item">
            <p className="rm-rail__question">{ROOMS_COPY.reunion.question}</p>
            <p className="rm-rail__gain">{ROOMS_COPY.reunion.gain}</p>
            <ReunionCard index={withFree ? 1 : 0} total={total} />
          </li>
        ) : null}
        {keys.map((key, i) => (
          <li key={key} className="rm-rail__item">
            <p className="rm-rail__question">{ROOMS_COPY.rooms[key].question}</p>
            {}
            <p className="rm-rail__gain">{ROOMS_COPY.rooms[key].gain}</p>
            <RoomCard room={key} index={i + lead} total={total} />
          </li>
        ))}
      </ul>
      <button type="button" className="rm-rail__nav rm-rail__nav--prev" onClick={() => go(-1)} disabled={!edges.prev} aria-label={ROOMS_COPY.home.prev}>
        <ChevronLeftIcon size={22} />
      </button>
      <button type="button" className="rm-rail__nav rm-rail__nav--next" onClick={() => go(1)} disabled={!edges.next} aria-label={ROOMS_COPY.home.next}>
        <ChevronRightIcon size={22} />
      </button>
    </div>
  );
}

export function RoomsBand({ flush = false, free = true }: { flush?: boolean; free?: boolean }) {
  const { price, was } = useRoomPrice();
  useLocale();
  const h = ROOMS_COPY.home;
  return (
    <section id="rooms" className={`rm-band rm-night${flush ? ' rm-band--flush' : ''}`} aria-labelledby="rooms-heading">
      <div className="rm-band__head">
        <p className="rm-eyebrow">{h.eyebrow}</p>
        <h2 id="rooms-heading" className="rm-heading">
          {h.heading}
        </h2>
        <p className="rm-sub">{dealText(h.sub, ROOMS_COPY.first.price, price, was)}</p>
      </div>

      <RoomList label={h.railLabel} free={free} />

      <div className="rm-how">
        <h3 className="rm-how__heading">{h.howHeading}</h3>
        <ol className="rm-how__list">
          {h.how.map((line, i) => (
            <li key={i}>
              <span className="rm-how__num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
