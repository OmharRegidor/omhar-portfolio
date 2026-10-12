/* Scroll pop-ins, shared by every Atelier page. Blocks that start below the fold are held invisible, then pop up
   into place as they scroll into view. They rise, grow a little and settle with a small overshoot, and blocks that
   arrive together pop one after another. Blocks already on screen when the page loads are left alone, so nothing
   flashes. The hold and the pop are both Web Animations, so no class or inline style is left behind once a block
   is in. Reduced motion, printing and a page without JS all show everything as normal. A page that redraws its
   content calls atelierReveal.refresh(root) afterwards, which also re-arms the blocks already inside root. */
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
  const POP = [
    { opacity: 0, translate: '0 40px', scale: '.94' },
    { opacity: 1, translate: '0 0', scale: '1' },
  ];
  // fill:backwards keeps a block at the start pose while it waits its turn, and drops the effect once it lands.
  const TIMING = { duration: 800, easing: 'cubic-bezier(.175, .885, .32, 1.275)', fill: 'backwards' };
  const STEP = 80, MAX_STEPS = 7;

  const known = new WeakSet(); // every block ever handed to the observer
  const fresh = new WeakSet(); // blocks whose next report decides whether they wait
  const held = new Map(); // block → its paused pop

  // A held block pops once a quarter of it shows. That still fires for the last lines of a page, which can never
  // scroll up past a bottom margin.
  const SHOWING = 0.25;
  const io = new IntersectionObserver(entries => {
    const due = [];
    for (const e of entries) {
      const el = e.target, r = e.boundingClientRect;
      if (fresh.has(el)) {
        fresh.delete(el);
        // Any part already on screen stays put.
        if (e.isIntersecting) { io.unobserve(el); continue; }
        const pop = el.animate(POP, TIMING);
        pop.pause();
        held.set(el, pop);
      } else if (e.intersectionRatio >= SHOWING && held.has(el)) {
        due.push({ el, top: Math.round(r.top), left: r.left });
      }
    }
    due.sort((a, b) => a.top - b.top || a.left - b.left);
    due.forEach(({ el }, i) => {
      const pop = held.get(el);
      held.delete(el);
      io.unobserve(el);
      pop.effect.updateTiming({ delay: Math.min(i, MAX_STEPS) * STEP });
      pop.play();
    });
  }, { threshold: [0, SHOWING] });

  function arm(el) {
    const pop = held.get(el);
    if (pop) { pop.cancel(); held.delete(el); }
    io.unobserve(el);
    known.add(el);
    fresh.add(el);
    io.observe(el);
  }

  function refresh(root) {
    if (reduce.matches) return;
    for (const [el, pop] of held) if (!el.isConnected) { pop.cancel(); held.delete(el); io.unobserve(el); }
    document.querySelectorAll(TARGETS).forEach(el => {
      if (el.parentElement.closest(TARGETS)) return;
      if (!known.has(el) || (root && root.contains(el) && !held.has(el))) arm(el);
    });
  }

  // Show everything at once, for printing or when reduced motion is switched on mid-visit.
  function releaseAll() {
    for (const pop of held.values()) pop.cancel();
    held.clear();
    io.disconnect();
  }
  addEventListener('beforeprint', releaseAll);
  reduce.addEventListener('change', () => { if (reduce.matches) releaseAll(); });

  window.atelierReveal = { refresh };
  refresh();
})();
