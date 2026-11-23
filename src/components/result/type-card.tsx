import type { Chart } from '@/lib/saju';
import type { TypeProfile } from '@/lib/reading/types';
import { PillarsLine } from './pillars';

export function TypeCard({
  profile,
  chart,
  className = '',
}: {
  profile: TypeProfile;

  chart?: Chart;
  className?: string;
}) {
  return (
    <article
      className={`dg-glass dg-glass--strong relative overflow-hidden px-5 pb-5 pt-6 ${className}`}
      style={{ borderColor: profile.accent }}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 block h-1.5" style={{ background: profile.accent }} />
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="t-display text-[2.5rem]">{profile.name}</h2>
        <span className="t-hanja text-[1.75rem] leading-none text-ink" aria-label={profile.hanzi}>
          {profile.hanzi}
        </span>
      </div>
      <p className="t-verdict mt-3 text-[1.4375rem]">{profile.identity}</p>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{profile.inLove}</p>
      {chart ? <PillarsLine chart={chart} accent={profile.accent} /> : null}
    </article>
  );
}
