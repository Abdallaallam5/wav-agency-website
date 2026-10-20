// Local development only: read SMTP_* and friends from .env if the file exists (Vercel uses its own settings).
try {
  process.loadEnvFile();
} catch {
  /* no .env file: fine */
}

const { default: app } = await import('./app.js');

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`WAV is live → http://localhost:${PORT}`);
});
