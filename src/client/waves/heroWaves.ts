import { finePointer, lerp, onFrameWhileVisible, reducedMotion } from '../ticker';

/**
 * The hero background: silk ribbons drawn from dozens of phase-shifted sine lines.
 * The cursor pulls the ribbons toward it, and every click sends out a ripple.
 */

interface Ribbon {
  y: number; // vertical centre, 0..1 of height
  amp: number; // amplitude, fraction of height
  freq: number;
  speed: number;
  phase: number;
  lines: number;
  spread: number; // px between the outer lines
  from: [number, number, number];
  to: [number, number, number];
  alpha: number;
  gradient?: CanvasGradient;
}

interface Ripple {
  x: number;
  y: number;
  born: number;
}

const RIBBONS: Ribbon[] = [
  { y: 0.66, amp: 0.12, freq: 1.15, speed: 0.42, phase: 0, lines: 16, spread: 120, from: [91, 43, 255], to: [224, 123, 255], alpha: 0.55 },
  { y: 0.58, amp: 0.085, freq: 1.9, speed: -0.3, phase: 2.1, lines: 11, spread: 70, from: [139, 61, 255], to: [91, 120, 255], alpha: 0.32 },
  { y: 0.8, amp: 0.06, freq: 0.8, speed: 0.22, phase: 4.2, lines: 8, spread: 150, from: [176, 107, 255], to: [91, 43, 255], alpha: 0.22 },
];

const TAU = Math.PI * 2;

export function initHeroWaves(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let step = 10;
  let now = 0;
  const pointer = { x: -9999, y: 0, tx: -9999, ty: 0, influence: 0, lastMove: 0 };
  const ripples: Ripple[] = [];
  const stars = Array.from({ length: 36 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3, s: Math.random() * 0.4 + 0.1 }));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    step = w < 700 ? 20 : 14;
    for (const r of RIBBONS) {
      const g = ctx!.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, `rgb(${r.from.join(',')})`);
      g.addColorStop(0.5, `rgb(${r.to.join(',')})`);
      g.addColorStop(1, `rgb(${r.from.join(',')})`);
      r.gradient = g;
    }
  }

  function ribbonY(r: Ribbon, x: number, k: number, t: number) {
    const nx = x / w;
    const breathe = 0.65 + 0.35 * Math.sin(t * 0.35 + k * 2.4 + r.phase);
    let y =
      r.y * h +
      Math.sin(nx * r.freq * TAU + t * r.speed + r.phase + k * 1.1) * r.amp * h * breathe +
      Math.sin(nx * r.freq * 2.3 * TAU - t * r.speed * 1.6 + k * 2.2) * r.amp * h * 0.3 +
      (k - 0.5) * r.spread * (1 + 0.6 * Math.sin(nx * 3.2 + t * 0.45 + r.phase));

    // Cursor: a soft gaussian pull toward the pointer.
    if (pointer.influence > 0.01) {
      const dx = x - pointer.x;
      const g = Math.exp(-(dx * dx) / (2 * 170 * 170));
      y += (pointer.y - y) * g * 0.42 * pointer.influence;
    }

    // Ripples: an expanding ring that displaces the lines it passes through.
    for (const rp of ripples) {
      const age = t - rp.born;
      const radius = age * 520;
      const d = Math.hypot(x - rp.x, y - rp.y);
      const ring = Math.exp(-((d - radius) ** 2) / (2 * 55 * 55));
      y += Math.sin(d * 0.045 - age * 9) * ring * 46 * Math.max(0, 1 - age / 2.2);
    }
    return y;
  }

  function draw(t: number) {
    ctx!.clearRect(0, 0, w, h);

    // Drifting particles
    ctx!.globalCompositeOperation = 'source-over';
    for (const s of stars) {
      const sx = ((s.x + t * s.s * 0.01) % 1) * w;
      const sy = s.y * h + Math.sin(t * s.s + s.x * 10) * 6;
      ctx!.fillStyle = `rgba(200,180,255,${0.15 + 0.25 * Math.sin(t * s.s * 3 + s.y * 20) ** 2})`;
      ctx!.beginPath();
      ctx!.arc(sx, sy, s.r, 0, TAU);
      ctx!.fill();
    }

    ctx!.globalCompositeOperation = 'lighter';
    ctx!.lineWidth = 1;
    for (const r of RIBBONS) {
      ctx!.strokeStyle = r.gradient!;
      for (let i = 0; i < r.lines; i++) {
        const k = i / (r.lines - 1);
        ctx!.globalAlpha = r.alpha * (0.2 + 0.8 * Math.sin(k * Math.PI));
        ctx!.beginPath();
        for (let x = -step; x <= w + step; x += step) {
          const y = ribbonY(r, x, k, t);
          if (x === -step) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }
    }
    ctx!.globalAlpha = 1;
  }

  let lastDraw = 0;
  function frame(t: number) {
    now = t;
    if (t - lastDraw < 0.024) return; // cap at ~40fps — smooth enough, half the work
    lastDraw = t;
    pointer.x = lerp(pointer.x, pointer.tx, 0.08);
    pointer.y = lerp(pointer.y, pointer.ty, 0.08);
    const idle = t - pointer.lastMove > 2.5;
    pointer.influence = lerp(pointer.influence, idle || pointer.tx < -999 ? 0 : 1, 0.04);
    while (ripples.length && t - ripples[0].born > 2.2) ripples.shift();
    draw(t);
  }

  resize();
  new ResizeObserver(resize).observe(canvas);

  if (reducedMotion) {
    draw(3);
    return;
  }

  const hero = canvas.parentElement!;
  hero.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.tx = e.clientX - rect.left;
    pointer.ty = e.clientY - rect.top;
    if (pointer.x < -999) {
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
    }
    pointer.lastMove = now;
  });
  hero.addEventListener('pointerleave', () => {
    pointer.tx = -9999;
  });
  hero.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    const rect = canvas.getBoundingClientRect();
    ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, born: now });
    if (ripples.length > 6) ripples.shift();
  });

  // On touch devices, keep things alive with an occasional automatic ripple.
  if (!finePointer) {
    setInterval(() => {
      if (document.visibilityState === 'visible') ripples.push({ x: Math.random() * w, y: h * (0.55 + Math.random() * 0.25), born: now });
    }, 3800);
  }

  onFrameWhileVisible(canvas, frame, '0px');
}
