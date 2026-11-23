import { ENTER_FRAME } from './manifest';

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function doorAt(t: number): { x: number; y: number } {
  const pts = ENTER_FRAME.door.y;
  const time = Number.isFinite(t) ? t : 0;
  let y = pts[pts.length - 1][1];
  if (time <= pts[0][0]) {
    y = pts[0][1];
  } else {
    for (let i = 1; i < pts.length; i += 1) {
      const [t1, y1] = pts[i];
      if (time <= t1) {
        const [t0, y0] = pts[i - 1];
        y = y0 + ((y1 - y0) * (time - t0)) / (t1 - t0);
        break;
      }
    }
  }
  return { x: ENTER_FRAME.door.x, y };
}

export function coverPoint(
  box: Box,
  frame: { width: number; height: number },
  position: { x: number; y: number },
  point: { x: number; y: number },
): { x: number; y: number } {
  const scale = Math.max(box.width / frame.width, box.height / frame.height);
  const w = frame.width * scale;
  const h = frame.height * scale;

  return {
    x: box.left + (box.width - w) * position.x + point.x * w,
    y: box.top + (box.height - h) * position.y + point.y * h,
  };
}

export function gateOrigin(box: Box, t: number): { x: string; y: string; h: string } {
  const p = coverPoint(box, ENTER_FRAME, ENTER_FRAME.position, doorAt(t));
  const scale = Math.max(box.width / ENTER_FRAME.width, box.height / ENTER_FRAME.height);
  const px = (n: number) => `${Math.round(n * 10) / 10}px`;

  return { x: px(p.x), y: px(Math.max(0, p.y)), h: px(ENTER_FRAME.door.h * ENTER_FRAME.height * scale) };
}
