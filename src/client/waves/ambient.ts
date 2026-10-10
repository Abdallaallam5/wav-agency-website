import { clamp, onFrameWhileVisible, reducedMotion } from '../ticker';

/** Text riding along an undulating wave path. Speeds up with scroll velocity. */
export function initWaveMarquee(root: HTMLElement) {
  const path = root.querySelector<SVGPathElement>('path')!;
  const textPath = root.querySelector<SVGTextPathElement>('[data-marquee-text]')!;
  const text = textPath.parentElement as unknown as SVGTextElement;
  const W = 1600;
  let offset = 0;
  let lastScroll = window.scrollY;
  let boost = 0;

  const build = (t: number) => {
    let d = '';
    for (let i = 0; i <= 80; i++) {
      const x = -100 + (i / 80) * (W + 200);
      const y = 110 + Math.sin((x / W) * Math.PI * 3 + t * 0.9) * 46 + Math.sin((x / W) * Math.PI * 7 - t * 1.3) * 10;
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };

  path.setAttribute('d', build(0));
  if (reducedMotion) return;

  onFrameWhileVisible(root, (t, dt) => {
    const sy = window.scrollY;
    boost += (clamp(Math.abs(sy - lastScroll) * 0.6, 0, 40) - boost) * 0.1;
    lastScroll = sy;
    path.setAttribute('d', build(t));
    const segment = text.getComputedTextLength() / 3;
    offset = (offset + (90 + boost * 14) * dt) % segment;
    textPath.setAttribute('startOffset', String(-offset));
  });
}

/** Approach section: the dotted wave draws itself as you scroll through it. */
export function initApproach(root: HTMLElement) {
  const path = root.querySelector<SVGPathElement>('[data-approach-path]')!;
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len}`;
  path.style.strokeDashoffset = `${len}`;
  if (reducedMotion) {
    path.style.strokeDashoffset = '0';
    return;
  }
  onFrameWhileVisible(root, () => {
    const r = root.getBoundingClientRect();
    const p = clamp((window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.2));
    path.style.strokeDashoffset = `${len * (1 - p)}`;
  });
}

/** Client logos bob on a travelling wave while the rows scroll. */
export function initLogoWave(root: HTMLElement) {
  // Repeat each track (x4) so the -50% marquee loops seamlessly even on wide screens.
  root.querySelectorAll<HTMLElement>(".clients__track").forEach((track) => {
    const originals = Array.from(track.children);
    for (let n = 0; n < 3; n++) originals.forEach((img) => {
      const copy = img.cloneNode() as HTMLImageElement;
      copy.alt = "";
      copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    });
  });
  if (reducedMotion) return;
  const logos = Array.from(root.querySelectorAll<HTMLElement>('img'));
  onFrameWhileVisible(root, (t) => {
    logos.forEach((img, i) => {
      img.style.transform = `translateY(${(Math.sin(t * 1.7 + i * 0.75) * 9).toFixed(2)}px) rotate(${(Math.sin(t * 1.7 + i * 0.75 - 0.8) * 3).toFixed(2)}deg)`;
    });
  });
}

/** The liquid footer wordmark fills up when it scrolls into view. */
export function initFooterFill(fill: Element) {
  new IntersectionObserver(
    ([e]) => {
      fill.classList.toggle('is-in', e.isIntersecting);
    },
    { threshold: 0.3 },
  ).observe(fill.closest('svg')!);
}
