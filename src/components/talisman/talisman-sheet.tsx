'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { TALISMAN } from '@/content/talisman';
import type { TalismanId } from '@/lib/talisman';
import { talismanImageUrl } from '@/lib/talisman/art';
import { CloseIcon, DownloadIcon } from '../icons';
import './talisman.css';

export function TalismanSheet({ id, onClose, reason }: { id: TalismanId; onClose: () => void; reason?: string }) {
  const S = TALISMAN.sheet;
  const item = TALISMAN.items[id];
  const closeRef = useRef<HTMLButtonElement>(null);

  const closeNow = useRef(onClose);
  useEffect(() => {
    closeNow.current = onClose;
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

  return (
    <div className="tl-sheet" role="presentation" onClick={onClose}>
      <div className="tl-sheet__card" role="dialog" aria-modal="true" aria-label={item.name} onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="tl-sheet__close" aria-label={S.close} onClick={onClose}>
          <CloseIcon size={22} />
        </button>
        <Image src={talismanImageUrl(id, { width: 768 })} alt={item.name} width={768} height={1152} unoptimized priority className="tl-sheet__img" />
        {reason ? <p className="tl-sheet__reason">{reason}</p> : null}
        <h2 className="tl-sheet__name">{item.name}</h2>
        <p className="tl-sheet__line">{item.line}</p>
        <a href={talismanImageUrl(id, { download: true })} download className="dg-btn dg-btn--primary tl-sheet__save">
          <DownloadIcon size={18} />
          <span>{S.save}</span>
        </a>
        <p className="tl-sheet__note">{S.note}</p>
      </div>
    </div>
  );
}
