'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { XMAS_FLOW } from '@/content/xmas';
import { XMAS_HOOKS } from '@/content/xmas-hooks';
import { XMAS_QUIZ } from '@/content/ko/xmas-quiz';
import { XMAS_DEAL, XMAS_LIST, XMAS_RIVAL, xmasFraction, xmasOff } from '@/lib/xmas/product';
import type { XmasStage } from '@/lib/xmas/relation';
import { useLocale } from '../locale-provider';
import { XhFit } from './xmas-hooks';
import { daysToChristmas } from './xmas-landing';
import { XmasMore, XmasSample } from './xmas-more';

const R = XMAS_FLOW.result;
const HK = XMAS_HOOKS;

const THIRD_ART = '/media/xmas/paid2/04b-yeon-point.jpg';

export function formatLeft(ms: number): string {
  const left = Math.max(0, ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  const sec = Math.floor(left / 1000);
  return `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`;
}

export function Countdown({ until, onEnd }: { until: number; onEnd: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const left = until - Date.now();
      if (ref.current) ref.current.textContent = formatLeft(left);
      if (left <= 0) return onEnd();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [until, onEnd]);
  return (
    <span ref={ref} className="xr-timer">
      --:--:--
    </span>
  );
}

export function Mark({ at }: { at: string }) {
  return <div data-xsec={at} aria-hidden="true" />;
}

export type PitchPrice = { kind: 'offer'; until: number | null; ended: boolean; onEnd: () => void } | { kind: 'flat' };

export function XmasPitch({
  onPay,
  stage,
  sex,
  hasPartner,
  price,
}: {
  onPay: () => void;
  stage: XmasStage;
  sex: 'female' | 'male' | null;
  hasPartner: boolean;
  price: PitchPrice;
}) {
  const locale = useLocale();
  const DEAL = XMAS_DEAL[locale].text;
  const LIST = XMAS_LIST[locale].text;
  const rival = XMAS_RIVAL[locale];
  const fraction = xmasFraction(locale);
  const thirdTitle = R.third.title.replace('{n}', String(fraction));
  const flat = price.kind === 'flat';

  const deal = flat || (price.until !== null && !price.ended);

  const payNote = !flat && deal && R.locked.payNote ? R.locked.payNote.replace('{list}', LIST).replace('{deal}', DEAL) : null;

  const pairPeek = hasPartner ? R.peek.pair : R.peek.self;

  return (
    <>
      {}
      <Mark at="sample" />
      <XmasSample onPay={onPay} payNote={payNote} />

      {}
      <section className="xr-peek" aria-labelledby="xr-peek-t">
        <p className="xr-card__over">{R.peek.over}</p>
        <h2 id="xr-peek-t">{R.peek.title}</h2>
        <ul>
          <li data-main="">
            <i className="xr-peek__ring" aria-hidden="true" />
            <b>{R.peek.ask.hidden}</b>
            <span>{R.peek.ask.label}</span>
          </li>
          <li>
            <b>
              <em>{R.peek.first.hidden}</em>
            </b>
            <span>{R.peek.first.label}</span>
          </li>
          <li>
            <b>
              <em>{pairPeek.hidden}</em>
            </b>
            <span>{pairPeek.label}</span>
          </li>
          <li>
            <b>
              <em>{R.peek.avoid.hidden}</em>
            </b>
            <span>{R.peek.avoid.label}</span>
          </li>
          <li>
            <b>
              <em>?</em>
            </b>
            <span>
              {R.peek.eve.label}
              <small>{R.peek.eve.hidden}</small>
            </span>
          </li>
        </ul>
        <p className="xr-peek__lock">{R.peek.lock}</p>
      </section>

      {}
      <section className="xr-preview" aria-label={R.preview.title}>
        <p>{R.preview.title}</p>
        <div className="xr-preview__panels">
          {R.preview.art.map((a) => (
            <figure key={a.src} className="xr-preview__panel">
              <span className="xr-preview__art">
                <Image src={a.src.replace('{me}', sex === 'male' ? '' : '-f')} alt="" fill sizes="(min-width: 480px) 400px, 86vw" />
              </span>
              <span className={a.kind === 'say' ? 'xr-preview__say' : 'xr-preview__note'}>{a.line}</span>
              <figcaption>{HK.fit.ch.replace('{n}', String(a.ch))}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {}
      <XhFit stage={stage} />

      <section className="xr-locked">
        <p className="xr-locked__over">{R.locked.over}</p>
        <h2>{R.locked.title}</h2>
        <ul>
          {R.locked.items.map((item) => (
            <li key={item.title}>
              <i>{item.term}</i>
              <b>{item.title}</b>
              <span aria-hidden="true">{item.teaser}</span>
            </li>
          ))}
        </ul>

        {}
        <div className="xr-stack">
          <p>{R.stack.title}</p>
          <ul>
            {R.stack.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {}
        {deal && rival && fraction && R.third.title ? (
          <section className="xr-third" aria-label={thirdTitle.replace('\n', ' ')}>
            <figure className="xr-third__panel">
              <span className="xr-third__art">
                <Image src={THIRD_ART} alt="" fill sizes="(min-width: 480px) 400px, 86vw" />
              </span>
              <span className="xr-third__say">{R.third.say}</span>
            </figure>
            <h3 className="xr-third__title">{thirdTitle}</h3>
            <div className="xr-third__vs">
              <p>
                <span>{R.third.other}</span>
                <s>{rival.text}</s>
              </p>
              <p>
                <span>{R.third.ours}</span>
                <strong>{DEAL}</strong>
              </p>
            </div>
            <p className="xr-third__note">{R.third.note}</p>
          </section>
        ) : null}
        <Mark at="price" />
        <div className="xr-price" data-deal={deal ? '' : undefined}>
          {price.kind === 'flat' ? (
            <>
              {}
              <p className="xr-price__badge">{XMAS_QUIZ.result.price.badge}</p>
              <div className="xr-price__row">
                <strong>{DEAL}</strong>
              </div>
            </>
          ) : deal && price.until !== null ? (
            <>
              <p className="xr-price__badge">{R.locked.deal.badge}</p>
              {}
              <div className="xr-price__row">
                <s>
                  <span className="sr-only">{R.locked.deal.list} </span>
                  {LIST}
                </s>
                <strong>{DEAL}</strong>
                <em>{R.locked.deal.off.replace('{n}', String(xmasOff(locale)))}</em>
              </div>
              <p className="xr-price__timer">
                {R.locked.deal.timer} <Countdown until={price.until} onEnd={price.onEnd} />
              </p>
            </>
          ) : (
            <>
              <div className="xr-price__row">
                <strong>{LIST}</strong>
              </div>
              {price.ended ? <p className="xr-price__ended">{R.locked.deal.ended}</p> : null}
            </>
          )}
        </div>
        <button type="button" className="xr-locked__button" onClick={onPay}>
          {R.locked.button}
        </button>
        {payNote ? <p className="xr-paynote">{payNote}</p> : null}
        <p className="xr-locked__note">{R.locked.note}</p>
        <ul className="xr-trust">
          {R.locked.trust.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      {}
      <Mark at="more" />
      <XmasMore daysLeft={daysToChristmas(new Date())} onPay={onPay} price={deal ? DEAL : LIST} payNote={payNote} />
      <Mark at="end" />
    </>
  );
}
