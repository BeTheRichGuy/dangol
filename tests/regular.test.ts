import { describe, expect, it } from 'vitest';
import {
  FIRST_REGULAR_NO,
  FOUNDING_REGULARS,
  RESERVED_REGULAR_NOS,
  formatRegularNo,
  hasFour,
  isFoundingRegular,
  isHumanRegularNo,
  isValidRegularNo,
  nextRegularNo,
  regularOrdinal,
} from '../src/lib/regular';

function bruteForceNext(last: number): number {
  let n = Math.max(last, 4) + 1;
  while (String(n).includes('4')) n += 1;
  return n;
}

describe('nextRegularNo', () => {
  it('reserves 1 to 3 and hands the first person No. 5', () => {
    expect(RESERVED_REGULAR_NOS).toEqual([1, 2, 3]);
    expect(FIRST_REGULAR_NO).toBe(5);
    expect(nextRegularNo(0)).toBe(5);

    expect(nextRegularNo(1)).toBe(5);
    expect(nextRegularNo(2)).toBe(5);
    expect(nextRegularNo(3)).toBe(5);
    expect(nextRegularNo(4)).toBe(5);
  });

  it('counts up one by one when there is no 4 in the way', () => {
    expect(nextRegularNo(5)).toBe(6);
    expect(nextRegularNo(8)).toBe(9);
    expect(nextRegularNo(9)).toBe(10);
    expect(nextRegularNo(12)).toBe(13);
  });

  it('skips every number that contains a 4', () => {
    expect(nextRegularNo(13)).toBe(15);
    expect(nextRegularNo(23)).toBe(25);
    expect(nextRegularNo(39)).toBe(50);
    expect(nextRegularNo(49)).toBe(50);
    expect(nextRegularNo(99)).toBe(100);
    expect(nextRegularNo(103)).toBe(105);
    expect(nextRegularNo(139)).toBe(150);
    expect(nextRegularNo(399)).toBe(500);
    expect(nextRegularNo(3999)).toBe(5000);
    expect(nextRegularNo(13999)).toBe(15000);
  });

  it('never issues a number with a 4, and always increases (first 5,000 issued)', () => {
    let last = 0;
    for (let i = 0; i < 5000; i += 1) {
      const next = nextRegularNo(last);
      expect(String(next)).not.toContain('4');
      expect(next).toBeGreaterThan(last);
      last = next;
    }
  });

  it('agrees with a brute-force scan for every starting point up to 20,000', () => {
    for (let last = 0; last <= 20000; last += 1) {
      expect(nextRegularNo(last)).toBe(bruteForceNext(last));
    }
  });

  it('rejects values that are not whole numbers >= 0', () => {
    expect(() => nextRegularNo(-1)).toThrow(RangeError);
    expect(() => nextRegularNo(1.5)).toThrow(RangeError);
    expect(() => nextRegularNo(Number.NaN)).toThrow(RangeError);
    expect(() => nextRegularNo(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('formatRegularNo', () => {
  it('pads to 4 digits', () => {
    expect(formatRegularNo(5)).toBe('0005');
    expect(formatRegularNo(1)).toBe('0001');
    expect(formatRegularNo(317)).toBe('0317');
    expect(formatRegularNo(1050)).toBe('1050');
  });

  it('leaves longer numbers alone', () => {
    expect(formatRegularNo(12350)).toBe('12350');
  });

  it('rejects zero, negatives and non-integers', () => {
    expect(() => formatRegularNo(0)).toThrow(RangeError);
    expect(() => formatRegularNo(-5)).toThrow(RangeError);
    expect(() => formatRegularNo(2.5)).toThrow(RangeError);
  });
});

describe('number checks', () => {
  it('hasFour looks at every digit', () => {
    expect(hasFour(4)).toBe(true);
    expect(hasFour(14)).toBe(true);
    expect(hasFour(40)).toBe(true);
    expect(hasFour(104)).toBe(true);
    expect(hasFour(5)).toBe(false);
    expect(hasFour(317)).toBe(false);
  });

  it('isValidRegularNo accepts the reserved numbers but not a 4', () => {
    expect(isValidRegularNo(1)).toBe(true);
    expect(isValidRegularNo(3)).toBe(true);
    expect(isValidRegularNo(5)).toBe(true);
    expect(isValidRegularNo(4)).toBe(false);
    expect(isValidRegularNo(14)).toBe(false);
    expect(isValidRegularNo(0)).toBe(false);
    expect(isValidRegularNo(-5)).toBe(false);
    expect(isValidRegularNo(5.5)).toBe(false);
  });

  it('isHumanRegularNo starts at 5', () => {
    expect(isHumanRegularNo(1)).toBe(false);
    expect(isHumanRegularNo(3)).toBe(false);
    expect(isHumanRegularNo(5)).toBe(true);
    expect(isHumanRegularNo(13)).toBe(true);
    expect(isHumanRegularNo(14)).toBe(false);
  });
});

describe('founding regulars (first 1,000 people)', () => {
  it('ordinal counts people, not the number printed on the card', () => {
    expect(regularOrdinal(5)).toBe(1);
    expect(regularOrdinal(6)).toBe(2);
    expect(regularOrdinal(13)).toBe(9);
    expect(regularOrdinal(15)).toBe(10);
    expect(regularOrdinal(50)).toBe(regularOrdinal(39)! + 1);
    expect(regularOrdinal(4)).toBeNull();
    expect(regularOrdinal(3)).toBeNull();
  });

  it('draws the line at the 1,000th person', () => {
    let last = 0;
    let thousandth = 0;
    let next = 0;
    for (let i = 1; i <= FOUNDING_REGULARS + 1; i += 1) {
      last = nextRegularNo(last);
      if (i === FOUNDING_REGULARS) thousandth = last;
      if (i === FOUNDING_REGULARS + 1) next = last;
    }
    expect(regularOrdinal(thousandth)).toBe(FOUNDING_REGULARS);
    expect(isFoundingRegular(thousandth)).toBe(true);
    expect(isFoundingRegular(next)).toBe(false);
    expect(isFoundingRegular(5)).toBe(true);
    expect(isFoundingRegular(1)).toBe(false);
  });
});
