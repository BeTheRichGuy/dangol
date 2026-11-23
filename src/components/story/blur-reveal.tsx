import { Fragment, type CSSProperties } from 'react';

export function BlurReveal({ text, step = 32 }: { text: string;  step?: number }) {
  let i = 0;
  return (
    <span className="sd-reveal" aria-label={text} role="text">
      {text.split('\n').map((line, li) => (
        <Fragment key={li}>
          {li > 0 ? <br /> : null}
          {Array.from(line).map((ch, ci) => (
            <span key={ci} aria-hidden="true" style={{ '--d': `${(i++) * step}ms` } as CSSProperties}>
              {ch}
            </span>
          ))}
        </Fragment>
      ))}
    </span>
  );
}
