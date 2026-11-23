import type { AccountValue } from '../account/account-provider';
import type { ReadingDraft } from '@/lib/account/types';
import type { JobIO } from './use-room-reading';

export function jobIO(account: Pick<AccountValue, 'startReading' | 'jobStates' | 'deleteReading'>, draft: Omit<ReadingDraft, 'body'>): JobIO {
  return {
    create: async () => (await account.startReading({ ...draft, body: null })).id,
    poll: async (id) => (await account.jobStates([id]))[0] ?? null,
    discard: (id) => account.deleteReading(id),
  };
}
