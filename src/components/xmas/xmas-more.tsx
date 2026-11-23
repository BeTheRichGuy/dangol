'use client';

import Image from 'next/image';
import { BUSINESS } from '@/content/business';
import { XMAS_FLOW } from '@/content/xmas';
import { useSeen } from '../webtoon/use-seen';

const M = XMAS_FLOW.result.more;

function Reveal({ className, children, label }: { className: string; children: React.ReactNode; label?: string }) {
  const [ref, seen] = useSeen<HTMLElement>({ threshold: 0.2 });
  return (
    <section ref={ref} className={`xr-more ${className}`} data-seen={seen ? '' : undefined} aria-label={label}>
      {children}
    </section>
  );
}

export function XmasSample({ onPay, payNote }: { onPay: () => void; payNote: string | null }) {
  return (
    <Reveal className="xr-sample" label={M.sample.title}>
      <p className="xr-more__over">{M.sample.over}</p>
      <h2>{M.sample.title}</h2>
      <article className="xr-sample__card">
        <span className="xr-sample__art">
          <Image src={M.sample.art} alt="" fill sizes="(min-width: 480px) 420px, 90vw" />
        </span>
        <p className="xr-sample__ch">{M.sample.chapter}</p>
        <p className="xr-sample__lead">{M.sample.lead}</p>
        <blockquote>{M.sample.quote}</blockquote>
        <p className="xr-sample__body">{M.sample.body}</p>
        <ul className="xr-sample__asks">
          {M.sample.asks.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </article>
      <p className="xr-more__note">{M.sample.note}</p>
      <button type="button" className="xr-locked__button xr-sample__go" onClick={onPay}>
        {M.sample.button}
      </button>
      {payNote ? <p className="xr-paynote">{payNote}</p> : null}
    </Reveal>
  );
}

export function XmasMore({ daysLeft, onPay, price, payNote }: { daysLeft: number | null; onPay: () => void; price: string; payNote: string | null }) {
  return (
    <>
      <Reveal className="xr-compare" label={M.compare.title}>
        <h2>{M.compare.title}</h2>
        <table>
          <thead>
            <tr>
              {M.compare.cols.map((c, i) => (
                <th key={i} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {M.compare.rows.map(([k, free, paid]) => (
              <tr key={k}>
                <th scope="row">{k}</th>
                <td>{free}</td>
                <td>{paid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>

      <Reveal className="xr-engine" label={M.engine.over}>
        <p className="xr-more__over">{M.engine.over}</p>
        <h2>{M.engine.title}</h2>
        {M.engine.by ? <p className="xr-engine__by">{M.engine.by}</p> : null}
        {M.engine.advisor ? <p className="xr-engine__by">{M.engine.advisor}</p> : null}
        <ol>
          {M.engine.steps.map((s, i) => (
            <li key={s.k} style={{ '--i': i } as React.CSSProperties}>
              <span>{s.k}</span>
              <b>{s.title}</b>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="xr-more__note">{M.engine.foot}</p>
      </Reveal>

      <Reveal className="xr-urge" label={M.urge.title}>
        <h2>{M.urge.title}</h2>
        <ul>
          {M.urge.lines.map((line, i) => (
            <li key={line} style={{ '--i': i } as React.CSSProperties}>
              {line}
            </li>
          ))}
        </ul>
        <p className="xr-urge__close">{M.urge.close}</p>
        <button type="button" className="xr-locked__button" onClick={onPay}>
          {M.urge.button}
        </button>
        {payNote ? <p className="xr-paynote">{payNote}</p> : null}
      </Reveal>

      {daysLeft !== null && daysLeft > 0 ? (
        <Reveal className="xr-timing" label={M.timing.title.replace('{n}', String(daysLeft))}>
          <h2>{daysLeft === 1 ? M.timing.today : M.timing.title.replace('{n}', String(daysLeft))}</h2>
          <p>{M.timing.text}</p>
        </Reveal>
      ) : null}

      <Reveal className="xr-faq" label={M.faq.title}>
        <h2>{M.faq.title}</h2>
        {M.faq.items.map((it) => (
          <details key={it.q}>
            <summary>{it.q}</summary>
            <p>{it.a.replace('{email}', BUSINESS.email)}</p>
          </details>
        ))}
      </Reveal>

      <Reveal className="xr-final" label={M.final.button}>
        <h2>{M.final.title}</h2>
        <button type="button" className="xr-locked__button" onClick={onPay}>
          {M.final.button}
          <span>{price}</span>
        </button>
        {payNote ? <p className="xr-paynote">{payNote}</p> : null}
      </Reveal>
    </>
  );
}
