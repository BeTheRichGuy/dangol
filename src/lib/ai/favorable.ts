import type { TraitStrength } from '@/lib/reading/traits-types';
import type { Element } from '@/lib/saju/types';

const CYCLE: readonly Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export function favorableElement(day: Element, strength: TraitStrength, elements: Readonly<Record<Element, number>>): Element {
  const at = CYCLE.indexOf(day);
  if (strength === 'strong') return CYCLE[(at + 1) % 5];
  if (strength === 'gentle') return CYCLE[(at + 4) % 5];
  return CYCLE.reduce((low, e) => (elements[e] < elements[low] ? e : low), CYCLE[0]);
}

export const FAVORABLE_SIGNS: Record<Element, { color: string; direction: string; wear: string; accessory: string }> = {
  wood: { color: 'green-teal', direction: 'east', wear: 'green, teal, olive; cotton or linen', accessory: 'wooden beads or bracelet, a small plant on the desk' },
  fire: { color: 'red', direction: 'south', wear: 'red, coral, burgundy, warm pink', accessory: 'garnet or red-stone ring, a warm-toned bag or scarf' },
  earth: { color: 'yellow', direction: 'center', wear: 'beige, camel, mustard, brown', accessory: 'amber, tiger-eye or ceramic pieces, a leather strap watch' },
  metal: { color: 'white', direction: 'west', wear: 'white, ivory, light grey, silver tones', accessory: 'gold or silver rings, a metal watch, clean-lined metal earrings' },
  water: { color: 'black-navy', direction: 'north', wear: 'black, navy, charcoal', accessory: 'pearl, black stone or glass pieces, a navy bag' },
};
