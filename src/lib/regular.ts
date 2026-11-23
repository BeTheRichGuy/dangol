export const RESERVED_REGULAR_NOS = [1, 2, 3] as const;

export const FIRST_REGULAR_NO = 5;

export const FOUNDING_REGULARS = 1000;

function assertWholeNumber(value: number, name: string, min: number): void {
  if (!Number.isSafeInteger(value) || value < min) {
    throw new RangeError(`${name} must be a safe integer >= ${min}`);
  }
}

export function hasFour(no: number): boolean {
  return String(Math.abs(Math.trunc(no))).includes('4');
}

export function isValidRegularNo(no: number): boolean {
  return Number.isSafeInteger(no) && no >= 1 && !hasFour(no);
}

export function isHumanRegularNo(no: number): boolean {
  return isValidRegularNo(no) && no >= FIRST_REGULAR_NO;
}

export function nextRegularNo(lastIssued: number): number {
  assertWholeNumber(lastIssued, 'lastIssued', 0);
  const candidate = Math.max(lastIssued, FIRST_REGULAR_NO - 1) + 1;
  const digits = String(candidate);
  const firstFour = digits.indexOf('4');
  if (firstFour === -1) return candidate;

  const skipped = digits.slice(0, firstFour) + '5' + '0'.repeat(digits.length - firstFour - 1);
  return Number(skipped);
}

export function formatRegularNo(no: number): string {
  assertWholeNumber(no, 'no', 1);
  return String(no).padStart(4, '0');
}

export function regularOrdinal(no: number, limit = Infinity): number | null {
  if (!isHumanRegularNo(no)) return null;
  let current = FIRST_REGULAR_NO;
  let ordinal = 1;
  while (current < no) {
    current = nextRegularNo(current);
    ordinal += 1;
    if (ordinal > limit) return null;
  }
  return ordinal;
}

export function isFoundingRegular(no: number): boolean {
  return regularOrdinal(no, FOUNDING_REGULARS) !== null;
}
