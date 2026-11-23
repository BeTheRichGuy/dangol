export interface Sfx {
  flap: () => void;
  bell: () => void;
  lantern: () => void;
  hit: () => void;
  fall: () => void;
  close: () => void;
}

const NOOP: Sfx = { flap() {}, bell() {}, lantern() {}, hit() {}, fall() {}, close() {} };

export function createSfx(): Sfx {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return NOOP;
    const ctx = new Ctx();
    void ctx.resume();

    const tone = (type: OscillatorType, from: number, to: number, dur: number, gain: number, delay = 0) => {
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    };

    return {

      flap: () => tone('triangle', 360, 760, 0.1, 0.05),
      bell: () => {
        tone('triangle', 1318, 1318, 0.08, 0.06);
        tone('triangle', 1760, 1760, 0.12, 0.05, 0.05);
      },
      lantern: () => [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.16, 0.07, i * 0.07)),
      hit: () => tone('sawtooth', 240, 60, 0.28, 0.07),
      fall: () => tone('sine', 620, 110, 0.45, 0.08),
      close: () => {
        window.setTimeout(() => {
          try {
            void ctx.close();
          } catch {

          }
        }, 600);
      },
    };
  } catch {
    return NOOP;
  }
}
