import type { Answer, Question, Report, ServiceKey } from '../shared/types';
import { getQuestions } from '../shared/diagnostic';
import { buildReport } from '../shared/report';
import { getLang, onLangChange, t } from './i18n';
import { lerp, onFrameWhileVisible, reducedMotion } from './ticker';

/**
 * Brand Pulse Check: six questions about what's holding a brand back.
 * Each answer reveals our diagnosis and the WAV solution; the monitor's signal
 * turns from a noisy flatline into a clean wave as the visitor works through it.
 */

type View = { kind: 'intro' } | { kind: 'question'; i: number } | { kind: 'solution'; i: number } | { kind: 'report'; report: Report };

const SERVICE_INDEX: Record<ServiceKey, number> = { strategy: 1, content: 2, media: 3, tech: 4, digital: 5, growth: 6, print: 7, consulting: 8 };
const LEVELS = {
  en: ['Flatline', 'Ripple', 'Rising', 'Wave'],
  ar: ['خط مستقيم', 'تموّج خفيف', 'في الطلوع', 'Wave'],
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const pad = (n: number) => String(n).padStart(2, '0');
const serviceName = (key: ServiceKey) =>
  document.querySelector(`.services [data-i18n="services.s${SERVICE_INDEX[key]}"]`)?.textContent ?? key;

const fwd = () => (getLang() === "ar" ? "←" : "→");
const bwd = () => (getLang() === "ar" ? "→" : "←");

const WAVE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12c2.5-5 5-5 7.5 0s5 5 7.5 0 3.5-3 5-2"/></svg>';

export function initPulse(root: HTMLElement) {
  const card = root.querySelector<HTMLElement>('[data-pulse-card]')!;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-pulse-canvas]')!;
  const levelEl = root.querySelector<HTMLElement>('[data-pulse-level]')!;
  const dotsEl = root.querySelector<HTMLElement>('[data-pulse-dots]')!;
  const introHtml = card.innerHTML;

  let questions: Question[] = [];
  const picks = new Map<string, string>();
  // Open straight on the first question so visitors see right away that it's interactive.
  let view: View = { kind: 'question', i: 0 };
  let busy = false;

  // ---------- data ----------
  // Questions ship inside the bundle, so the pulse check works without any API call.
  function load() {
    questions = getQuestions(getLang());
    dotsEl.innerHTML = questions.map(() => '<span></span>').join('');
  }
  load();
  // The finished report (null until the visitor reaches the end). The contact form mirrors it.
  let lastReport: Report | null = null;
  const publish = (r: Report | null) => {
    lastReport = r;
    document.dispatchEvent(new CustomEvent('wav:report', { detail: r }));
  };
  const makeReport = () =>
    buildReport({ lang: getLang(), answers: [...picks].map(([questionId, answerId]) => ({ questionId, answerId })) });

  const pickedAnswer = (q: Question): Answer | undefined => q.answers.find((a) => a.id === picks.get(q.id));

  // ---------- templates ----------
  const top = (q: Question, i: number) => `
    <div class="q__top">
      <span class="q__area">● ${esc(q.area)}</span>
      <span class="q__count"><b>${pad(i + 1)}</b> / ${pad(questions.length)}</span>
    </div>`;

  const questionHtml = (i: number) => {
    const q = questions[i];
    return `<div class="q">
      ${top(q, i)}
      <h3 class="q__text" tabindex="-1">${esc(q.text)}</h3>
      ${i === 0 && picks.size === 0 ? `<p class="q__hint"><span class="q__hint-hand" aria-hidden="true">👆</span>${esc(t('ui.pickHint'))}</p>` : ''}
      <div class="q__answers">
        ${q.answers
          .map(
            (a, j) => `<button type="button" class="answer${a.severity === 0 ? ' answer--healthy' : ''}" data-answer="${esc(a.id)}" style="--i:${j}">
              <span>${esc(a.label)}</span><span class="answer__go">${esc(t('ui.seeFix'))} ${fwd()}</span>
            </button>`,
          )
          .join('')}
      </div>
    </div>`;
  };

  const solutionHtml = (i: number) => {
    const q = questions[i];
    const a = pickedAnswer(q)!;
    const healthy = a.severity === 0;
    const last = i === questions.length - 1;
    return `<div class="sol">
      ${top(q, i)}
      <div class="sol__problem">
        <span class="sol__chip${healthy ? ' sol__chip--good' : ''}">${esc(t(healthy ? 'ui.strength' : 'ui.problem'))}</span>
        <div>
          <p class="sol__you">${esc(t('ui.youSaid'))}: “${esc(a.label.replace(/^[“"]|[”"]$/g, ''))}”</p>
          <h3 class="sol__headline" tabindex="-1">${esc(a.diagnosis.headline)}</h3>
          <p class="sol__text">${esc(a.diagnosis.text)}</p>
        </div>
      </div>
      <div class="sol__fix">
        <span class="sol__chip sol__chip--fix">${esc(t('ui.fix'))}</span>
        <div>
          <h4 class="sol__title">${esc(a.solution.title)}</h4>
          <ol class="sol__steps">${a.solution.steps.map((s, j) => `<li style="--i:${j}">${esc(s)}</li>`).join('')}</ol>
          <p class="sol__outcome">${WAVE_ICON}${esc(a.solution.outcome)}</p>
          <div class="sol__services">${a.services.map((s) => `<span>${esc(serviceName(s))}</span>`).join('')}</div>
        </div>
      </div>
      <div class="sol__nav">
        <button type="button" class="btn-text" data-back>${bwd()} ${esc(t('ui.back'))}</button>
        <button type="button" class="btn magnetic" data-next><span>${esc(t(last ? 'ui.seeReport' : 'ui.next'))} ${fwd()}</span></button>
      </div>
    </div>`;
  };

  const reportHtml = (r: Report) => `<div class="report">
      <div class="report__top">
        <div class="report__score" role="img" aria-label="${esc(t('ui.momentum'))} ${r.score}/100">
          <svg viewBox="0 0 150 150" preserveAspectRatio="none" aria-hidden="true"><path class="report__liquid" data-liquid d="" /></svg>
          <b data-score>0</b><small>${esc(t('ui.momentum').toUpperCase())}</small>
        </div>
        <div>
          <span class="report__level">${esc(t('ui.level'))}: ${esc(r.levelLabel)}</span>
          <h3 class="report__headline" tabindex="-1">${esc(r.headline)}</h3>
          <p class="report__summary">${esc(r.summary)}</p>
        </div>
      </div>
      <p class="report__label">${esc(t('ui.findings'))}</p>
      <div class="report__findings">${
        r.findings.length
          ? r.findings.map((f) => `<span><i>${esc(f.area)}</i>${esc(f.headline)}</span>`).join('')
          : `<span>${esc(t('ui.noFindings'))}</span>`
      }</div>
      <p class="report__label">${esc(t('ui.plan'))}</p>
      <ul class="report__plan">${r.priorities.map((p) => `<li><b>${esc(p.name)}</b><span>${esc(p.pitch)}</span></li>`).join('')}</ul>
      <div class="sol__nav">
        <button type="button" class="btn-text" data-restart>↺ ${esc(t('ui.restart'))}</button>
        <span class="report__id">${esc(t('ui.planId'))} ${esc(r.planId)}</span>
        <button type="button" class="btn magnetic" data-send-plan><span>${esc(t('ui.sendPlan'))} ${fwd()}</span></button>
      </div>
    </div>`;

  // ---------- rendering ----------
  function htmlFor(v: View) {
    switch (v.kind) {
      case 'intro':
        return introHtml;
      case 'question':
        return questionHtml(v.i);
      case 'solution':
        return solutionHtml(v.i);
      case 'report':
        return reportHtml(v.report);
    }
  }

  async function wipeTo(html: string) {
    if (reducedMotion) {
      card.innerHTML = html;
      return;
    }
    const wave = '<svg viewBox="0 0 1440 80" preserveAspectRatio="none"><path d="M0 40 C 240 0 480 80 720 40 S 1200 0 1440 40 V80 H0Z"/></svg>';
    const wipe = document.createElement('div');
    wipe.className = 'wipe';
    wipe.innerHTML = wave + wave.replace('<svg', '<svg class="wipe__bottom"');
    card.appendChild(wipe);
    const ease = 'cubic-bezier(.65,0,.35,1)';
    await wipe.animate([{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], { duration: 420, easing: ease, fill: 'forwards' }).finished;
    card.innerHTML = html;
    card.appendChild(wipe);
    await wipe.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(calc(-100% - 90px))' }], { duration: 560, easing: ease, fill: 'forwards' }).finished;
    wipe.remove();
  }

  async function go(next: View, { animate = true } = {}) {
    if (busy) return;
    busy = true;
    view = next;
    try {
      const html = htmlFor(next);
      if (animate) await wipeTo(html);
      else card.innerHTML = html;
      afterRender();
    } finally {
      busy = false;
    }
  }

  function afterRender() {
    card.querySelector<HTMLElement>('[tabindex="-1"]')?.focus({ preventScroll: true });
    const r = card.getBoundingClientRect();
    if (r.top < 0) window.scrollTo({ top: window.scrollY + r.top - 90, behavior: reducedMotion ? 'auto' : 'smooth' });
    updateProgress();
    if (view.kind === 'report') animateScore(view.report.score);
  }

  function updateProgress() {
    const current = view.kind === 'question' || view.kind === 'solution' ? view.i : -1;
    Array.from(dotsEl.children).forEach((dot, i) => {
      dot.classList.toggle('is-done', picks.has(questions[i]?.id) && i !== current);
      dot.classList.toggle('is-current', i === current);
    });
    levelEl.textContent = picks.size ? LEVELS[getLang()][levelIndex(estimateScore())] : '—';
  }

  // Mirrors the server's scoring so the monitor reacts instantly.
  function estimateScore() {
    if (view.kind === 'report') return view.report.score;
    let sev = 0;
    for (const q of questions) sev += pickedAnswer(q)?.severity ?? 1;
    return Math.round(100 - (sev / (questions.length * 3)) * 72);
  }
  const levelIndex = (score: number) => (score >= 85 ? 3 : score >= 68 ? 2 : score >= 50 ? 1 : 0);

  function animateScore(score: number) {
    const el = card.querySelector<HTMLElement>('[data-score]');
    const liquid = card.querySelector<SVGPathElement>('[data-liquid]');
    if (!el || !liquid) return;
    const start = performance.now();
    const dur = reducedMotion ? 0 : 1600;
    let shown = 0;
    const step = (now: number) => {
      const p = dur ? Math.min(1, (now - start) / dur) : 1;
      shown = score * (1 - Math.pow(1 - p, 3));
      el.textContent = String(Math.round(shown));
      const level = 150 * (1 - shown / 100);
      const ph = now / 400;
      let d = `M0 ${level}`;
      for (let x = 0; x <= 150; x += 5) d += ` L${x} ${(level + Math.sin(x / 18 + ph) * 5).toFixed(1)}`;
      liquid.setAttribute('d', `${d} L150 150 L0 150 Z`);
      if (card.contains(liquid)) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- events ----------
  card.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-pulse-start]')) {
      if (questions.length) go({ kind: 'question', i: 0 });
      return;
    }
    const answerBtn = target.closest<HTMLElement>('[data-answer]');
    if (answerBtn && view.kind === 'question') {
      picks.set(questions[view.i].id, answerBtn.dataset.answer!);
      kick();
      go({ kind: 'solution', i: view.i });
      return;
    }
    if (target.closest('[data-back]') && view.kind === 'solution') {
      go({ kind: 'question', i: view.i });
      return;
    }
    if (target.closest('[data-next]') && view.kind === 'solution') {
      if (view.i < questions.length - 1) go({ kind: 'question', i: view.i + 1 });
      else await showReport();
      return;
    }
    if (target.closest('[data-restart]')) {
      picks.clear();
      if (lastReport) publish(null);
      go({ kind: 'question', i: 0 });
      return;
    }
    if (target.closest('[data-send-plan]') && view.kind === 'report') {
      document.dispatchEvent(new CustomEvent('wav:plan', { detail: view.report }));
    }
  });

  async function showReport() {
    const report = makeReport();
    await go({ kind: 'report', report });
    publish(report);
  }

  onLangChange(() => {
    load();
    if (lastReport) publish({ ...makeReport(), planId: lastReport.planId });
    if (view.kind === 'report') view = { kind: 'report', report: lastReport! };
    card.innerHTML = htmlFor(view);
    updateProgress();
    if (view.kind === 'report') animateScore(view.report.score);
  });

  // ---------- signal monitor ----------
  const ctx = canvas.getContext('2d')!;
  let cw = 0;
  let ch = 0;
  const sig = { amp: 0.08, chaos: 1, kick: 0 };
  const kick = () => {
    sig.kick = 1;
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = canvas.clientWidth;
    ch = canvas.clientHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  const draw = (time: number) => {
    const clarity = questions.length ? picks.size / questions.length : 0;
    const score = estimateScore();
    const targetAmp = view.kind === 'intro' ? 0.06 : 0.12 + 0.3 * clarity * (score / 100) + (view.kind === 'report' ? 0.08 : 0);
    const targetChaos = view.kind === 'report' ? 0.05 : 1 - clarity * 0.85;
    sig.amp = lerp(sig.amp, targetAmp, 0.04);
    sig.chaos = lerp(sig.chaos, targetChaos, 0.04);
    sig.kick = lerp(sig.kick, 0, 0.05);

    ctx.clearRect(0, 0, cw, ch);
    const mid = ch / 2;
    const tt = reducedMotion ? 0 : time;
    const grad = ctx.createLinearGradient(0, 0, cw, 0);
    grad.addColorStop(0, '#5b2bff');
    grad.addColorStop(0.5, '#b06bff');
    grad.addColorStop(1, '#c8ff3d');

    for (const pass of [0, 1]) {
      ctx.beginPath();
      for (let x = 0; x <= cw; x += 2) {
        const nx = x / cw;
        const clean = Math.sin(nx * Math.PI * 4 - tt * 3) * sig.amp * ch;
        const noise =
          (Math.sin(nx * 53 + tt * 7.3) * 0.5 + Math.sin(nx * 131 - tt * 11.7) * 0.3 + Math.sin(nx * 17 + tt * 2.1) * 0.6) *
          sig.chaos *
          ch *
          0.09;
        const k = Math.exp(-((nx - ((tt * 0.5) % 1)) ** 2) / 0.004) * sig.kick * ch * 0.3;
        const y = mid - clean - noise - k;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = pass ? 2 : 8;
      ctx.globalAlpha = pass ? 1 : 0.18;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  onFrameWhileVisible(canvas, draw);

  // First paint: question 1 is on screen from the start.
  card.innerHTML = htmlFor(view);
  updateProgress();
}
