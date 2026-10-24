// Bundles the source files in this folder into one self-contained index.html.
// Usage: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(root, f), 'utf8');

const css = read('styles.css');
const shell = read('shell.html');
const js = ['config.js', 'i18n.js', 'core.js', 'metrics.js', 'ui.js', 'views.js', 'agency.js', 'boot.js'].map(read).join('\n');

const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#07060b" />
<meta name="robots" content="noindex, nofollow" />
<title>WAV CRM — Growth OS</title>
<meta name="description" content="WAV's internal CRM: leads, clients, projects, content calendar, invoices and team." />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 124 124'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='.3'%3E%3Cstop offset='0' stop-color='%235b2bff'/%3E%3Cstop offset='.5' stop-color='%239b4dff'/%3E%3Cstop offset='1' stop-color='%23e07bff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='124' height='124' rx='28' fill='%2307060b'/%3E%3Cpath d='M10 36 C 20 36 25 88 39 88 C 51 88 53 56 62 56 C 71 56 73 88 85 88 C 100 88 106 46 116 32' fill='none' stroke='url(%23g)' stroke-width='13' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Alexandria:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
${css}
</style>
</head>
<body>
${shell}
<script>
${js}
</script>
</body>
</html>
`;

writeFileSync(join(root, 'index.html'), html, 'utf8');
console.log(`built index.html (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);
