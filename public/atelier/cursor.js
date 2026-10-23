/* A quiet custom cursor for mouse users. A small dot trails the pointer and inverts whatever it passes over, swells
   over links so their text flips colour under it, and turns into a labelled disc over the project rows. Booking
   buttons lean toward it. It hides over text fields, where the normal text cursor comes back. Built on Cuberto's mouse-follower (MIT) and GSAP (free
   under GreenSock's no-charge licence), both kept in /atelier/vendor and only downloaded when a mouse is present
   and motion is allowed, so phones, tablets and reduced motion never load them. */
(() => {
  const mouse = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (!mouse.matches || reduce.matches) return;

  // Hover labels, as selector → text shown inside the disc.
  const LABELS = { '.index .row': 'View', '.pcard': 'View' };

  const css = `
html.has-cursor, html.has-cursor *{ cursor:none !important }
html.has-cursor :is(input, textarea, select, [contenteditable]){ cursor:auto !important }
.mf-cursor{ position:fixed; top:0; left:0; z-index:250; direction:ltr; contain:layout style size; pointer-events:none; mix-blend-mode:exclusion; transition:opacity 300ms ease }
.mf-cursor::before{ content:""; position:absolute; top:-24px; left:-24px; width:48px; height:48px; border-radius:50%; background:#FFFFFF; scale:.22; transition:scale 300ms cubic-bezier(.22, 1, .36, 1), background-color 200ms ease }
.mf-cursor.-pointer::before{ scale:.9 }
.mf-cursor.-active::before{ scale:.16 }
.mf-cursor.-pointer.-active::before{ scale:.78 }
.mf-cursor.-hidden::before{ scale:0 }
.mf-cursor.-text{ mix-blend-mode:normal }
.mf-cursor.-text::before{ scale:1.45; background:var(--accent, #111111) }
.mf-cursor.-text.-active::before{ scale:1.3 }
.mf-cursor-text{ position:absolute; top:-18px; left:-18px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; color:var(--on-accent, #FFFFFF); font:500 12px/1 var(--sans, system-ui, sans-serif); letter-spacing:.14em; text-transform:uppercase; opacity:0; scale:0; rotate:10deg; transition:opacity 300ms ease, scale 300ms ease, rotate 300ms ease }
.mf-cursor.-text .mf-cursor-text{ opacity:1; scale:1; rotate:0deg }
.mf-cursor-media{ display:none }
/* Booking buttons lean a few pixels toward the pointer while it is over them. */
html.has-cursor .book{ transition:gap 350ms var(--ease, ease), filter 200ms ease, translate 450ms cubic-bezier(.22, 1, .36, 1) }`;

  const load = src => new Promise((done, fail) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = done;
    s.onerror = fail;
    document.head.append(s);
  });

  load('/atelier/vendor/gsap.min.js')
    .then(() => load('/atelier/vendor/mouse-follower.min.js'))
    .then(() => {
      document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
      for (const [sel, text] of Object.entries(LABELS)) document.querySelectorAll(sel).forEach(el => { el.dataset.cursorText = text; });
      MouseFollower.registerGSAP(gsap);
      const cursor = new MouseFollower({
        speed: 0.45,
        skewing: 1.5,
        stateDetection: {
          '-pointer': 'a, button, summary, label, [role="button"], .is-draggable',
          '-hidden': 'input, textarea, select, iframe, [contenteditable]',
        },
      });
      const root = document.documentElement;
      root.classList.add('has-cursor');
      // The dot settles on a booking button while the button itself leans toward the pointer, at most a few pixels.
      const clamp = (v, m) => Math.max(-m, Math.min(m, v));
      const magnets = [...document.querySelectorAll('.book')];
      magnets.forEach(b => {
        b.dataset.cursorStick = '';
        b.addEventListener('pointermove', e => {
          const r = b.getBoundingClientRect();
          b.style.translate = clamp((e.clientX - r.left - r.width / 2) * 0.2, 8) + 'px ' + clamp((e.clientY - r.top - r.height / 2) * 0.3, 6) + 'px';
        });
        b.addEventListener('pointerleave', () => { b.style.translate = ''; });
      });
      // Switched to reduced motion mid-visit, or unplugged the mouse. Give the normal cursor back.
      const off = () => { cursor.destroy(); root.classList.remove('has-cursor'); magnets.forEach(b => { b.style.translate = ''; delete b.dataset.cursorStick; }); };
      reduce.addEventListener('change', () => { if (reduce.matches) off(); }, { once: true });
      mouse.addEventListener('change', () => { if (!mouse.matches) off(); }, { once: true });
    })
    .catch(() => {});
})();
