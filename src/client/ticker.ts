// One shared requestAnimationFrame loop for every animation on the page.

export type FrameFn = (time: number, dt: number) => void;

const subscribers = new Set<FrameFn>();
let rafId = 0;
let last = 0;

function loop(now: number) {
  const t = now / 1000;
  const dt = Math.min(0.05, last ? t - last : 0.016);
  last = t;
  subscribers.forEach((fn) => fn(t, dt));
  rafId = subscribers.size ? requestAnimationFrame(loop) : 0;
}

export function onFrame(fn: FrameFn): () => void {
  subscribers.add(fn);
  if (!rafId) {
    last = 0;
    rafId = requestAnimationFrame(loop);
  }
  return () => subscribers.delete(fn);
}

/** Runs `fn` every frame, but only while `el` is on screen. */
export function onFrameWhileVisible(el: Element, fn: FrameFn, rootMargin = '100px'): void {
  let stop: (() => void) | null = null;
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !stop) stop = onFrame(fn);
      else if (!entry.isIntersecting && stop) {
        stop();
        stop = null;
      }
    },
    { rootMargin },
  ).observe(el);
}

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
