/* Home page splash. An off-white cover with the name and a thin bar shows on every load of the home page, and the
   bar fills as three things finish: the fonts, the hero photos that have a source, and the 3D point portrait
   (header.hero gets a data-fx attribute). When all three are done the bar holds at full for a moment and the cover
   fades out. It also closes after 8 s at most, and at once on a click or tap on it, a key press, a wheel turn or a
   swipe. Under reduced motion it closes with no fade. The page underneath is never locked, hidden or changed.
   The small script in the head decides whether the splash shows at all (never for test browsers unless the URL has
   ?splash=on) and clears it after 9 s even when this file never loads. window.atelierSplash exposes the progress
   rules for the tests. */
(() => {
  const WEIGHTS = Object.freeze({ fonts: 20, photos: 40, portrait: 40 });
  const MAX_MS = 8000;
  const FADE_MS = 400;
  const FULL_HOLD_MS = 150;

  function progress(p) {
    const photos = p.photosTotal ? p.photosDone / p.photosTotal : 1;
    const value = Math.round(WEIGHTS.fonts * (p.fonts ? 1 : 0) + WEIGHTS.photos * photos + WEIGHTS.portrait * (p.portrait ? 1 : 0));
    return Math.min(100, Math.max(0, value));
  }
  // Time left before the 8 s limit, counted from the start of the page load. performance.now(), never Date.now(),
  // since the e2e specs freeze Date.
  const remaining = nowMs => Math.max(0, MAX_MS - nowMs);

  window.atelierSplash = Object.freeze({ WEIGHTS, MAX_MS, FADE_MS, FULL_HOLD_MS, progress, remaining });

  const root = document.documentElement;
  const splash = document.getElementById('splash');
  // Off, or already skipped by the head script before this file loaded.
  if (!root.classList.contains('splash-on') || root.dataset.splash !== 'open' || !splash) return;

  const fill = splash.querySelector('.splash-bar i');
  const hero = document.querySelector('header.hero');
  const state = { fonts: false, photosDone: 0, photosTotal: 0, portrait: false };
  let photosKnown = false;
  let shown = 0;
  let closed = false;
  let readyQueued = false;
  let finished = false;
  let observer = null;
  const timers = new Set();
  const offs = [];

  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
  };
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    offs.push(() => target.removeEventListener(type, fn, opts));
  };

  function update() {
    if (closed || readyQueued) return;
    // Until the photos are counted they add nothing, so the bar never jumps ahead and then has to wait.
    const parts = photosKnown ? state : { ...state, photosDone: 0, photosTotal: 1 };
    shown = Math.max(shown, progress(parts));
    splash.dataset.progress = String(shown);
    if (fill) fill.style.transform = `scaleX(${shown / 100})`;
    if (photosKnown && state.fonts && state.portrait && state.photosDone >= state.photosTotal) {
      readyQueued = true;
      later(() => close('ready'), FULL_HOLD_MS);
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    timers.clear();
    offs.splice(0).forEach(off => off());
    if (observer) observer.disconnect();
    splash.remove();
    root.classList.remove('splash-on');
    root.dataset.splash = 'done';
  }

  function close(reason) {
    if (closed || finished) return;
    closed = true;
    // The head script's failsafe may already have cleared the splash; keep its reason.
    if (root.dataset.splash === 'done') return finish();
    root.dataset.splashReason = reason;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
    root.dataset.splash = 'closing';
    on(splash, 'transitionend', e => { if (e.target === splash && e.propertyName === 'opacity') finish(); });
    later(finish, FADE_MS + 100);
  }

  const skip = () => close('skip');
  // click, not pointerdown, so the press ends on the splash and never lands on a link under it. No scroll listener:
  // a reload restores the scroll spot and would close the splash at once.
  on(splash, 'click', skip);
  const quiet = { passive: true, capture: true };
  on(window, 'keydown', skip, quiet);
  on(window, 'wheel', skip, quiet);
  on(window, 'touchmove', skip, quiet);

  later(() => close('timeout'), remaining(performance.now()));

  if (document.fonts && document.fonts.ready) {
    const fontsDone = () => { state.fonts = true; update(); };
    document.fonts.ready.then(fontsDone, fontsDone);
  } else {
    state.fonts = true;
  }

  if (!hero || hero.hasAttribute('data-fx')) {
    state.portrait = true;
  } else {
    observer = new MutationObserver(() => {
      if (!hero.hasAttribute('data-fx')) return;
      state.portrait = true;
      observer.disconnect();
      update();
    });
    observer.observe(hero, { attributes: true, attributeFilter: ['data-fx'] });
  }

  // Counted at DOMContentLoaded, after startHero has given the costume photo its source.
  function countPhotos() {
    const imgs = [...document.querySelectorAll('header.hero img')].filter(img => img.getAttribute('src'));
    state.photosTotal = imgs.length;
    photosKnown = true;
    imgs.forEach(img => {
      if (img.complete) { state.photosDone++; return; }
      let counted = false;
      // A photo that fails still counts, so it never holds the splash.
      const done = () => {
        if (counted) return;
        counted = true;
        state.photosDone++;
        update();
      };
      on(img, 'load', done);
      on(img, 'error', done);
    });
    update();
  }
  if (document.readyState === 'loading') on(document, 'DOMContentLoaded', countPhotos, { once: true });
  else countPhotos();

  update();
})();
