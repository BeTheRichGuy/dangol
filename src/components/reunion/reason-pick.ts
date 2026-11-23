import { REASONS_MAX, type ReasonId } from '@/lib/reunion/intake';

export function toggleReason(current: readonly ReasonId[], id: ReasonId): ReasonId[] {
  if (current.includes(id)) return current.filter((r) => r !== id);
  if (id === 'unsure') return ['unsure'];
  const rest = current.filter((r) => r !== 'unsure');
  if (rest.length >= REASONS_MAX) return rest;
  return [...rest, id];
}

export function canPickReason(current: readonly ReasonId[], id: ReasonId): boolean {
  return id === 'unsure' || current.includes(id) || current.filter((r) => r !== 'unsure').length < REASONS_MAX;
}
