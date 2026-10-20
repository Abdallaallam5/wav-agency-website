import { getLang, onLangChange, t } from './i18n';
import { reducedMotion } from './ticker';

const VISIBLE = 8;

/** Work section: industry tabs, a "show more" fold, and a full-size viewer for the posters. */
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

  initFold(panels);
  initViewer(panels);
}

/** Groups with more than 8 posters start folded, with a button to reveal the rest. */
function initFold(panels: HTMLElement[]) {
  const refresh: (() => void)[] = [];
  panels.forEach((panel) => {
    const grid = panel.querySelector<HTMLElement>('.showcase__grid')!;
    const extra = grid.children.length - VISIBLE;
    if (extra <= 0) return;
    grid.classList.add('is-folded');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'showcase__more';
    const paint = () => {
      const folded = grid.classList.contains('is-folded');
      btn.textContent = folded ? `${t('ui.showMore')} (+${extra})` : t('ui.showLess');
      btn.setAttribute('aria-expanded', String(!folded));
    };
    btn.addEventListener('click', () => {
      grid.classList.toggle('is-folded');
      paint();
    });
    paint();
    refresh.push(paint);
    grid.after(btn);
  });
  onLangChange(() => refresh.forEach((fn) => fn()));
}

/** Click a poster to see it full size; arrow keys / swipe buttons move through the group. */
function initViewer(panels: HTMLElement[]) {
  const box = document.createElement('div');
  box.className = 'viewer';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML = `
    <button type="button" class="viewer__btn viewer__close" data-act="close">×</button>
    <button type="button" class="viewer__btn viewer__prev" data-act="prev">‹</button>
    <img class="viewer__img" alt="" />
    <button type="button" class="viewer__btn viewer__next" data-act="next">›</button>`;
  document.body.appendChild(box);
  const img = box.querySelector<HTMLImageElement>('.viewer__img')!;
  const label = () => {
    box.setAttribute('aria-label', t('ui.close'));
    box.querySelector('[data-act="close"]')!.setAttribute('aria-label', t('ui.close'));
    box.querySelector('[data-act="prev"]')!.setAttribute('aria-label', t('ui.prev'));
    box.querySelector('[data-act="next"]')!.setAttribute('aria-label', t('ui.next2'));
  };
  label();
  onLangChange(label);

  let list: HTMLImageElement[] = [];
  let at = 0;
  let opener: HTMLElement | null = null;

  const show = (i: number) => {
    at = (i + list.length) % list.length;
    img.src = list[at].currentSrc || list[at].src;
    img.alt = list[at].alt;
  };
  const close = () => {
    box.hidden = true;
    document.body.style.overflow = '';
    opener?.focus();
  };
  // In RTL the visual "next" arrow points left, so swap the direction.
  const step = (dir: 1 | -1) => show(at + (getLang() === 'ar' ? -dir : dir));

  panels.forEach((panel) => {
    panel.addEventListener('click', (e) => {
      const fig = (e.target as HTMLElement).closest<HTMLElement>('.poster');
      if (!fig) return;
      list = Array.from(panel.querySelectorAll<HTMLImageElement>('.poster img'));
      opener = fig;
      show(list.indexOf(fig.querySelector('img')!));
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      box.querySelector<HTMLElement>('.viewer__close')!.focus();
    });
  });
  box.addEventListener('click', (e) => {
    const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
    if (act === 'close' || e.target === box || e.target === img) close();
    else if (act === 'prev') step(-1);
    else if (act === 'next') step(1);
  });
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  });
}

/** KPI cards count up and the charts grow when the section scrolls into view. */
export function initKpis(root: HTMLElement) {
  const values = Array.from(root.querySelectorAll<HTMLElement>('[data-count]'));
  let progress = 0;

  const format = (el: HTMLElement, v: number) => {
    const ar = getLang() === 'ar';
    const decimals = Number(el.dataset.decimals ?? 0);
    const num = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const prefix = ar ? el.dataset.prefixAr ?? el.dataset.prefix ?? '' : el.dataset.prefix ?? '';
    const suffix = ar ? el.dataset.suffixAr ?? el.dataset.suffix ?? '' : el.dataset.suffix ?? '';
    el.textContent = `${prefix}${num}${suffix}`;
  };
  const paint = () => values.forEach((el) => format(el, Number(el.dataset.count) * progress));

  const run = () => {
    root.classList.add('is-in');
    const start = performance.now();
    const dur = reducedMotion ? 0 : 1600;
    const step = (now: number) => {
      const p = dur ? Math.min(1, (now - start) / dur) : 1;
      progress = 1 - Math.pow(1 - p, 3);
      paint();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Switching language changes the currency label, so redraw the final numbers.
  onLangChange(paint);

  new IntersectionObserver(
    ([e], io) => {
      if (!e.isIntersecting) return;
      run();
      io.disconnect();
    },
    { threshold: 0.25 },
  ).observe(root);
}
