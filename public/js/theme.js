/**
 * LinkShield Pro — Seamless Dark / Light Theme Engine
 * Persistent state, dynamic transitions, synchronized switches across screens
 */
(function () {
  'use strict';

  function getSavedTheme() {
    const saved = localStorage.getItem('linkshield_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Default to 'dark' mode as requested
    return 'dark';
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    }

    localStorage.setItem('linkshield_theme', theme);
    syncToggleButtons(theme);
  }

  function syncToggleButtons(theme) {
    const buttons = document.querySelectorAll('.theme-switch-pill');
    buttons.forEach((btn) => {
      const label = btn.querySelector('.theme-switch-label');
      if (label) {
        label.textContent = theme === 'dark' ? 'Dark' : 'Light';
      }
      if (theme === 'dark') {
        btn.classList.add('is-dark');
        btn.classList.remove('is-light');
      } else {
        btn.classList.remove('is-dark');
        btn.classList.add('is-light');
      }
    });
  }

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  };

  // Immediate theme apply to prevent flash of wrong theme
  const initialTheme = getSavedTheme();
  document.documentElement.setAttribute('data-theme', initialTheme);

  // Once DOM is loaded, ensure classList and buttons are synchronized
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyTheme(initialTheme);
    });
  } else {
    applyTheme(initialTheme);
  }
})();
