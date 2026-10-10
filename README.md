# WAV — Agency Website

Interactive, animation-led website for **WAV Marketing Agency**. Built with Express and TypeScript.
*Don't follow the wave. Be the wave.*

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 — server + client rebuild on save
```

Production:

```bash
npm run build
NODE_ENV=production npm start   # PORT env var optional (default 3000)
```

`npm run typecheck` checks both the server and the client.

## What's inside

| Section | Wave / interaction |
|---|---|
| Hero | Canvas "silk ribbon" waves. They bend toward the cursor, and clicks send out ripples. The headline letters rise on a wave and lift when you hover. |
| Wave marquee | Words bobbing on a wave (pure CSS) |
| Story | A book whose pages turn as you scroll, or when tapped, while a flat EKG line behind it grows into a wave |
| Approach | A dotted wave path that draws itself as you scroll |
| **Pulse check** | The interactive centerpiece. Six questions about brand weaknesses. Each answer shows our diagnosis and the WAV solution. A live "brand signal" goes from noise to a clean wave. Ends with a momentum score, findings, and a plan that can be attached to the contact form. |
| Services | A liquid wave fills each card on hover, with a ripple where the pointer enters |
| Clients | Two logo marquees, with the logos bobbing on a travelling wave |
| Footer | A liquid wave fills the "WAV" wordmark |

English and Arabic (RTL) are included. Use the EN / ع toggle, or add `?lang=ar` to the URL. The visitor's choice is remembered.
Animations respect `prefers-reduced-motion`.

## Structure

```
src/
  server/            Express app (helmet CSP, compression, rate limiting)
    routes/api.ts        GET /api/diagnostic · POST /api/diagnostic/report · POST /api/contact
    lib/leadStore.ts     contact submissions → data/leads.json
  client/            Browser TypeScript (bundled by esbuild → public/js/main.js)
    waves/           hero canvas, story, marquee, wave text, ambient waves
    pulse.ts         pulse-check UI
    i18n.ts          Arabic copy + UI strings
  shared/
    diagnostic.ts    ← pulse-check questions, answers & solutions (EN + AR). Edit copy here.
    report.ts        ← momentum score + plan logic (runs in the browser, so no API is needed)
    types.ts         types shared by server and client
public/              index.html, css/styles.css, assets (images taken from the company profile)
```

## Before going live

- **Contact details**: the profile has no email, phone or socials, so the contact section only shows the website and "Egypt". Add yours in `public/index.html` (`.contact__info`).
- **Leads**: leads are saved to `data/leads.json` locally (on Vercel: function logs). Connect `LeadStore` to email, WhatsApp, a CRM or a database.
- **Case studies**: the Work section uses the Moamenoon and Crazy Crisps/Honey visuals from the profile. Swap in higher-resolution originals if you have them.

## Deploy on Vercel

The repo is set up for Vercel's zero-config Express support:

- `src/index.ts` default-exports the Express app (Vercel's entrypoint). `src/server/index.ts` is only for local `app.listen`.
- `public/**` is served by Vercel's CDN. `vercel.json` runs `npm run build:client` so `public/js/main.js` gets built during deploy.
- On Vercel, contact leads go to `/tmp/leads.json`, which is ephemeral, and are also printed to the function logs as `[lead] {...}`. Connect `LeadStore` to email or a CRM so leads are kept.

Steps: vercel.com → **Add New → Project** → import this GitHub repo → **Deploy**. You don't need to change any settings.
