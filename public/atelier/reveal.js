/* Scroll entrances, shared by every Atelier page. Blocks that start below the fold are held invisible, then animate
   into place as they scroll into view, one after another when several arrive together. Every page uses the dot
   style: a block shows through a fine dot screen whose dots grow until they touch and the block is solid, while a
   soft edge sweeps across it. Big blocks, and browsers that cannot animate a mask, get a plain fade and rise
   instead, so scrolling stays smooth. Nothing inside the project deck or the hero is ever touched, since both run
   their own motion. Numbers marked data-count run up from 0 as their block comes in.
   Blocks already on screen when the page loads are left alone, so nothing flashes. The hold and the entrance are
   both Web Animations, so no class or inline style is left behind once a block is in. Reduced motion, printing and
   a page without JS all show everything as normal. A page that redraws its content calls
   atelierReveal.refresh(root) afterwards, which also re-arms the blocks already inside root. */
(() => {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;

  // Home, then gear, then automations. Never list a block together with one of its own children.
  const TARGETS = [
    '.work-head', '.sec-lead', '.index > li', '.calc',
    '.band-head', '.t-viewport', '.st-row',
    '.faq-side > *', '.faq-item', '.close > *',
    '.g-item', '.g-credit',
    '.sec-head', '.case',
    '.stage', '.story .beat', '.human', '.try', '.explain > .eyebrow', '.explain > h2', '#explain > li', '.a-cta',
    '.pn > a', '.foot > *',
  ].join(',');
  const SKIP = '#deck, .hero';

  // The dot screen is two mask layers added together: a soft edge that sweeps across the block, and a 9px grid of
  // dots that grow from nothing to 7px. At 7px the dots overlap and cover every tile, so the last frame is solid
  // and nothing jumps when the animation lets go. Both sizes are registered properties, so they animate smoothly.
  const MASK = 'linear-gradient(100deg, #000 var(--fx-sweep), transparent calc(var(--fx-sweep) + 25%)), '
    + 'radial-gradient(circle, #000 var(--fx-dot), transparent calc(var(--fx-dot) + 1px))';
  const dotPose = (dot, sweep, rise) => ({
    '--fx-dot': dot, '--fx-sweep': sweep, translate: rise,
    maskImage: MASK, webkitMaskImage: MASK, maskSize: '100% 100%, 9px 9px', webkitMaskSize: '100% 100%, 9px 9px',
    maskComposite: 'add', webkitMaskComposite: 'source-over',
  });
  const STYLES = {
    dot: { frames: [dotPose('0px', '-30%', '0 14px'), dotPose('7px', '130%', '0 0')], duration: 1100, easing: 'cubic-bezier(.45, 0, .2, 1)', step: 110 },
  };
  const PLAIN = { frames: [{ opacity: 0, translate: '0 14px' }, { opacity: 1, translate: '0 0' }], duration: 900 };
  const masks = !!(window.CSS && CSS.registerProperty && CSS.supports && CSS.supports('mask-image', 'radial-gradient(#000, #000)'));
  if (masks) {
    for (const [name, syntax, initialValue] of [['--fx-dot', '<length>', '0px'], ['--fx-sweep', '<percentage>', '130%']]) {
      try { CSS.registerProperty({ name, syntax, inherits: false, initialValue }); } catch { /* already registered by an earlier run */ }
    }
  }
  const style = STYLES[document.body.dataset.reveal] || STYLES.dot;
  // A mask repaints the whole block every frame, so a block taller than 90% of the window, or bigger than 60% of
  // its area, gets the plain fade and rise.
  function framesFor(r) {
    if (!masks) return PLAIN;
    const vw = innerWidth, vh = innerHeight;
    return r.height > vh * 0.9 || r.width * r.height > vw * vh * 0.6 ? PLAIN : style;
  }
  // While a block waits it is only faded out, never moved or clipped. The observer measures what is actually
  // painted, so a block clipped to nothing would never count as showing and would wait forever.
  const HOLD = [{ opacity: 0 }, { opacity: 0 }];
  // fill:backwards keeps a block at the start pose while it waits its turn, and drops the effect once it lands.
  const TIMING = { easing: style.easing, fill: 'backwards' };
  const MAX_STEPS = 7, COUNT_MS = 1400;

  const known = new WeakSet(); // every block ever handed to the observer
  const fresh = new WeakSet(); // blocks whose next report decides whether they wait
  const held = new Map(); // block → the paused fade that keeps it hidden

  // Runs a number from 0 up to its real value, fast at first and slowing into the last digits. Screen readers get
  // the real value the whole time, and the plain text goes back in once the count lands.
  function countUp(el, delay) {
    const text = el.textContent, end = parseInt(text, 10);
    if (!(end > 0)) return;
    const shown = document.createElement('span');
    const real = document.createElement('span');
    shown.setAttribute('aria-hidden', 'true');
    shown.textContent = '0';
    real.textContent = text;
    real.style.cssText = 'position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap';
    el.replaceChildren(shown, real);
    const start = performance.now() + delay;
    const tick = now => {
      const t = Math.min(1, Math.max(0, (now - start) / COUNT_MS));
      if (t === 1) { el.textContent = text; return; }
      shown.textContent = Math.round(end * (1 - Math.pow(1 - t, 4)));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // A held block comes in once a quarter of it shows. That still fires for the last lines of a page, which can
  // never scroll up past a bottom margin.
  const SHOWING = 0.25;
  const io = new IntersectionObserver(entries => {
    const due = [];
    for (const e of entries) {
      const el = e.target, r = e.boundingClientRect;
      if (fresh.has(el)) {
        fresh.delete(el);
        // Any part already on screen stays put.
        if (e.isIntersecting) { io.unobserve(el); continue; }
        const hold = el.animate(HOLD, 1000);
        hold.pause();
        held.set(el, hold);
      } else if (e.intersectionRatio >= SHOWING && held.has(el)) {
        due.push({ el, r, top: Math.round(r.top), left: r.left });
      }
    }
    // A block the page scrolled straight past, too fast for any report, is let go as it is. Nobody saw it wait,
    // and scrolling back up must never find it missing.
    for (const [el, hold] of held) {
      if (el.getBoundingClientRect().bottom < 0) { hold.cancel(); held.delete(el); io.unobserve(el); }
    }
    due.sort((a, b) => a.top - b.top || a.left - b.left);
    due.forEach(({ el, r }, i) => {
      const delay = Math.min(i, MAX_STEPS) * style.step;
      held.get(el).cancel();
      held.delete(el);
      io.unobserve(el);
      const look = framesFor(r);
      el.animate(look.frames, { ...TIMING, duration: look.duration, delay });
      el.querySelectorAll('[data-count]').forEach(n => countUp(n, delay + 100));
    });
  }, { threshold: [0, SHOWING] });

  function arm(el) {
    const hold = held.get(el);
    if (hold) { hold.cancel(); held.delete(el); }
    io.unobserve(el);
    known.add(el);
    fresh.add(el);
    io.observe(el);
  }

  function refresh(root) {
    if (reduce.matches) return;
    for (const [el, hold] of held) if (!el.isConnected) { hold.cancel(); held.delete(el); io.unobserve(el); }
    document.querySelectorAll(TARGETS).forEach(el => {
      if (el.parentElement.closest(TARGETS) || el.closest(SKIP)) return;
      if (!known.has(el) || (root && root.contains(el) && !held.has(el))) arm(el);
    });
  }

  // Show everything at once, for printing or when reduced motion is switched on mid-visit.
  function releaseAll() {
    for (const hold of held.values()) hold.cancel();
    held.clear();
    io.disconnect();
  }
  addEventListener('beforeprint', releaseAll);
  reduce.addEventListener('change', () => { if (reduce.matches) releaseAll(); });

  window.atelierReveal = { refresh };
  refresh();
})();
