import { clamp, onFrameWhileVisible, reducedMotion, smoothstep } from '../ticker';

/**
 * The story is a small book on a sticky stage. Each short stretch of scroll turns
 * one page, and tapping the book or the hint jumps to the next page.
 * Behind it, a light SVG line grows from a flat EKG into a full wave.
 */
export function initStory(section: HTMLElement) {
  const path = section.querySelector<SVGPathElement>('[data-story-path]')!;
  const readout = section.querySelector<HTMLElement>('[data-story-readout]')!;
  const pages = Array.from(section.querySelectorAll<HTMLElement>('.page'));
  const dots = Array.from(section.querySelectorAll<HTMLElement>('[data-book-dots] span'));
  const next = section.querySelector<HTMLElement>('[data-book-next]')!;
  const book = section.querySelector<HTMLElement>('[data-book]')!;

  const W = 1200;
  const MID = 200;
  const N = 96;
  let progress = 0;
  let shown = 0;
  let current = -1;

  const measure = () => {
    const rect = section.getBoundingClientRect();
    const track = section.offsetHeight - window.innerHeight;
    progress = clamp(-rect.top / Math.max(1, track));
  };

  // The first page is open on arrival; the rest of the track is split between the turns.
  const pageFor = (p: number) => Math.min(pages.length - 1, Math.floor(p * pages.length * 0.999));

  function setPage(i: number) {
    if (i === current) return;
    current = i;
    pages.forEach((page, j) => {
      page.classList.toggle('is-turned', j < i);
      page.classList.toggle('is-current', j === i);
      page.style.zIndex = String(j < i ? j : pages.length * 2 - j);
    });
    dots.forEach((d, j) => d.classList.toggle('is-on', j <= i));
    next.classList.toggle('is-hidden', i === pages.length - 1);
  }

  // Scroll to the start of the next page's stretch.
  const turn = () => {
    const target = Math.min(pages.length - 1, current + 1);
    const track = section.offsetHeight - window.innerHeight;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (target / pages.length) * track + 4, behavior: reducedMotion ? 'auto' : 'smooth' });
  };
  next.addEventListener('click', turn);
  book.addEventListener('click', turn);

  const blip = (x: number) =>
    -Math.exp(-((x + 10) ** 2) / 30) * 10 + Math.exp(-(x ** 2) / 12) * 60 - Math.exp(-((x - 9) ** 2) / 20) * 22;

  function buildPath(p: number, t: number) {
    const flat = 1 - smoothstep(0.25, 0.55, p);
    const amp = smoothstep(0.15, 0.85, p) * 140;
    const beatX = ((t * 0.3) % 1.3) * W - 100;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * W;
      let y = Math.sin((x / W) * 2.2 * Math.PI * 2 - t * 1.6) * amp;
      y += blip(x - beatX) * flat;
      d += `${i ? 'L' : 'M'}${x.toFixed(0)} ${(MID - y).toFixed(1)}`;
    }
    return d;
  }

  let lastDraw = 0;
  function frame(t: number) {
    measure();
    setPage(pageFor(progress));
    shown += (progress - shown) * 0.15;
    // ~30fps is plenty for a background line.
    if (t - lastDraw < 0.033) return;
    lastDraw = t;
    path.setAttribute('d', buildPath(shown, reducedMotion ? 0 : t));
    readout.textContent = `${String(Math.round(smoothstep(0.02, 0.85, shown) * 100)).padStart(2, '0')}%`;
  }

  setPage(0);
  path.setAttribute('d', buildPath(0, 0));
  onFrameWhileVisible(section, frame, '0px');
}
