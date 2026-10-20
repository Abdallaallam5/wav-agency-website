import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface Lead {
  id: string;
  receivedAt: string;
  name: string;
  company?: string;
  contact: string;
  service?: string;
  message?: string;
  planId?: string;
  pulse?: { score: number; level: string; findings: string[]; services: string[] };
  lang?: string;
  ip?: string;
}

/**
 * Minimal JSON-file lead store. Good enough for a marketing site's contact form;
 * swap for a database, CRM webhook or email service when you go to production.
 */
export class LeadStore {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly file: string) {}

  add(lead: Lead): Promise<void> {
    if (process.env.VERCEL) console.log('[lead]', JSON.stringify(lead));
    // Serialize writes so concurrent submissions can't clobber each other.
    const run = this.queue.then(async () => {
      const leads = await this.readAll();
      leads.push(lead);
      await mkdir(path.dirname(this.file), { recursive: true });
      await writeFile(this.file, JSON.stringify(leads, null, 2), 'utf8');
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  async readAll(): Promise<Lead[]> {
    try {
      return JSON.parse(await readFile(this.file, 'utf8')) as Lead[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
  }
}
