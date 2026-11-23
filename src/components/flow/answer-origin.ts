interface Origin {
  left: number;
  top: number;
  width: number;
  height: number;
  at: number;
}

const MAX_AGE_MS = 800;

let last: Origin | null = null;

export function rememberAnswerOrigin(el: Element): void {
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return;
  last = { left: r.left, top: r.top, width: r.width, height: r.height, at: performance.now() };
}

export function takeAnswerOrigin(): Omit<Origin, 'at'> | null {
  const o = last;
  last = null;
  if (!o || performance.now() - o.at > MAX_AGE_MS) return null;
  return { left: o.left, top: o.top, width: o.width, height: o.height };
}
