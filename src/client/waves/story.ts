import { clamp, onFrameWhileVisible, reducedMotion, smoothstep } from '../ticker';

/**
 * The story section is a tall scroll track with a sticky stage.
 * As you scroll, a flat EKG line grows into a full wave and the copy advances —
 * "active but not moving" → "we're here to create a wave".
 */
export function initStory(section: HTMLElement) {
  const path = section.querySelector<SVGPathElement>('[data-story-path]')!;
  const glow = section.querySelector<SVGPathElement>('[data-story-path-glow]')!;
  const readout = section.querySelector<HTMLElement>('[data-story-readout]')!;
  const steps = Array.from(section.querySelectorAll<HTMLElement>('.story__step'));

  const W = 1200;
  const MID = 200;
  const N = 220;
  let progress = 0;
  let shown = 0; // eased progress used for drawing
  let activeStep = -1;

  function measure() {
    const rect = section.getBoundingClientRect();
    const track = section.offsetHeight - window.innerHeight;
    progress = clamp(-rect.top / Math.max(1, track));
  }

  // EKG blip centred at 0 — the "heartbeat" of a brand that's alive but flat.
  function blip(x: number) {
    const q = -Math.exp(-((x + 10) ** 2) / 30) * 10;
    const r = Math.exp(-(x ** 2) / 12) * 60;
    const s = -Math.exp(-((x - 9) ** 2) / 20) * 22;
    const tw = Math.exp(-((x - 40) ** 2) / 120) * 12;
    return q + r + s + tw;
  }

  function buildPath(p: number, t: number) {
    const flat = 1 - smoothstep(0.32, 0.62, p);
    const amp = smoothstep(0.22, 0.92, p) * 150;
    const freq = 2.6 - p * 0.8;
    const beatX = ((t * 0.22) % 1.3) * W - 100;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * W;
      const nx = x / W;
      let y =
        Math.sin(nx * freq * Math.PI * 2 - t * 1.6) * amp +
        Math.sin(nx * freq * 2.1 * Math.PI * 2 + t * 1.1) * amp * 0.18;
      y += blip(x - beatX) * flat * 1.4;
      y += Math.sin(nx * 90 + t * 8) * 1.2 * flat; // signal noise
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(MID - y).toFixed(1)}`;
    }
    return d;
  }

  function setStep(i: number) {
    if (i === activeStep) return;
    activeStep = i;
    steps.forEach((el, j) => {
      el.classList.toggle('is-active', j === i);
      el.classList.toggle('is-past', j < i);
    });
  }

  function frame(t: number) {
    measure();
    shown += (progress - shown) * 0.12;
    const d = buildPath(shown, reducedMotion ? 0 : t);
    path.setAttribute('d', d);
    glow.setAttribute('d', d);
    readout.textContent = `${String(Math.round(smoothstep(0.05, 0.9, shown) * 100)).padStart(2, '0')}%`;
    setStep(Math.min(steps.length - 1, Math.floor(progress * steps.length * 0.999)));
  }

  setStep(0);
  frame(0);
  onFrameWhileVisible(section, frame, '0px');
}
