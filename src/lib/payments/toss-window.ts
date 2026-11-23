export const TOSS_SELF_BELOW_PX = 768;

export function tossWindowTarget(viewportWidth: number | null | undefined): 'self' | undefined {
  if (typeof viewportWidth !== 'number' || !Number.isFinite(viewportWidth) || viewportWidth <= 0) return undefined;
  return viewportWidth < TOSS_SELF_BELOW_PX ? 'self' : undefined;
}
