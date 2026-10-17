import { getLang } from '../i18n';
import { finePointer, lerp, onFrameWhileVisible, reducedMotion } from '../ticker';

const GRADIENT: [number, number, number][] = [
  [91, 43, 255],
  [155, 77, 255],
  [224, 123, 255],
];

function gradientAt(t: number) {
  const seg = Math.min(GRADIENT.length - 2, Math.floor(t * (GRADIENT.length - 1)));
  const local = t * (GRADIENT.length - 1) - seg;
  const [a, b] = [GRADIENT[seg], GRADIENT[seg + 1]];
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], local))).join(',')})`;
}

/**
 * Splits an element into letters (or words, for Arabic, so ligatures stay joined)
 * that rise in on a staggered wave.
 */
export function splitWaveText(el: HTMLElement, baseDelay = 0) {
  const text = el.textContent ?? '';
  const byWord = getLang() === 'ar';
  const parts = byWord ? text.trim().split(/\s+/) : Array.from(text);
  const accent = el.classList.contains('hero__line--accent');

  el.classList.remove('is-in', 'is-settled');
  el.textContent = '';
  el.setAttribute('aria-label', text);

  const frag = document.createDocumentFragment();
  // Letters are grouped per word so a line never breaks in the middle of a word.
  let group: HTMLElement | null = null;
  parts.forEach((part, i) => {
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    if (!byWord && part === ' ') {
      span.className = 'wt-space';
      span.textContent = ' ';
    } else {
      span.className = byWord ? 'wt-word' : 'wt-char';
      span.textContent = part;
      if (accent) span.style.color = gradientAt(parts.length > 1 ? i / (parts.length - 1) : 0);
    }
    span.style.setProperty('--i', String(i));
    span.style.setProperty('--d', `${baseDelay}s`);
    if (!byWord && span.className === 'wt-char') {
      if (!group) {
        group = document.createElement('span');
        group.className = 'wt-group';
        group.setAttribute('aria-hidden', 'true');
        frag.appendChild(group);
      }
      group.appendChild(span);
    } else {
      group = null;
      frag.appendChild(span);
    }
    if (byWord && i < parts.length - 1) frag.appendChild(document.createTextNode(' '));
  });
  el.appendChild(frag);
}

export function playWaveText(el: HTMLElement) {
  if (reducedMotion) {
    el.classList.add('is-in', 'is-settled');
    return;
  }
  el.classList.add('is-in');
  const pieces = el.querySelectorAll<HTMLElement>('.wt-char, .wt-word');
  const last = pieces[pieces.length - 1];
  last?.addEventListener('animationend', () => el.classList.add('is-settled'), { once: true });
}

/**
 * After the intro, letters near the cursor lift on a travelling wave,
 * like a ripple passing under the headline.
 */
export function initTitleHover(title: HTMLElement) {
  if (reducedMotion || !finePointer) return;
  let mx = -9999;
  let my = -9999;
  let active = 0;

  let centers: { el: HTMLElement; x: number; y: number }[] = [];
  const measure = () => {
    centers = Array.from(title.querySelectorAll<HTMLElement>('.is-settled .wt-char, .is-settled .wt-word')).map((el) => {
      const r = el.getBoundingClientRect();
      return { el, x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
  };
  title.addEventListener('pointerenter', measure);
  window.addEventListener('scroll', () => (centers = []), { passive: true });

  title.addEventListener('pointermove', (e) => {
    if (!centers.length) measure();
    mx = e.clientX;
    my = e.clientY;
  });
  title.addEventListener('pointerleave', () => {
    mx = -9999;
  });

  const offsets = new WeakMap<HTMLElement, number>();

  onFrameWhileVisible(title, (t) => {
    active = lerp(active, mx > -999 ? 1 : 0, 0.08);
    if (active < 0.002) return;
    centers.forEach(({ el: ch, x: cx, y: cy }) => {
      const dx = cx - mx;
      const near = Math.exp(-(dx * dx) / (2 * 120 * 120)) * Math.exp(-((cy - my) ** 2) / (2 * 260 * 260));
      const target = -near * active * (18 + 10 * Math.sin(t * 6 - cx * 0.02));
      const cur = lerp(offsets.get(ch) ?? 0, target, 0.18);
      offsets.set(ch, cur);
      ch.style.transform = `translateY(${cur.toFixed(2)}px)`;
    });
  });
}
