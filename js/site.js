/* Shared behaviour for the public pages: theme toggle + mobile nav. */
(function () {
  const KEY = "aire-theme";
  const root = document.documentElement;
  function safeGet() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function safeSet(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* ignore */ } }

  const saved = safeGet();
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;

  function isDark() {
    if (root.dataset.theme) return root.dataset.theme === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function paint() {
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => {
      b.setAttribute("aria-label", isDark() ? "Switch to light mode" : "Switch to dark mode");
      b.innerHTML = isDark()
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    });
  }
  window.AireTheme = {
    toggle() { root.dataset.theme = isDark() ? "light" : "dark"; safeSet(root.dataset.theme); paint(); },
    paint,
  };
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-theme-toggle]");
    if (t) window.AireTheme.toggle();
    const n = e.target.closest("[data-nav-toggle]");
    if (n) {
      const nav = document.getElementById("site-nav");
      const open = nav.classList.toggle("open");
      n.setAttribute("aria-expanded", String(open));
    }
  });
  document.addEventListener("DOMContentLoaded", paint);
})();
