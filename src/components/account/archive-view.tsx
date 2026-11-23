'use client';

import { HomeTabs } from './home-parts';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ACCOUNT } from '@/content/account';
import { ROOMS_COPY } from '@/content/rooms';
import { TALISMAN } from '@/content/talisman';
import { groupReadings, type ArchiveView as View } from '@/lib/account/archive';
import { shownQuestion } from '@/lib/account/saved-payload';
import type { SavedReading } from '@/lib/account/types';
import { isProductKey, ROOMS } from '@/lib/rooms/themes';
import { LanguagePicker } from '../home-hero';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import { useLocale } from '../locale-provider';
import { ResultView } from '../result/result-view';
import { RoomArt } from '../rooms/room-art';
import { roomCopy } from '../rooms/room-copy';
import { ENTER } from '../scene/manifest';
import { Stage } from '../stage';
import '../rooms/rooms.css';
import { useAccount } from './account-provider';
import { formatDay, formatMonth } from './format';
import { LoginPanel } from './login-panel';
import { answersFromSaved } from './saved';
import { SavedRoomReading } from './saved-room-reading';
import { TalismanShelf } from '../talisman/talisman-shelf';
import './account.css';

const VIEWS: readonly View[] = ['all', 'person', 'kind'];
type Tab = 'readings' | 'talisman';
const TABS: readonly Tab[] = ['readings', 'talisman'];

export function ArchiveView() {
  const id = useSearchParams().get('r');

  return id ? (
    <OpenReading id={id} />
  ) : (
    <>
      <ArchiveList />
      <HomeTabs active="archive" />
    </>
  );
}

function kindTitle(r: SavedReading): string {
  return isProductKey(r.kind) ? roomCopy(r.kind).title : ACCOUNT.archive.free;
}

function groupLabel(view: View, key: string, label: string): string {
  if (view === 'all') return formatMonth(key);
  if (view === 'kind') return isProductKey(key) ? roomCopy(key).title : ACCOUNT.archive.free;
  return label;
}

function ArchiveList() {
  useLocale();
  const A = ACCOUNT.archive;
  const { mode, ready, user, readings, loaded, failed, deleteReading, refresh } = useAccount();
  const [tab, setTab] = useState<Tab>('readings');
  const [view, setView] = useState<View>('all');
  const [asking, setAsking] = useState<string | null>(null);
  const groups = groupReadings(readings, view);

  const running = readings.some((r) => r.status === 'running');
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => void refresh().catch(() => undefined), 5000);
    return () => window.clearInterval(t);
  }, [running, refresh]);

  return (
    <Stage backdrop={ENTER.poster} night>
      <main id="main" className="rs-night rm-night ac-page">
        <header className="ac-top">
          <Link href="/home" className="ac-back">
            <ChevronLeftIcon size={20} />
            <span>{ACCOUNT.people.back}</span>
          </Link>
          <LanguagePicker />
        </header>

        <div className="ac-page__head">
          <h1 className="ac-page__title">{A.title}</h1>
          <p className="ac-page__lead">{A.lead}</p>
        </div>

        {!ready ? null : mode === 'off' ? (
          <p className="ac-soon">{ACCOUNT.login.soon}</p>
        ) : !user ? (
          <div className="ac-card">
            <p className="ac-card__line">{ACCOUNT.home.signInLine}</p>
            <LoginPanel next="/archive" layout="full" />
          </div>
        ) : !loaded ? (
          <p className="ac-wait" role="status">
            {ACCOUNT.people.loading}
          </p>
        ) : (
          <>
            {failed ? (
              <p className="ac-error" role="alert">
                {ACCOUNT.people.error}
              </p>
            ) : null}
            {}
            <div className="ac-tabs" role="group" aria-label={A.tabsLabel}>
              {TABS.map((t) => (
                <button key={t} type="button" className="ac-tabs__btn" aria-pressed={tab === t} onClick={() => setTab(t)}>
                  {t === 'readings' ? A.tabReadings : TALISMAN.shelf.title}
                </button>
              ))}
            </div>
            {tab === 'talisman' ? (
              <TalismanShelf />
            ) : readings.length === 0 ? (
              <div className="ac-empty">
                <p className="m-0">{A.empty}</p>
                <Link href="/reading" className="dg-btn dg-btn--glass mt-4 w-full">
                  {A.emptyCta}
                </Link>
              </div>
            ) : (
              <>
                <div className="ac-views" role="group" aria-label={A.viewsLabel}>
                  {VIEWS.map((v) => (
                    <button key={v} type="button" className="ac-views__btn" aria-pressed={view === v} onClick={() => setView(v)}>
                      {A.views[v]}
                    </button>
                  ))}
                </div>
                {groups.map((g) => (
                  <section key={`${view}-${g.key}`} className="ac-group" aria-label={groupLabel(view, g.key, g.label)}>
                    <h2 className="ac-group__title">
                      {groupLabel(view, g.key, g.label)}
                      <span className="ac-group__count">{g.items.length}</span>
                    </h2>
                    <ul className="ac-readings">
                      {g.items.map((r) => (
                        <li key={r.id} className="ac-reading">
                          <Link href={`/archive?r=${encodeURIComponent(r.id)}`} className="ac-reading__open" aria-label={`${A.open}: ${kindTitle(r)}`}>
                            <span className="ac-reading__art" aria-hidden="true">
                              {isProductKey(r.kind) ? (
                                <RoomArt room={r.kind} glyph={ROOMS_COPY.keepers[ROOMS[r.kind].keeper].hanja} sizes="64px" />
                              ) : (
                                <span className="ac-reading__glyph">命</span>
                              )}
                            </span>
                            <span className="ac-reading__text">
                              <span className="ac-reading__kind">
                                {kindTitle(r)}
                                {r.status !== 'done' ? <span className="ac-reading__status" data-status={r.status}>{r.status === 'running' ? A.running : A.failed}</span> : null}
                              </span>
                              <span className="ac-reading__who">
                                {r.people[1] ? A.pair(r.people[0].name, r.people[1].name) : r.people[0].name}
                              </span>
                              {shownQuestion(r.question) ? <span className="ac-reading__q">{A.asked(shownQuestion(r.question))}</span> : null}
                              <span className="ac-reading__date">{A.readOn(formatDay(r.createdAt))}</span>
                            </span>
                            <ChevronRightIcon size={18} className="ac-reading__go" />
                          </Link>
                          {asking === r.id ? (
                            <span className="ac-confirm" role="group" aria-label={A.removeConfirm}>
                              <span className="ac-confirm__q">{A.removeConfirm}</span>
                              <button
                                type="button"
                                className="ac-confirm__yes"
                                onClick={() => {
                                  setAsking(null);
                                  void deleteReading(r.id).catch(() => undefined);
                                }}
                              >
                                {A.removeYes}
                              </button>
                              <button type="button" className="ac-confirm__no" onClick={() => setAsking(null)}>
                                {A.removeNo}
                              </button>
                            </span>
                          ) : (
                            <button type="button" className="ac-text-btn ac-text-btn--soft ac-reading__remove" onClick={() => setAsking(r.id)}>
                              {A.remove}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </>
            )}
          </>
        )}
      </main>
    </Stage>
  );
}

function OpenReading({ id }: { id: string }) {
  const { ready, user, getReading, deleteReading } = useAccount();
  const [found, setFound] = useState<{ id: string; reading: SavedReading | null } | null>(null);
  const status = found?.id === id ? found.reading?.status : undefined;

  useEffect(() => {
    if (!ready || !user) return;
    let alive = true;
    let timer: number | null = null;

    const load = () =>
      getReading(id)
        .then((reading) => {
          if (!alive) return;
          setFound({ id, reading });
          if (reading?.status === 'running') timer = window.setTimeout(load, 4000);
        })
        .catch(() => alive && setFound({ id, reading: null }));
    void load();
    return () => {
      alive = false;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [id, ready, user, getReading]);

  const here = found?.id === id ? found : null;
  if (ready && !user) return <ArchiveList />;
  if (!here) {
    return (
      <Stage backdrop={ENTER.poster} night>
        <main id="main" className="rs-night rm-night ac-page">
          <p className="ac-wait" role="status">
            {ACCOUNT.people.loading}
          </p>
        </main>
      </Stage>
    );
  }
  const r = here.reading;
  if (!r) {
    return (
      <Stage backdrop={ENTER.poster} night>
        <main id="main" className="rs-night rm-night ac-page">
          <header className="ac-top">
            <Link href="/archive" className="ac-back">
              <ChevronLeftIcon size={20} />
              <span>{ACCOUNT.archive.back}</span>
            </Link>
          </header>
          <p className="ac-empty">{ACCOUNT.archive.notFound}</p>
        </main>
      </Stage>
    );
  }
  if (status === 'running' || status === 'error') {
    const A = ACCOUNT.archive;
    const running = status === 'running';
    return (
      <Stage backdrop={ENTER.poster} night>
        <main id="main" className="rs-night rm-night ac-page">
          <header className="ac-top">
            <Link href="/archive" className="ac-back">
              <ChevronLeftIcon size={20} />
              <span>{A.back}</span>
            </Link>
            <LanguagePicker />
          </header>
          <div className="ac-page__head" role="status" aria-live="polite">
            <h1 className="ac-page__title">{running ? A.writingTitle : A.failedTitle}</h1>
            <p className="ac-page__lead">{kindTitle(r)}</p>
            <p className="ac-page__lead">{running ? A.writingNote : A.failedNote}</p>
          </div>
          {running ? null : (
            <button
              type="button"
              className="dg-btn dg-btn--quiet"
              onClick={() => {
                void deleteReading(r.id).then(() => window.location.assign('/archive'), () => undefined);
              }}
            >
              {A.remove}
            </button>
          )}
        </main>
      </Stage>
    );
  }
  if (isProductKey(r.kind)) return <SavedRoomReading reading={r} room={r.kind} />;
  return <ResultView answers={answersFromSaved(r.people, r.concern, r.question)} nowIso={r.nowIso} archived readingId={r.id} backHref="/archive" />;
}
