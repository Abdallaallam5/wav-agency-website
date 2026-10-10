import { initContact } from './contact';
import {
  initCursor,
  initMagnetic,
  initNav,
  initParallax,
  initReveal,
  initRipples,
  initSpotlight,
  initTilt,
} from './fx/interactions';
import { initLang, onLangChange } from './i18n';
import { initPulse } from './pulse';
import { reducedMotion } from './ticker';
import { initApproach, initFooterFill, initLogoWave, initWaveMarquee } from './waves/ambient';
import { initHeroWaves } from './waves/heroWaves';
import { initStory } from './waves/story';
import { initTitleHover, playWaveText, splitWaveText } from './waves/waveText';

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);

function boot() {
  initLang();

  const heroLines = Array.from(document.querySelectorAll<HTMLElement>('[data-wave-text]'));
  heroLines.forEach((el, i) => splitWaveText(el, i * 0.16));

  const canvas = $<HTMLCanvasElement>('[data-hero-waves]');
  if (canvas) initHeroWaves(canvas);

  const nav = $('[data-nav]');
  if (nav) initNav(nav);
  const story = $('[data-story]');
  if (story) initStory(story);
  const marquee = $('[data-wave-marquee]');
  if (marquee) initWaveMarquee(marquee);
  const approach = $('[data-approach]');
  if (approach) initApproach(approach);
  const logos = $('[data-logo-wave]');
  if (logos) initLogoWave(logos);
  const footerFill = $('[data-footer-fill]');
  if (footerFill) initFooterFill(footerFill);
  const pulse = $('[data-pulse]');
  if (pulse) initPulse(pulse);
  const form = $<HTMLFormElement>('[data-contact-form]');
  if (form) initContact(form);
  const cursor = $('.cursor');
  if (cursor) initCursor(cursor);
  const title = $('.hero__title');
  if (title) initTitleHover(title);

  initReveal();
  initMagnetic();
  initTilt();
  initRipples();
  initSpotlight();
  initParallax();

  onLangChange(() => {
    heroLines.forEach((el, i) => {
      splitWaveText(el, i * 0.12);
      requestAnimationFrame(() => playWaveText(el));
    });
  });

  // Intro: hold the loader until fonts are ready (min 1.3s, max 3s), then wash it away.
  const loader = $('.loader');
  const reveal = () => {
    loader?.classList.add('is-done');
    document.body.classList.remove('is-loading');
    window.setTimeout(() => heroLines.forEach(playWaveText), reducedMotion ? 0 : 450);
    window.setTimeout(() => loader?.remove(), 1400);
  };
  if (reducedMotion) reveal();
  else {
    const minWait = new Promise((r) => setTimeout(r, 1300));
    const maxWait = new Promise((r) => setTimeout(r, 3000));
    Promise.race([Promise.all([document.fonts.ready, minWait]), maxWait]).then(reveal);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
