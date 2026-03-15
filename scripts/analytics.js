// Vercel Web Analytics loader for static pages
// Loads only on deployed domains to avoid 404s during local dev
// Usage: include with <script src="scripts/analytics.js" defer></script>
(function () {
  try {
    if (window.VERCEL_ANALYTICS_LOADED) return;
    var host = location.hostname;
    var isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
    if (isLocal) return;

    // Avoid duplicate insertion across partial reloads
    var existing = document.querySelector('script[data-vercel-insights]');
    if (existing) {
      window.VERCEL_ANALYTICS_LOADED = true;
      return;
    }

    var s = document.createElement('script');
    s.defer = true;
    s.src = '/_vercel/insights/script.js';
    s.setAttribute('data-vercel-insights', 'true');
    document.head.appendChild(s);
    window.VERCEL_ANALYTICS_LOADED = true;
  } catch (e) {
    // no-op
  }
})();

