import type { Lang, MomentumLevel, Report, ReportRequest, ServiceKey } from './types.js';
import { QUESTION_COUNT, findAnswer, serviceSummary } from './diagnostic.js';

const LEVELS: { min: number; level: MomentumLevel; label: Record<Lang, string> }[] = [
  { min: 85, level: 'wave', label: { en: 'Wave', ar: 'Wave' } },
  { min: 68, level: 'rising', label: { en: 'Rising', ar: 'في الطلوع' } },
  { min: 50, level: 'ripple', label: { en: 'Ripple', ar: 'تموّج خفيف' } },
  { min: 0, level: 'flatline', label: { en: 'Flatline', ar: 'خط مستقيم' } },
];

const COPY: Record<MomentumLevel, Record<Lang, { headline: string; summary: string }>> = {
  flatline: {
    en: {
      headline: 'Active — but not moving.',
      summary:
        "You're putting in effort across the board, but the pieces aren't connected. The good news: the biggest jumps come from fixing the right problem first.",
    },
    ar: {
      headline: 'نشيط… بس مش بيتحرك.',
      summary: 'فيه مجهود في كل حتة، بس الحاجات مش مربوطة ببعض. الخبر الحلو: أكبر قفزة بتيجي لما نحل المشكلة الصح الأول.',
    },
  },
  ripple: {
    en: {
      headline: 'Movement is starting. It needs direction.',
      summary:
        "Some parts of your brand already work. A few gaps are absorbing the momentum — close them and the ripple becomes a wave.",
    },
    ar: {
      headline: 'الحركة بدأت… محتاجة اتجاه.',
      summary: 'فيه أجزاء شغالة فعلاً، بس كام فجوة بيمتصّوا الـMomentum. نقفلهم والتموّج يتحول لـWave.',
    },
  },
  rising: {
    en: {
      headline: 'Strong foundations. Time to connect them.',
      summary:
        "You're ahead of most brands. The next level comes from turning separate wins into one connected growth system.",
    },
    ar: {
      headline: 'أساس قوي… وقت نربطه ببعض.',
      summary: 'انت سابق معظم البراندات. المستوى الجاي إننا نحوّل المكاسب المتفرقة لـGrowth system واحد.',
    },
  },
  wave: {
    en: {
      headline: 'You are making waves.',
      summary: "Your brand is moving. Let's protect that momentum and scale what's working into new markets and channels.",
    },
    ar: {
      headline: 'انت فعلاً عامل Wave.',
      summary: 'البراند بتاعك بيتحرك. خلينا نحافظ على الـMomentum ونكبّر اللي شغال لأسواق وقنوات جديدة.',
    },
  },
};

export class ReportError extends Error {}

export function buildReport({ lang, answers }: ReportRequest): Report {
  const seen = new Set<string>();
  const weights = new Map<ServiceKey, number>();
  const findings: Report['findings'] = [];
  let severity = 0;

  for (const { questionId, answerId } of answers) {
    if (seen.has(questionId)) continue;
    const found = findAnswer(lang, questionId, answerId);
    if (!found) throw new ReportError(`Unknown answer ${questionId}/${answerId}`);
    seen.add(questionId);

    const { question, answer } = found;
    severity += answer.severity;
    if (answer.severity > 0) findings.push({ area: question.area, headline: answer.diagnosis.headline });

    // The first service listed is the primary fix, so it carries more weight.
    answer.services.forEach((key, i) => {
      const w = (answer.severity || 0.5) * (i === 0 ? 1 : 0.5);
      weights.set(key, (weights.get(key) ?? 0) + w);
    });
  }

  if (seen.size === 0) throw new ReportError('No answers supplied');

  // Unanswered questions count as neutral (severity 1) so a partial quiz isn't over-rewarded.
  severity += (QUESTION_COUNT - seen.size) * 1;
  const maxSeverity = QUESTION_COUNT * 3;
  const score = Math.round(100 - (severity / maxSeverity) * 72);
  const tier = LEVELS.find((l) => score >= l.min)!;

  const priorities = [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => serviceSummary(key, lang));

  return {
    planId: `WAV-${Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, '0')}`,
    score,
    level: tier.level,
    levelLabel: tier.label[lang],
    ...COPY[tier.level][lang],
    priorities,
    findings,
  };
}
