'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { UI } from '@/content/ui';
import { track } from '@/lib/analytics/track';
import { CloseIcon, DownloadIcon, ShareIcon } from '../icons';
import { useLocale } from '../locale-provider';
import './card-save.css';

const PAD = 20;
const FOOT = 36;

const BG = 'linear-gradient(180deg, rgb(20, 16, 24), #1a1f35)';

function pageBackground(node: HTMLElement): string {
  for (let p = node.parentElement; p; p = p.parentElement) {
    const c = getComputedStyle(p).backgroundColor;
    if (c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c)) return c;
  }
  return BG;
}

type Shot = { url: string; file: File };

function keep(node: Node): boolean {
  return !(node instanceof HTMLElement && node.dataset.cardSaveSkip !== undefined);
}

function footer(text: string): HTMLElement {
  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, {
    height: `${FOOT}px`,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    font: '600 12px/1 ui-serif, Georgia, serif',
    letterSpacing: '0.28em',
    color: 'rgba(246, 201, 139, 0.85)',
  });
  return el;
}

function markSkipped(node: HTMLElement): { height: number; unmark: () => void } {
  let height = 0;
  const marked = new Set<HTMLElement>();
  node.querySelectorAll<HTMLElement>('[data-card-save-skip]').forEach((el) => {
    const gap = el.parentElement ? parseFloat(getComputedStyle(el.parentElement).rowGap) || 0 : 0;
    height += el.getBoundingClientRect().height + gap;
    for (let p = el.parentElement; p && p !== node; p = p.parentElement) marked.add(p);
  });
  marked.forEach((el) => el.setAttribute('data-card-save-auto', ''));
  return { height, unmark: () => marked.forEach((el) => el.removeAttribute('data-card-save-auto')) };
}

function tidy(cloned: Node) {
  if (!(cloned instanceof HTMLElement)) return;
  if (cloned.hasAttribute('data-card-save-auto')) {

    cloned.style.height = 'auto';
    cloned.style.blockSize = 'auto';
    cloned.style.gridTemplateRows = 'none';
  }
  if (cloned.style.backgroundImage.includes('feTurbulence')) cloned.style.backgroundImage = 'none';

  cloned.style.animation = 'none';
  cloned.style.transition = 'none';
}

async function capture(node: HTMLElement, foot: string): Promise<Blob> {
  const { domToBlob } = await import('modern-screenshot');
  const { width, height } = node.getBoundingClientRect();
  const skipped = markSkipped(node);
  const w = Math.ceil(width) + PAD * 2;
  const h = Math.ceil(height - skipped.height) + PAD * 2 + FOOT;
  const blob = await domToBlob(node, {
    width: w,
    height: h,
    scale: 2,
    type: 'image/png',
    filter: keep,
    style: {
      boxSizing: 'border-box',

      display: 'block',
      width: `${w}px`,
      height: `${h}px`,
      padding: `${PAD}px`,
      margin: '0',
      background: pageBackground(node),
    },
    onCloneEachNode: tidy,
    onCloneNode: (cloned) => {
      if (cloned instanceof HTMLElement) cloned.appendChild(footer(foot));
    },
  }).finally(skipped.unmark);
  if (!blob) throw new Error('empty');
  return blob;
}

export function CardSave({ name, children }: { name: string; children: ReactNode }) {
  useLocale();
  const S = UI.cardSave;
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'making' | 'failed'>('idle');
  const [shot, setShot] = useState<Shot | null>(null);

  useEffect(() => {
    return () => {
      if (shot) URL.revokeObjectURL(shot.url);
    };
  }, [shot]);

  async function make() {
    const node = ref.current;
    if (!node || state === 'making') return;
    setState('making');
    try {
      const blob = await capture(node, S.footer);
      const file = new File([blob], `dangol-${name}.png`, { type: 'image/png' });
      setShot({ url: URL.createObjectURL(blob), file });
      setState('idle');
      track('card_save', { card: name, act: 'make' });
    } catch {
      setState('failed');
    }
  }

  return (
    <div className="cs">
      <div ref={ref} className="cs__frame">
        {children}
      </div>
      <div className="cs__row" data-card-save-skip="">
        <button type="button" className="cs__btn" onClick={make} disabled={state === 'making'} aria-busy={state === 'making'}>
          <DownloadIcon size={15} />
          <span>{state === 'making' ? S.making : S.button}</span>
        </button>
        {state === 'failed' ? (
          <p className="cs__fail" role="status">
            {S.failed}
          </p>
        ) : null}
      </div>
      {shot ? <CardSaveSheet shot={shot} name={name} onClose={() => setShot(null)} /> : null}
    </div>
  );
}

function CardSaveSheet({ shot, name, onClose }: { shot: Shot; name: string; onClose: () => void }) {
  const S = UI.cardSave;
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeNow = useRef(onClose);
  useEffect(() => {
    closeNow.current = onClose;
  });
  const [canShare] = useState(() => {
    try {
      return typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [shot.file] });
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNow.current();
    };
    window.addEventListener('keydown', onKey);
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = before;
      opener?.focus?.();
    };
  }, []);

  async function share() {
    try {
      await navigator.share({ files: [shot.file] });
      track('card_save', { card: name, act: 'share' });
    } catch {

    }
  }

  return (
    <div className="cs-sheet" role="presentation" onClick={onClose}>
      <div className="cs-sheet__card" role="dialog" aria-modal="true" aria-label={S.title} onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="cs-sheet__close" aria-label={S.close} onClick={onClose}>
          <CloseIcon size={22} />
        </button>
        <p className="cs-sheet__title">{S.title}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- 이 브라우저에서 만든 blob 그림이라 next/image 를 거치지 않는다 */}
        <img src={shot.url} alt={S.title} className="cs-sheet__img" />
        <div className="cs-sheet__btns">
          {canShare ? (
            <button type="button" className="dg-btn dg-btn--primary cs-sheet__btn" onClick={share}>
              <ShareIcon size={18} />
              <span>{S.share}</span>
            </button>
          ) : null}
          <a
            href={shot.url}
            download={shot.file.name}
            className={`dg-btn ${canShare ? 'dg-btn--glass' : 'dg-btn--primary'} cs-sheet__btn`}
            onClick={() => track('card_save', { card: name, act: 'download' })}
          >
            <DownloadIcon size={18} />
            <span>{S.download}</span>
          </a>
        </div>
        <p className="cs-sheet__hint">{S.hint}</p>
      </div>
    </div>
  );
}
