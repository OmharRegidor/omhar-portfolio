/* Event greetings, shared by every Atelier page. For 7 days either side of Halloween (Oct 31), the owner's birthday
   (Nov 11), Christmas (Dec 25) and New Year (Jan 1), Philippines time, a small one-line greeting sits at the bottom
   left with a close button. A few thin line drawings drift down onto its top edge and stay there, and a matching
   drawing sits after the name in the header. Visitors who turn off motion see everything already at rest. When two
   events are both in range, the nearer one wins (the earlier date on a tie). The year shown and saved is the year of
   the event itself, so Dec 30 2026 greets "Happy New Year 2027". The close button hides it until the next event by
   saving one key in the visitor's own browser. ?theme=halloween, christmas, newyear or birthday previews a theme on
   any day and never reads or saves that key, ?theme=none turns it all off. On a normal day nothing is added at all.
   The strip hides, never moves, while readable text (a paragraph, heading, list item, spec row, form label, the
   calculator's result card), the homepage opening text, the project deck, the footer, the automations preview pill
   or the phone menu would sit under it. window.atelierSeasonal exposes the date rules for the tests. */
(() => {
  const STORAGE_KEY = 'atelier-seasonal-closed';
  const WINDOW_DAYS = 7;
  const BAND = 118;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Corner drawings, cropped so each rests on its real bottom edge. Paths are fixed strings, never built from the URL.
  const FLAKE_ARM = 'M24 24V5M24 11l-4-3.5M24 11l4-3.5M24 17.5l-5-4.2M24 17.5l5-4.2';
  const SHAPES = Object.freeze({
    bat: { vb: '0 10 48 23', d: 'M22.4 13.5 23.2 16.4Q24 16 24.8 16.4L25.6 13.5 26.6 17.6C29 17.4 31 15 33 12.4C37 13 42 14.6 46.5 19Q43.4 18.6 41.6 21.8Q38.8 20.4 36.4 24Q33.2 22.4 30.6 25.8Q28.4 24.4 26.4 25.4C26 28.4 25 30.4 24 31C23 30.4 22 28.4 21.6 25.4Q19.6 24.4 17.4 25.8Q14.8 22.4 11.6 24Q9.2 20.4 6.4 21.8Q4.6 18.6 1.5 19C6 14.6 11 13 15 12.4C17 15 19 17.4 21.4 17.6z M33 12.6 36.4 24M33 12.6 41.6 21.8M15 12.6 11.6 24M15 12.6 6.4 21.8' },
    pumpkin: { vb: '4 5 40 39', d: 'M24 16.5c-3.2-1.6-6.6-2.2-9.8-1.3C8.6 16.8 5.5 22 6 28.6c.5 7 5.3 12.4 12 12.6 2.2.1 4.2-.4 6-1.2 1.8.8 3.8 1.3 6 1.2 6.7-.2 11.5-5.6 12-12.6.5-6.6-2.6-11.8-8.2-13.4-3.2-.9-6.6-.3-9.8 1.3z M24 16.5c-4.4 3.8-5.6 15.4 0 23.5M24 16.5c4.4 3.8 5.6 15.4 0 23.5M15.4 15.4c-3.4 4.6-3.6 18.2 2.6 25.6M32.6 15.4c3.4 4.6 3.6 18.2-2.6 25.6 M23 16.4c-.2-3.4.6-6.5 3-8.6l2 1.6c-2 1.6-2.5 4.2-2.3 7 M26.5 10.6c2.6-1.6 5.6-1 6.2 1.1.5 1.8-1.4 3-2.8 1.8' },
    balloon: { vb: '10 2 28 47', d: 'M24 4c7.4 0 12 5.8 12 12.5C36 24.4 30.2 31 24 31s-12-6.6-12-14.5C12 9.8 16.6 4 24 4z M22.2 31h3.6L24 33.6z M24 33.6c-3 3 3 4.6 0 7.6s2.2 3.6.6 6.4 M17.4 12.4c.9-2.6 2.9-4.3 5.4-4.8' },
    cake: { vb: '4 6 40 38', d: 'M6 42h36M9 42V30h30v12M14 30v-8h20v8 M9 33.4c1.7 2.6 3.3 2.6 5 0s3.3 2.6 5 0 3.3 2.6 5 0 3.3 2.6 5 0 3.3 2.6 5 0 3.3 2.6 5 0 M19 22v-5.5M24 22v-6.5M29 22v-5.5 M19 10.6c1.5 1.8 1.5 3.4 0 3.4s-1.5-1.6 0-3.4zM24 9c1.5 1.8 1.5 3.4 0 3.4s-1.5-1.6 0-3.4zM29 10.6c1.5 1.8 1.5 3.4 0 3.4s-1.5-1.6 0-3.4z' },
    tree: { vb: '8 2 32 43', d: 'M24 12.6 17.4 21h3.4L14 29.4h3.8L10 38.5h28l-7.8-9.1H34L27.2 21h3.4z M21.6 38.5V43h4.8v-4.5 M24 4.4l1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z M19.6 25.6c2.8 1.6 6.2 1.4 8.6-.6M16 34.6c4.8 2 11.4 1.6 16-1.4' },
    gift: { vb: '6 6 36 37', d: 'M10 22h28v19H10zM8 16.5h32V22H8z M24 16.5V41 M24 16.5c-2.4-4.2-7.6-6.6-9.4-4.4-1.6 2 1.6 4.4 9.4 4.4zM24 16.5c2.4-4.2 7.6-6.6 9.4-4.4 1.6 2-1.6 4.4-9.4 4.4z' },
    flake: { vb: '3 3 42 42', arm: FLAKE_ARM, turns: [0, 60, 120, 180, 240, 300], c: [[24, 24, 2.4]] },
    sparkle: { vb: '2 3 44 43', d: 'M20 12c1.2 12.2 3.8 14.8 16 16-12.2 1.2-14.8 3.8-16 16-1.2-12.2-3.8-14.8-16-16 12.2-1.2 14.8-3.8 16-16z M38 5c.4 3.6 1.4 4.6 5 5-3.6.4-4.6 1.4-5 5-.4-3.6-1.4-4.6-5-5 3.6-.4 4.6-1.4 5-5z', c: [[40, 39, 2]] },
    streamer: { vb: '0 5 46 39', d: 'M5.0 41.0L4.5 41.2L3.9 41.2L3.3 40.9L2.6 40.3L2.1 39.5L1.7 38.4L1.5 37.1L1.5 35.6L1.9 34.2L2.5 32.7L3.4 31.3L4.6 30.1L5.9 29.1L7.4 28.3L8.9 27.9L10.4 27.7L11.8 27.8L13.1 28.1L14.1 28.6L14.9 29.2L15.4 29.9L15.7 30.6L15.6 31.2L15.4 31.7L14.9 31.9L14.3 31.9L13.6 31.6L13.0 31.0L12.4 30.1L12.0 29.0L11.8 27.7L11.9 26.3L12.2 24.8L12.9 23.4L13.8 22.0L14.9 20.8L16.2 19.8L17.7 19.0L19.2 18.5L20.7 18.3L22.2 18.4L23.4 18.8L24.5 19.3L25.3 19.9L25.8 20.6L26.0 21.3L26.0 21.9L25.7 22.4L25.2 22.6L24.6 22.6L24.0 22.3L23.3 21.7L22.8 20.8L22.4 19.7L22.2 18.4L22.2 17.0L22.6 15.5L23.2 14.0L24.1 12.7L25.3 11.4L26.6 10.4L28.1 9.7L29.6 9.2L31.1 9.0L32.5 9.1L33.8 9.4L34.8 9.9L35.6 10.6L36.2 11.3L36.4 12.0L36.3 12.6L36.1 13.0L38.2 10.6L40.6 7.4 M38.4 27.6l4.4-2.6', c: [[41.6, 36.4, 1.8], [6.6, 14, 1.6]] },
  });

  // The header drawing after the name, on a 24 unit grid, in the name's own colour.
  const MARKS = Object.freeze({
    pumpkin: 'M12 8.2C9.4 6.8 4.4 6.8 2.8 11.4c-1.4 4.2 1 8.6 5.2 8.8 1.6.1 3-.3 4-.9 1 .6 2.4 1 4 .9 4.2-.2 6.6-4.6 5.2-8.8C19.6 6.8 14.6 6.8 12 8.2z M12 8.2c-.6 3.6-.6 7.4 0 11.1M7.4 7.6c-2.2 3-2.2 9 .6 12.6M16.6 7.6c2.2 3 2.2 9-.6 12.6 M11.6 8c-.1-2 .5-3.6 2.1-4.6l1 1.2c-1 .7-1.3 1.9-1.2 3.3 M14 5.6c1.6-1 3.4-.6 3.6.8',
    cake: 'M2.5 21h19M4 21v-7h16v7 M4 16.4c1 1.6 2 1.6 3 0s2 1.6 3 0 2 1.6 3 0 2 1.6 3 0 2 1.6 3 0 .7 1 1 .9 M8 14v-4M12 14v-4.6M16 14v-4 M8 4.8c1.1 1.3 1.1 2.6 0 2.6s-1.1-1.3 0-2.6zM12 4.2c1.1 1.3 1.1 2.6 0 2.6s-1.1-1.3 0-2.6zM16 4.8c1.1 1.3 1.1 2.6 0 2.6s-1.1-1.3 0-2.6z',
    tree: 'M12 2 6.6 9h2.8l-4.8 6h3L3 20.4h18L16.4 15h3l-4.8-6h2.8z M10.4 20.4V23h3.2v-2.6',
    sparkle: 'M10.5 4c.8 7 2.5 8.7 9.5 9.5-7 .8-8.7 2.5-9.5 9.5-.8-7-2.5-8.7-9.5-9.5 7-.8 8.7-2.5 9.5-9.5z M19.5 1c.3 2.6.9 3.2 3.5 3.5-2.6.3-3.2.9-3.5 3.5-.3-2.6-.9-3.2-3.5-3.5 2.6-.3 3.2-.9 3.5-3.5z',
  });

  // Each event: its date, its header drawing, and where each corner drawing rests (x as % of the space above the
  // words, y in px up from the strip's top edge, width, turn), plus how it falls (start height, sideways start, spin,
  // delay). The keys of this frozen map are the only ?theme= values that turn a theme on.
  const THEMES = Object.freeze({
    halloween: { month: 10, day: 31, mark: 'pumpkin', items: [
      { k: 'pumpkin', x: 2, y: 0, w: 42, r: -4, from: -120, sx: 12, spin: -12, d: 150 },
      { k: 'bat', x: 34, y: 22, w: 48, r: -6, from: -150, sx: -18, spin: 24, d: 480 },
      { k: 'bat', x: 68, y: 8, w: 40, r: 8, from: -100, sx: 12, spin: -20, d: 860 }] },
    birthday: { month: 11, day: 11, mark: 'cake', items: [
      { k: 'balloon', x: 2, y: 0, w: 28, r: -6, from: -140, sx: 12, spin: -10, d: 150 },
      { k: 'cake', x: 28, y: 0, w: 44, r: 0, from: -110, sx: -12, spin: 10, d: 500 },
      { k: 'balloon', x: 68, y: 6, w: 25, r: 8, from: -150, sx: -10, spin: 12, d: 860 }] },
    christmas: { month: 12, day: 25, mark: 'tree', items: [
      { k: 'tree', x: 1, y: 0, w: 34, r: 0, from: -120, sx: 10, spin: -8, d: 150 },
      { k: 'gift', x: 24, y: 0, w: 38, r: -3, from: -150, sx: -12, spin: 12, d: 400 },
      { k: 'flake', x: 50, y: 26, w: 30, r: 10, from: -100, sx: 12, spin: -60, d: 640 },
      { k: 'flake', x: 74, y: 4, w: 38, r: -6, from: -140, sx: -12, spin: 60, d: 900 }] },
    newyear: { month: 1, day: 1, mark: 'sparkle', items: [
      { k: 'sparkle', x: 0, y: 2, w: 44, r: 0, from: -120, sx: 12, spin: -30, d: 150 },
      { k: 'streamer', x: 34, y: 0, w: 46, r: -4, from: -150, sx: -14, spin: 40, d: 480 },
      { k: 'sparkle', x: 72, y: 18, w: 32, r: 12, from: -100, sx: 10, spin: 30, d: 860 }] },
  });

  /* date rules */
  // Today's calendar date in the Philippines, whatever the visitor's own time zone is.
  const manilaFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric' });
  function manilaDay(date) {
    const parts = {};
    for (const p of manilaFormat.formatToParts(date)) parts[p.type] = p.value;
    return { y: Number(parts.year), m: Number(parts.month), d: Number(parts.day) };
  }
  // Whole days since 1970 for a calendar date, counted in UTC so daylight saving can never shift it.
  const dayNumber = (y, m, d) => Date.UTC(y, m - 1, d) / 86400000;

  // The occurrence of one of the given events nearest to today, looking at last year, this year and next year.
  // Ties go to the earlier date.
  function nearest(date, ids, maxDays) {
    const { y, m, d } = manilaDay(date);
    const today = dayNumber(y, m, d);
    let best = null;
    for (const id of ids) {
      for (const year of [y - 1, y, y + 1]) {
        const at = dayNumber(year, THEMES[id].month, THEMES[id].day);
        const distance = Math.abs(today - at);
        if (distance > maxDays) continue;
        if (!best || distance < best.distance || (distance === best.distance && at < best.at)) best = { id, year, distance, at };
      }
    }
    return best && { id: best.id, year: best.year };
  }

  const pick = date => nearest(date, Object.keys(THEMES), WINDOW_DAYS);

  function resolve(date, search) {
    const value = new URLSearchParams(search).get('theme');
    if (value === 'none') return null;
    if (value !== null && Object.hasOwn(THEMES, value)) return { ...nearest(date, [value], Infinity), preview: true };
    const found = pick(date);
    return found && { ...found, preview: false };
  }

  function greeting(id, year) {
    switch (id) {
      case 'halloween': return 'Happy Halloween from Omhar';
      case 'christmas': return 'Merry Christmas from Omhar';
      case 'newyear': return `Happy New Year ${year}`;
      case 'birthday': return "It's Omhar's birthday week";
      default: return '';
    }
  }

  window.atelierSeasonal = Object.freeze({ manilaDay, pick, resolve, greeting, STORAGE_KEY });

  const theme = resolve(new Date(), location.search);
  if (!theme || document.getElementById('sea-css')) return;
  const occurrence = `${theme.id}-${theme.year}`;

  // Private windows can throw on storage. Then the strip simply shows, and the X hides it for this page view.
  const readClosed = () => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  };
  const saveClosed = () => {
    try { localStorage.setItem(STORAGE_KEY, occurrence); } catch { /* nothing to keep in a private window */ }
  };
  if (!theme.preview && readClosed() === occurrence) return;

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const config = THEMES[theme.id];

  /* styles */
  const css = `
.sea{ position:fixed; left:16px; bottom:calc(24px + env(safe-area-inset-bottom)); z-index:42; display:flex; align-items:center; gap:4px; height:44px; max-width:calc(100vw - 112px); margin:0; padding:0 0 0 16px; border:1px solid var(--line, #DCDBD5); border-radius:999px; background:var(--paper, #F7F6F2); color:var(--ink, #121413); box-shadow:0 10px 30px rgb(0 0 0 / .2); font:500 14px/1 var(--sans, system-ui, sans-serif); letter-spacing:0; text-transform:none; transition:opacity 200ms ease-in, visibility 0s }
.sea .sea-text{ min-width:0; margin:0; padding:0; font:inherit; color:inherit; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.sea .sea-x{ flex:none; width:44px; height:44px; display:grid; place-items:center; margin:0; padding:0; border:0; border-radius:50%; background:transparent; color:inherit; cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent; transition:background-color 160ms ease-out }
.sea .sea-x .icon{ width:16px; height:16px; vertical-align:0 }
.sea .sea-x:hover{ background:color-mix(in srgb, var(--ink, #121413) 7%, transparent) }
.sea .sea-x:focus-visible{ outline:2px solid var(--ink, #121413); outline-offset:-4px }
.sea-deco{ position:absolute; left:8px; right:8px; bottom:calc(100% - 9px); height:64px; pointer-events:none }
.sea-d{ position:absolute; bottom:var(--y); left:var(--x); width:var(--w); transform:rotate(var(--r)); transform-origin:50% 100% }
.sea-d svg{ display:block; width:100%; height:auto; overflow:visible; fill:none; stroke-linecap:round; stroke-linejoin:round }
.sea-d .halo{ stroke:var(--paper, #F7F6F2); stroke-width:3.5px }
.sea-d .ink{ stroke:var(--ink, #121413); stroke-width:1.5px }
.sea-d svg *{ vector-effect:non-scaling-stroke }
.sea.sea-in{ animation:sea-in 360ms var(--ease, ease-out) 600ms backwards }
.sea.sea-in .sea-d{ animation:sea-fall 2600ms cubic-bezier(.22,.8,.3,1) calc(600ms + var(--delay)) backwards }
@keyframes sea-in{ from{ opacity:0; transform:translateY(12px) } to{ opacity:1; transform:none } }
@keyframes sea-fall{
  0%{ opacity:0; transform:translate(var(--sx), var(--from)) rotate(calc(var(--r) + var(--spin))) }
  12%{ opacity:1 }
  55%{ transform:translate(calc(var(--sx) * -0.4), calc(var(--from) * 0.3)) rotate(calc(var(--r) - var(--spin) * 0.3)) }
  100%{ opacity:1; transform:translate(0, 0) rotate(var(--r)) }
}
.sea.sea-away{ opacity:0; visibility:hidden; transition:opacity 200ms ease-in, visibility 0s linear 200ms }
.sea.sea-leave, .sea-mark.sea-leave{ opacity:0; transition:opacity 200ms ease-in }
.mm-open .sea{ visibility:hidden }
a.logo .sea-mark{ flex:none; display:block; width:20px; height:20px; align-self:center; margin-left:-2px; overflow:visible; fill:none; stroke:currentColor; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round }
.sea-mark.sea-in{ animation:sea-mark-in 360ms var(--ease, ease-out) 600ms backwards }
@keyframes sea-mark-in{ from{ opacity:0; transform:translateY(3px) } to{ opacity:1; transform:none } }
.sea.sea-still, .sea.sea-still *, .sea-mark.sea-still{ animation:none !important; transition:none !important }
@media (max-width:860px){ a.logo .sea-mark{ width:18px; height:18px } }
@media (max-width:360px){ .sea{ max-width:calc(100vw - 96px); gap:2px; padding-left:12px; font-size:12.5px } .sea .sea-x{ width:32px } }
@media print{ .sea, .sea-mark{ display:none } }
`;

  /* building blocks, all with createElement and textContent, never HTML strings */
  const svg = (viewBox, cls) => {
    const el = document.createElementNS(SVG_NS, 'svg');
    el.setAttribute('viewBox', viewBox);
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('focusable', 'false');
    if (cls) el.setAttribute('class', cls);
    return el;
  };
  const path = (d, turn) => {
    const el = document.createElementNS(SVG_NS, 'path');
    el.setAttribute('d', d);
    if (turn) el.setAttribute('transform', `rotate(${turn} 24 24)`);
    return el;
  };
  function strokes(shape, cls) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', cls);
    if (shape.d) g.append(path(shape.d));
    if (shape.arm) for (const t of shape.turns) g.append(path(shape.arm, t));
    for (const [cx, cy, r] of shape.c || []) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', String(cx));
      c.setAttribute('cy', String(cy));
      c.setAttribute('r', String(r));
      g.append(c);
    }
    return g;
  }
  // Each drawing is drawn twice, a paper halo under the ink line, so it reads on the black sections too.
  function drawing(item) {
    const shape = SHAPES[item.k];
    const box = document.createElement('span');
    box.className = 'sea-d';
    const vars = { '--x': `${item.x}%`, '--y': `${item.y}px`, '--w': `${item.w}px`, '--r': `${item.r}deg`, '--from': `${item.from}px`, '--sx': `${item.sx}px`, '--spin': `${item.spin}deg`, '--delay': `${item.d}ms` };
    for (const [k, v] of Object.entries(vars)) box.style.setProperty(k, v);
    const art = svg(shape.vb);
    art.append(strokes(shape, 'halo'), strokes(shape, 'ink'));
    box.append(art);
    return box;
  }

  const style = document.createElement('style');
  style.id = 'sea-css';
  style.textContent = css;
  document.head.append(style);

  const motionClass = still ? 'sea-still' : 'sea-in';
  const strip = document.createElement('aside');
  strip.className = `sea ${motionClass}`;
  strip.dataset.sea = theme.id;
  strip.setAttribute('aria-label', 'Seasonal greeting');

  const deco = document.createElement('span');
  deco.className = 'sea-deco';
  deco.setAttribute('aria-hidden', 'true');
  deco.append(...config.items.map(drawing));

  const text = document.createElement('p');
  text.className = 'sea-text';
  text.textContent = greeting(theme.id, theme.year);

  const close = document.createElement('button');
  close.className = 'sea-x';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close the greeting');
  const closeIcon = svg('0 0 256 256', 'icon');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', '/atelier/icons.svg#i-x');
  closeIcon.append(use);
  close.append(closeIcon);

  strip.append(deco, text, close);
  document.body.append(strip);

  // The small drawing after "Omhar Regidor" in the header.
  const marks = [...document.querySelectorAll('a.logo')].map(logo => {
    const mark = svg('0 0 24 24', `sea-mark ${motionClass}`);
    mark.append(path(MARKS[config.mark]));
    logo.append(mark);
    return mark;
  });

  /* keep clear: hide the strip while something important sits in its corner */
  const inBand = new Set();
  const pill = document.getElementById('pill');
  const update = () => {
    strip.classList.toggle('sea-away', inBand.size > 0 || Boolean(pill && !pill.hidden));
  };

  let band = null;
  let resizeTimer = 0;
  // Any element in main that holds words of its own (links, tiles, buttons, labels too), plus the big blocks.
  const ownText = el => [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.nodeValue.trim());
  const watched = [
    ...document.querySelectorAll('.hero-copy, #deck, footer.foot, .calc-out'),
    ...[...document.querySelectorAll('main *')].filter(ownText),
  ];
  // Only the strip's own corner counts: the bottom 118px of the window (24px gap, 44px strip, the tallest drawing
  // reaching 47px above it, and 3px of air), from the left edge to the strip's right edge. Measured once here, again
  // only after a resize.
  function watchBand() {
    if (band) band.disconnect();
    inBand.clear();
    const top = Math.max(0, innerHeight - BAND);
    const right = Math.max(0, document.documentElement.clientWidth - Math.ceil(strip.getBoundingClientRect().right));
    band = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) inBand.add(e.target); else inBand.delete(e.target);
      }
      update();
    }, { rootMargin: `-${top}px -${right}px 0px 0px` });
    watched.forEach(el => band.observe(el));
  }
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(watchBand, 150);
  };
  if (watched.length && 'IntersectionObserver' in window) {
    watchBand();
    addEventListener('resize', onResize);
  }

  const pillWatch = pill && new MutationObserver(update);
  if (pillWatch) pillWatch.observe(pill, { attributes: true, attributeFilter: ['hidden'] });
  update();

  /* close */
  close.addEventListener('click', () => {
    if (!theme.preview) saveClosed();
    if (band) band.disconnect();
    if (pillWatch) pillWatch.disconnect();
    removeEventListener('resize', onResize);
    clearTimeout(resizeTimer);
    const parts = [strip, ...marks];
    for (const el of parts) {
      el.classList.remove('sea-in');
      el.classList.add('sea-leave');
    }
    setTimeout(() => {
      for (const el of [...parts, style]) el.remove();
    }, still ? 0 : 200);
  }, { once: true });
})();
