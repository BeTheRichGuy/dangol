'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ABOUT_MEDIA } from '@/content/about';
import { LEGAL, isDraftHeading, legalSectionIds, type LegalKey } from '@/content/legal';
import { useLocale } from '@/components/locale-provider';
import { UI } from '@/content/ui';
import { BusinessInfo } from '@/components/business-info';

export type LegalPath = '/about' | '/wont-read' | '/privacy' | '/terms' | '/refund' | '/pricing';

function Paragraphs({ body }: { body: string[] }) {
  return (
    <div className="mt-3 space-y-4 text-[1.0625rem] leading-[1.75] text-ink">
      {body.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  );
}

export function LegalDocument({
  legalKey,
  path,
  portrait = false,
}: {
  legalKey: LegalKey;
  path: LegalPath;

  portrait?: boolean;
}) {
  useLocale();
  const doc = LEGAL[legalKey];
  const ids = legalSectionIds(doc.sections);
  const nav: { href: LegalPath; label: string }[] = [
    { href: '/about', label: UI.common.links.about },
    { href: '/pricing', label: UI.common.links.pricing },
    { href: '/wont-read', label: UI.common.wontReadLink },
    { href: '/privacy', label: UI.common.links.privacy },
    { href: '/terms', label: UI.common.links.terms },
    { href: '/refund', label: UI.common.links.refund },
  ];

  return (
    <div className="relative isolate min-h-dvh overflow-x-clip bg-paper font-sans text-ink">
      {}
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
          <Link
            href="/"
            aria-label={UI.brand.homeLabel}
            className="inline-flex min-h-11 items-center gap-2.5 rounded-md"
          >
            <span className="font-display text-[1.375rem] font-semibold tracking-[0.28em]">{UI.brand.name}</span>
            <span aria-hidden="true" className="font-brush text-[1.625rem] leading-none">
              {UI.brand.hangul}
            </span>
          </Link>
        </header>

        <main id="main" className="mt-8">
          <article>
            <h1 className="font-display text-[2.5rem] font-medium leading-[1.08] tracking-[-0.01em] sm:text-5xl">
              {doc.title}
            </h1>
            <p className="mt-3 text-sm text-ink-soft">{UI.prose.updated(doc.updated)}</p>

            {portrait ? (
              <figure className="relative mt-8 aspect-[3/4] w-full max-w-[20rem] overflow-hidden rounded-[var(--r-lg)] border border-[var(--gold-line)] shadow-[var(--shadow-glass)]">
                {}
                <Image
                  src="/media/clips/yul-master-v2.jpg"
                  alt={ABOUT_MEDIA.portraitAlt}
                  fill
                  sizes="(max-width: 640px) 90vw, 320px"
                  className="object-cover object-[50%_12%]"
                />
              </figure>
            ) : null}

            <div className="mt-10 space-y-10">
              {doc.sections.map((section, i) =>
                isDraftHeading(section.heading) ? (
                  <aside
                    key={ids[i]}
                    aria-labelledby={ids[i]}
                    className="rounded-[var(--r-lg)] border border-[var(--gold-line)] bg-[var(--haze-strong)] px-5 py-4"
                  >
                    <h2 id={ids[i]} className="text-xs font-semibold uppercase tracking-[0.16em] text-ink">
                      {section.heading}
                    </h2>
                    <div className="mt-2 space-y-3 text-[0.9375rem] leading-[1.65] text-ink">
                      {section.body.map((text, j) => (
                        <p key={j}>{text}</p>
                      ))}
                    </div>
                  </aside>
                ) : (
                  <section key={ids[i]} aria-labelledby={ids[i]}>
                    <h2
                      id={ids[i]}
                      className="scroll-mt-6 font-display text-[1.75rem] font-semibold leading-[1.2]"
                    >
                      {section.heading}
                    </h2>
                    <Paragraphs body={section.body} />
                  </section>
                ),
              )}
            </div>
          </article>
        </main>

        <footer className="mt-16 border-t border-[var(--gold-line)] pt-5">
          <nav aria-label={UI.brand.name}>
            <ul className="-mx-1 flex flex-wrap">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.href === path ? 'page' : undefined}
                    className={`inline-flex min-h-11 items-center rounded-md px-1 pr-4 text-[0.9375rem] underline-offset-4 hover:underline ${
                      item.href === path ? 'font-semibold text-ink' : 'text-ink-soft'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {UI.common.disclosure ? <p className="mt-3 text-sm leading-relaxed text-ink-soft">{UI.common.disclosure}</p> : null}
          <p className="mt-2">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center text-[0.9375rem] font-medium text-jade underline underline-offset-4"
            >
              {UI.prose.backHome}
            </Link>
          </p>
          <BusinessInfo className="mt-4" />
        </footer>
      </div>
    </div>
  );
}
