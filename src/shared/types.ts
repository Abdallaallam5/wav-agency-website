// Types shared between the Express API and the browser client.

export type Lang = 'en' | 'ar';

export type ServiceKey =
  | 'strategy'
  | 'content'
  | 'media'
  | 'tech'
  | 'digital'
  | 'growth'
  | 'print';

export interface Solution {
  /** Short name of the WAV fix, e.g. "A content system, not a posting schedule". */
  title: string;
  /** Three concrete things WAV does. */
  steps: string[];
  /** What the client gets out of it. */
  outcome: string;
}

export interface Answer {
  id: string;
  /** The answer as the visitor would say it — shown as a headline button. */
  label: string;
  /** Our read of what that answer really means. */
  diagnosis: { headline: string; text: string };
  solution: Solution;
  services: ServiceKey[];
  /** 0 = healthy, 3 = urgent. Drives the momentum score. */
  severity: 0 | 1 | 2 | 3;
}

export interface Question {
  id: string;
  /** Area tag shown above the question, e.g. "Content". */
  area: string;
  text: string;
  answers: Answer[];
}

export interface DiagnosticPayload {
  lang: Lang;
  questions: Question[];
}

export interface ReportRequest {
  lang: Lang;
  answers: { questionId: string; answerId: string }[];
}

export type MomentumLevel = 'flatline' | 'ripple' | 'rising' | 'wave';

export interface ServiceSummary {
  key: ServiceKey;
  name: string;
  pitch: string;
}

export interface Report {
  planId: string;
  score: number;
  level: MomentumLevel;
  levelLabel: string;
  headline: string;
  summary: string;
  priorities: ServiceSummary[];
  findings: { area: string; headline: string }[];
}

export interface ContactRequest {
  name: string;
  company?: string;
  contact: string;
  service?: string;
  message?: string;
  planId?: string;
  lang?: Lang;
  /** Honeypot — real visitors never fill this in. */
  website?: string;
}
