/* Scroll entrances, shared by every Atelier page. Blocks that start below the fold are held invisible, then animate
   into place as they scroll into view, one after another when several arrive together. Each page picks its own
   style with data-reveal on <body> (see STYLES). Numbers marked data-count run up from 0 as their block comes in.
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
    '.qa > h2', '.qa-answer', '.qa-facts > div',
    '.work-head', '.sec-lead', '.index > li',
    '.band-head', '.t-viewport', '.st-row',
    '.faq-side > *', '.faq-item', '.close > *',
    '.g-item', '.g-credit',
    '.stage', '.story .beat', '.human', '.explain > .eyebrow', '.explain > h2', '#explain > li', '.a-cta',
    '.pn > a', '.foot > *',
  ].join(',');

  const STYLES = {
    // Home. Rise and grow, then settle with a small overshoot, like a card popping up.
    pop: {
      frames: [{ opacity: 0, translate: '0 40px', scale: '.94' }, { opacity: 1, translate: '0 0', scale: '1' }],
      duration: 800, easing: 'cubic-bezier(.175, .885, .32, 1.275)', step: 80,
    },
    // Gear. Tip up from lying flat, like a product being stood up on a table.
    lift: {
      frames: [
        { opacity: 0, transform: 'perspective(1200px) translateY(70px) rotateX(24deg)', transformOrigin: '50% 100%' },
        { opacity: 1, transform: 'perspective(1200px) translateY(0) rotateX(0deg)', transformOrigin: '50% 100%' },
      ],
      duration: 1100, easing: 'cubic-bezier(.16, 1, .3, 1)', step: 120,
    },
    // Automations. Wipe in from the left, the way a run moves through a workflow.
    wipe: {
      frames: [
        { opacity: 0, clipPath: 'inset(0 100% 0 0)', translate: '-28px 0' },
        { opacity: 1, clipPath: 'inset(0 0% 0 0)', translate: '0 0' },
      ],
      duration: 900, easing: 'cubic-bezier(.65, 0, .35, 1)', step: 90,
    },
  };
  const style = STYLES[document.body.dataset.reveal] || STYLES.pop;
  // While a block waits it is only faded out, never moved or clipped. The observer measures what is actually
  // painted, so a block clipped to nothing would never count as showing and would wait forever.
  const HOLD = [{ opacity: 0 }, { opacity: 0 }];
  // fill:backwards keeps a block at the start pose while it waits its turn, and drops the effect once it lands.
  const TIMING = { duration: style.duration, easing: style.easing, fill: 'backwards' };
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
        due.push({ el, top: Math.round(r.top), left: r.left });
      }
    }
    due.sort((a, b) => a.top - b.top || a.left - b.left);
    due.forEach(({ el }, i) => {
      const delay = Math.min(i, MAX_STEPS) * style.step;
      held.get(el).cancel();
      held.delete(el);
      io.unobserve(el);
      el.animate(style.frames, { ...TIMING, delay });
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
      if (el.parentElement.closest(TARGETS)) return;
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
