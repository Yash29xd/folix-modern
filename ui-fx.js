/**
 * @file ui-fx.js
 * @description Lightweight UI choreography and workspace action bindings for Folix v1.3.
 *
 * Keeps motion minimal and purposeful: a single ease-out entrance curve
 * (cubic-bezier(0.22, 1, 0.36, 1)) with fail-safe release, reduced-motion compliance,
 * and direct action/theme bindings for the empty-state workspace.
 */
(() => {
  'use strict';

  const reduceMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initMotionEntrance() {
    const appearEls = document.querySelectorAll('.fx-appear');
    appearEls.forEach(el => {
      el.addEventListener('animationend', e => {
        if (e.target === el) el.classList.add('is-in');
      });
    });

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (reduceMotion()) {
          appearEls.forEach(el => el.classList.add('is-in'));
          return;
        }
        const anyRunning = [...appearEls].some(el =>
          (el.getAnimations ? el.getAnimations() : []).some(
            a => a.playState === 'running' || a.playState === 'finished'
          )
        );
        if (!anyRunning) appearEls.forEach(el => el.classList.add('is-in'));
      })
    );
  }

  function syncThemeBadge() {
    const badge = document.getElementById('bento-theme-badge');
    const toggle = document.querySelector('[data-theme-toggle="text"]');
    if (!badge) return;
    if (toggle && toggle.textContent) {
      badge.textContent = toggle.textContent.replace(/^Theme:\s*/i, '') || 'Light';
      return;
    }
    const t = document.documentElement.dataset.theme || 'light';
    const names = { light: 'Light', 'dark-ui': 'Dark UI', dark: 'Dark', sepia: 'Sepia' };
    badge.textContent = names[t] || 'Light';
  }

  function initWorkspaceActions() {
    syncThemeBadge();
    const mo = new MutationObserver(syncThemeBadge);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    document.querySelectorAll('[data-fx-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const act = btn.dataset.fxAction;
        if (act === 'open') {
          const f = document.getElementById('file');
          if (f) f.click();
        } else if (act === 'word-studio') {
          const createBtn = document.getElementById('btn-create-pdf');
          if (createBtn) createBtn.click();
          setTimeout(() => {
            const docOpt = document.getElementById('opt-create-doc');
            if (docOpt) docOpt.click();
          }, 40);
        } else if (act === 'img-pdf') {
          const createBtn = document.getElementById('btn-create-pdf');
          if (createBtn) createBtn.click();
          setTimeout(() => {
            const imgOpt = document.getElementById('opt-create-img');
            if (imgOpt) imgOpt.click();
          }, 40);
        } else if (act === 'cmd') {
          const cmdTrigger = document.querySelector('#top-menus [data-action="cmd"]');
          if (cmdTrigger) cmdTrigger.click();
        } else if (act === 'shortcuts') {
          const hk = document.getElementById('hkb2');
          if (hk) hk.click();
        } else if (act === 'theme') {
          const toggle = document.querySelector('[data-theme-toggle]');
          if (toggle) {
            toggle.click();
            syncThemeBadge();
          }
        }
      });
    });
  }

  function boot() {
    initMotionEntrance();
    initWorkspaceActions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
