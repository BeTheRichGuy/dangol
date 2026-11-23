import { ledgerConfig, rpc, type LedgerConfig } from '../payments/ledger';

export interface EarnResult {

  granted: number;
  balance: number;
}

export interface Standing {
  balance: number;

  checkedIn: boolean;
}

export interface Lanterns {

  balance(uid: string): Promise<Standing | null>;

  checkin(uid: string, n: number): Promise<EarnResult | null>;

  earn(uid: string, order: string, lit: number, paid: boolean): Promise<EarnResult | null>;

  spend(uid: string, n: number): Promise<number | 'short' | null>;

  give(uid: string, n: number): Promise<number | null>;

  bundleGrant(order: string, n: number): Promise<BundleGrant | null>;
}

export interface BundleGrant {
  granted: number;

  balance: number | null;
  reason: 'already' | 'no_order' | 'refunded' | 'not_bundle' | 'guest' | null;
}

const int = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) ? v : null);

export function lanternsOf(cfg: LedgerConfig, fetcher: typeof fetch = fetch): Lanterns {
  return {
    async balance(uid) {
      const r = await rpc(cfg, 'lantern_balance', { p_uid: uid }, fetcher);
      if (!r.ok || !r.value || typeof r.value !== 'object') return null;
      const v = r.value as Record<string, unknown>;
      const balance = int(v.balance);
      return balance === null || typeof v.checked_in !== 'boolean' ? null : { balance, checkedIn: v.checked_in };
    },
    async checkin(uid, n) {
      const r = await rpc(cfg, 'lantern_checkin', { p_uid: uid, p_n: n }, fetcher);
      if (!r.ok || !r.value || typeof r.value !== 'object') return null;
      const v = r.value as Record<string, unknown>;
      const granted = int(v.granted);
      const balance = int(v.balance);
      return granted === null || balance === null ? null : { granted, balance };
    },
    async earn(uid, order, lit, paid) {
      const r = await rpc(cfg, 'lantern_earn', { p_uid: uid, p_order: order, p_lit: lit, p_paid: paid }, fetcher);
      if (!r.ok || !r.value || typeof r.value !== 'object') return null;
      const v = r.value as Record<string, unknown>;
      const granted = int(v.granted);
      const balance = int(v.balance);
      return granted === null || balance === null ? null : { granted, balance };
    },
    async spend(uid, n) {
      const r = await rpc(cfg, 'lantern_spend', { p_uid: uid, p_n: n }, fetcher);
      if (!r.ok) return null;
      const v = int(r.value);
      return v === null ? null : v < 0 ? 'short' : v;
    },
    async give(uid, n) {
      const r = await rpc(cfg, 'lantern_give', { p_uid: uid, p_n: n }, fetcher);
      return r.ok ? int(r.value) : null;
    },
    async bundleGrant(order, n) {
      const r = await rpc(cfg, 'bundle_lantern_grant', { p_order: order, p_n: n }, fetcher);
      if (!r.ok || !r.value || typeof r.value !== 'object') return null;
      const v = r.value as Record<string, unknown>;
      const granted = int(v.granted);
      if (granted === null) return null;
      const reasons = ['already', 'no_order', 'refunded', 'not_bundle', 'guest'] as const;
      return { granted, balance: int(v.balance), reason: reasons.find((x) => x === v.reason) ?? null };
    },
  };
}

export function makeLanterns(env: Record<string, string | undefined>, fetcher: typeof fetch = fetch): Lanterns | undefined {
  const cfg = ledgerConfig(env);
  return cfg ? lanternsOf(cfg, fetcher) : undefined;
}
