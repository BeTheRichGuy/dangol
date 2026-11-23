import Image from 'next/image';
import Link from 'next/link';
import { landingCopy } from '@/content/landing-by-locale';
import type { Locale } from '@/content/locale';
import { ENTER } from '@/components/scene/manifest';
import { dealText } from '@/components/rooms/price-deal';
import { ActivateLocale } from './activate-locale';

export function LocaleLanding({ locale }: { locale: Exclude<Locale, 'en'> }) {
  const c = landingCopy(locale);
  const start = `/?l=${locale}`;
  return (
    <div lang={locale} className="relative isolate min-h-dvh overflow-x-clip bg-paper font-sans text-ink">
      <ActivateLocale locale={locale} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px]"
        style={{
          backgroundImage:
            'radial-gradient(70% 90% at 50% 0%, color-mix(in srgb, var(--glow) 34%, transparent), transparent), radial-gradient(45% 55% at 100% 22%, color-mix(in srgb, var(--blush) 40%, transparent), transparent)',
        }}
      />
      <div className="mx-auto w-full max-w-[38rem] px-5 pb-20 pt-4 sm:px-6">
        <header>
          <Link href={start} aria-label={c.brand} className="inline-flex min-h-11 items-center gap-2.5 rounded-md">
            <span className="font-display text-[1.375rem] font-semibold tracking-[0.28em]">{c.brand}</span>
            <span aria-hidden="true" className="font-brush text-[1.625rem] leading-none">
              {c.hangul}
            </span>
          </Link>
        </header>

        <main id="main" className="mt-8">
          <h1 className="font-display text-[2.25rem] font-medium leading-[1.2] tracking-[-0.01em] sm:text-[2.75rem]">{c.title}</h1>
          <p className="mt-4 text-[1.0625rem] leading-[1.75] text-ink">{c.description}</p>

          <figure className="relative mt-8 aspect-[4/3] w-full overflow-hidden rounded-[var(--r-lg)] border border-[var(--gold-line)] shadow-[var(--shadow-glass)]">
            <Image src={ENTER.poster} alt={c.posterAlt} fill priority sizes="(max-width: 640px) 90vw, 608px" className="object-cover object-[50%_70%]" />
          </figure>

          <p className="mt-8">
            <Link href={start} className="dg-btn dg-btn--primary">
              {c.cta}
            </Link>
          </p>

          <section aria-labelledby="landing-how" className="mt-14">
            <h2 id="landing-how" className="font-display text-[1.75rem] font-semibold leading-[1.2]">
              {c.howHeading}
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-6 text-[1.0625rem] leading-[1.75] text-ink">
              {c.how.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="landing-rooms" className="mt-14">
            <h2 id="landing-rooms" className="font-display text-[1.75rem] font-semibold leading-[1.2]">
              {c.roomsHeading}
            </h2>
            <p className="mt-3 text-[1.0625rem] leading-[1.75] text-ink">{dealText(c.roomsSub, c.roomsPrice.now, c.roomsPrice.now, c.roomsPrice.was, c.roomsPrice.wasSr)}</p>
            <ul className="mt-5 space-y-5">
              {c.rooms.map((room) => (
                <li key={room.key}>
                  <h3 className="font-display text-[1.25rem] font-semibold">{room.title}</h3>
                  <p className="mt-1 text-[1rem] leading-[1.7] text-ink-soft">{room.question}</p>
                  <p className="mt-1 text-[1rem] leading-[1.7] text-ink">{room.gain}</p>
                </li>
              ))}
            </ul>
          </section>

          {c.about.sections.map((section) => (
            <section key={section.heading} className="mt-14">
              <h2 className="font-display text-[1.75rem] font-semibold leading-[1.2]">{section.heading}</h2>
              <div className="mt-3 space-y-4 text-[1.0625rem] leading-[1.75] text-ink">
                {section.body.map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </div>
            </section>
          ))}

          <p className="mt-12">
            <Link href={start} className="dg-btn dg-btn--primary">
              {c.cta}
            </Link>
          </p>
        </main>

        <nav aria-label={c.brand} className="mt-14 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
          {c.links.map((l) => (
            <Link key={l.href} href={l.href} className="underline-offset-2 hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
