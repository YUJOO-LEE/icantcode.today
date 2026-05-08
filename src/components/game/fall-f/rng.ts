export type RNG = () => number;

export const defaultRNG: RNG = Math.random;

/**
 * mulberry32 — fast 32-bit seeded PRNG. Output in [0, 1).
 * Source: https://stackoverflow.com/a/47593316.
 */
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRandom<T>(items: readonly T[], rng: RNG): T {
  if (items.length === 0) {
    throw new Error('pickRandom: empty items');
  }
  const idx = Math.floor(rng() * items.length);
  return items[idx] as T;
}
