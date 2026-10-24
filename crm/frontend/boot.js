/* Boot — runs last, after every view and handler is defined. */
(function boot() {
  if (SESSION && API_URL && !isCloud()) SESSION = null; // a live URL is built in — no demo sessions
  if (SESSION && isCloud() && (!Sync.url() || !SESSION.token)) SESSION = null;
  if (SESSION) {
    if (!Store.load()) { if (isCloud()) SESSION = null; else seedDemo(); }
    if (SESSION && !userById(SESSION.userId)) SESSION = null;
  }
  setTimeout(() => $('#boot').classList.add('is-done'), 350);
  if (SESSION) startApp(); else renderLogin();
})();
