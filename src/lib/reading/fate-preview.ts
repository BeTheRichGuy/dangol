import { levelOf, type FlowMap } from './fate-map';

const START = 30;
const END = 84;

const WIGGLE = 4;

function unit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function risingPreview(flow: FlowMap): FlowMap {

  const shown = Math.max(2, flow.points.filter((p) => (p.startAge + p.endAge + 1) / 2 <= flow.age).length);
  const key = flow.points.map((p) => `${p.startAge}:${p.score}`).join('|');
  const points = flow.points.map((p, i) => {
    const t = Math.min(1, i / (shown - 1));
    const wiggle = (unit(`${key}#${i}`) * 2 - 1) * WIGGLE * Math.sin(Math.PI * t);
    const score = Math.round(START + (END - START) * t + wiggle);
    return { ...p, score, level: levelOf(score) };
  });
  return { ...flow, points };
}
