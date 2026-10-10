import { clamp, finePointer, lerp, onFrame, onFrameWhileVisible, reducedMotion } from '../ticker';

/** Fade/slide elements in as they enter, staggering siblings that arrive together. */
export function initReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      const arriving = entries.filter((e) => e.isIntersecting);
      arriving.forEach((e, i) => {
        const el = e.target as HTMLElement;
        el.style.setProperty('--rd', `${Math.min(i, 6) * 0.08}s`);
        el.classList.add('is-in');
        io.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

/** Custom cursor: a lime dot with a lagging violet ring. */
export function initCursor(root: HTMLElement) {
  if (!finePointer || reducedMotion) return;
  const dot = root.querySelector<HTMLElement>('.cursor__dot')!;
  const ring = root.querySelector<HTMLElement>('.cursor__ring')!;
  let x = -100;
  let y = -100;
  let rx = -100;
  let ry = -100;

  window.addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    dot.style.transform = `translate(${x}px, ${y}px)`;
  });
  document.addEventListener('pointerover', (e) => {
    const hit = (e.target as HTMLElement).closest('a, button, [data-ripple], select, input, textarea, label');
    root.classList.toggle('is-hover', !!hit);
  });
  onFrame(() => {
    rx = lerp(rx, x, 0.16);
    ry = lerp(ry, y, 0.16);
    ring.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px)`;
  });
}

/** Buttons lean toward the cursor. */
export function initMagnetic() {
  if (!finePointer || reducedMotion) return;
  document.addEventListener('pointermove', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.magnetic');
    document.querySelectorAll<HTMLElement>('.magnetic.is-pulled').forEach((m) => {
      if (m !== el) {
        m.classList.remove('is-pulled');
        m.style.setProperty('--bx', '0px');
        m.style.setProperty('--by', '0px');
      }
    });
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.classList.add('is-pulled');
    el.style.setProperty('--bx', `${((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1)}px`);
    el.style.setProperty('--by', `${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px`);
  });
}

/** Gentle 3D tilt on cards. */
export function initTilt() {
  if (!finePointer || reducedMotion) return;
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${(px * 7).toFixed(2)}deg) rotateX(${(-py * 7).toFixed(2)}deg) translateY(-4px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}

/** Service cards: a ripple ring spreads from wherever the pointer enters or clicks. */
export function initRipples() {
  if (reducedMotion) return;
  const spawn = (el: HTMLElement, e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.left = `${e.clientX - r.left}px`;
    dot.style.top = `${e.clientY - r.top}px`;
    el.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  };
  document.querySelectorAll<HTMLElement>('[data-ripple]').forEach((el) => {
    el.addEventListener('pointerenter', (e) => spawn(el, e));
    el.addEventListener('pointerdown', (e) => spawn(el, e));
  });
}

/** Spotlight that follows the pointer inside answer buttons. */
export function initSpotlight() {
  document.addEventListener('pointermove', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.answer');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

/** Sticky nav: blur once scrolled, hide on the way down, highlight the current section. */
export function initNav(nav: HTMLElement) {
  let lastY = window.scrollY;
  const burger = nav.querySelector<HTMLButtonElement>('[data-burger]')!;

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    const open = nav.classList.contains('is-open');
    nav.classList.toggle('is-hidden', !open && y > lastY && y > 400);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('.nav__links a').forEach((a) =>
    a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }),
  );

  const links = new Map<string, HTMLElement>();
  nav.querySelectorAll<HTMLAnchorElement>('.nav__links a').forEach((a) => links.set(a.hash.slice(1), a));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a, id) => a.classList.toggle('is-active', id === e.target.id));
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  links.forEach((_, id) => {
    const s = document.getElementById(id);
    if (s) io.observe(s);
  });
}

/** Case-study images drift slower than the page. */
export function initParallax() {
  if (reducedMotion) return;
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((box) => {
    const img = box.querySelector<HTMLElement>('img')!;
    onFrameWhileVisible(box, () => {
      const r = box.getBoundingClientRect();
      const p = clamp((window.innerHeight - r.top) / (window.innerHeight + r.height));
      img.style.transform = `translateY(${(-p * 15).toFixed(2)}%)`;
    });
  });
}
