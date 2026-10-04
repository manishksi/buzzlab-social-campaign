export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number) => clamp((v - a) / (b - a));
export const smooth = (a: number, b: number, v: number) => {
  const t = invLerp(a, b, v);
  return t * t * (3 - 2 * t);
};
/** 0 → 1 → 0 window: rises over [a,b], holds, falls over [c,d]. */
export const band = (a: number, b: number, c: number, d: number, v: number) => smooth(a, b, v) * (1 - smooth(c, d, v));
/** Deterministic pseudo-random from an integer seed. */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
