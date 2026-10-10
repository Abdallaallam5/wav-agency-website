import { clamp, onFrameWhileVisible, reducedMotion } from '../ticker';

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

/** Client logos bob on a travelling wave (CSS) while the rows scroll. */
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
  // The bobbing itself is a CSS animation; each logo just gets its phase offset.
  root.querySelectorAll<HTMLElement>("img").forEach((img, i) => img.style.setProperty("--i", String(i)));
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
