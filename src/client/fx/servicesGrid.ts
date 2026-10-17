/** On phones the service cards sit three per row; tapping one opens its details. */
export function initServicesGrid(grid: HTMLElement) {
  const cards = Array.from(grid.querySelectorAll<HTMLElement>('.service:not(.service--cta)'));
  cards.forEach((card) => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-expanded', 'false');
    const toggle = () => {
      if (!window.matchMedia('(max-width: 600px)').matches) return;
      const open = !card.classList.contains('is-open');
      cards.forEach((c) => {
        c.classList.remove('is-open');
        c.setAttribute('aria-expanded', 'false');
      });
      card.classList.toggle('is-open', open);
      card.setAttribute('aria-expanded', String(open));
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
}
