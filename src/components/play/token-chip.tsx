'use client';

import { CHAT } from '@/content/chat';
import { useLanterns } from '../chat/use-lanterns';
import { useLocale } from '../locale-provider';
import { LanternIcon } from './play-icons';

export function TokenChip() {
  useLocale();
  const { balance } = useLanterns();
  return (
    <span className="sg-chip" aria-label={`${CHAT.wallet.label} ${balance}`}>
      <LanternIcon className="sg-chip__lamp" />
      <span className="sg-chip__label">{CHAT.wallet.label}</span>
      <strong className="sg-chip__n" data-testid="token-balance">
        {CHAT.wallet.count(balance)}
      </strong>
    </span>
  );
}
