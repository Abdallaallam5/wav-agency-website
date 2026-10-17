import { reducedMotion } from './ticker';

/** Work section: industry tabs. Posters rise in on a staggered wave when a tab opens. */
export function initShowcase(root: HTMLElement) {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')!)!);

  function select(i: number, focus = false) {
    tabs.forEach((tab, j) => {
      const on = j === i;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
      panels[j].classList.toggle('is-active', on);
    });
    if (focus) tabs[i].focus();
    // Restart the poster entrance animation.
    if (!reducedMotion) {
      const panel = panels[i];
      panel.classList.remove('is-in');
      void panel.offsetWidth;
      panel.classList.add('is-in');
    }
  }

  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      const rtl = document.documentElement.dir === 'rtl';
      const next = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select((i + next + tabs.length) % tabs.length, true);
    });
  });

  new IntersectionObserver(
    ([e], io) => {
      if (!e.isIntersecting) return;
      panels.find((p) => !p.hidden)?.classList.add('is-in');
      io.disconnect();
    },
    { threshold: 0.2 },
  ).observe(root);
}

/** KPI cards count up and the charts grow when the section scrolls into view. */
export function initKpis(root: HTMLElement) {
  const values = Array.from(root.querySelectorAll<HTMLElement>('[data-count]'));
  const format = (el: HTMLElement, v: number) => {
    const decimals = Number(el.dataset.decimals ?? 0);
    const num = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    el.textContent = `${el.dataset.prefix ?? ''}${num}${el.dataset.suffix ?? ''}`;
  };

  const run = () => {
    root.classList.add('is-in');
    const start = performance.now();
    const dur = reducedMotion ? 0 : 1600;
    const step = (now: number) => {
      const p = dur ? Math.min(1, (now - start) / dur) : 1;
      const eased = 1 - Math.pow(1 - p, 3);
      values.forEach((el) => format(el, Number(el.dataset.count) * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  new IntersectionObserver(
    ([e], io) => {
      if (!e.isIntersecting) return;
      run();
      io.disconnect();
    },
    { threshold: 0.25 },
  ).observe(root);
}
