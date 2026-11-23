const SLACK = 2;

export function railEdges({ left, width, scrollWidth }: { left: number; width: number; scrollWidth: number }): { prev: boolean; next: boolean } {
  return { prev: left > SLACK, next: left + width < scrollWidth - SLACK };
}

export function railStep(itemWidth: number, gap: number): number {
  return itemWidth + gap;
}
