/* Liquid glass, the bending kind macOS draws. Each pane in PANES refracts whatever scrolls under it, most strongly
   around its rounded rim, through an SVG displacement filter used as a backdrop-filter. Only Chromium browsers can
   run an SVG filter on the backdrop, so this switches on there alone by adding .lg to <html>. Safari and Firefox
   keep the frosted CSS fallback. The CSS opts each pane in with backdrop-filter:url(#lg-<name>) under html.lg.
   The refraction math is adapted from the SVG engine of liquid-glass.js by Ozcan Yildizhan (MIT License,
   https://github.com/ozcanyldzhn/liquid-glass.js), which follows kube.io's "Liquid Glass in the browser". */
(() => {
  const brands = navigator.userAgentData && navigator.userAgentData.brands;
  if (!brands || !brands.some(b => b.brand === 'Chromium')) return;
  if (matchMedia('(prefers-reduced-transparency: reduce)').matches) return;

  // bezel is how wide the bent rim is in px, blur softens what shows through the middle.
  const PANES = [
    { sel: '.top', name: 'top', bezel: 22, blur: 4 },
    { sel: '.ao-launch', name: 'ask', bezel: 18, blur: 1 },
  ];
  const THICKNESS = 70, IOR = 1.5, SAMPLES = 128;
  const NS = 'http://www.w3.org/2000/svg';

  // How far a ray bends at each step across the rim, for a squircle-shaped edge (Snell's law, sampled).
  function bendProfile(bezel) {
    const height = x => Math.pow(1 - Math.pow(1 - x, 4), 0.25);
    const eta = 1 / IOR, out = new Float64Array(SAMPLES);
    for (let i = 0; i < SAMPLES; i++) {
      const x = i / SAMPLES, y = height(x);
      const slope = (height(x + 1e-4) - y) / 1e-4;
      const len = Math.hypot(slope, 1), nx = -slope / len, ny = -1 / len;
      const k = 1 - eta * eta * (1 - ny * ny);
      if (k < 0) continue;
      const s = eta * ny + Math.sqrt(k);
      out[i] = -s * nx * ((y * bezel + THICKNESS) / (eta - s * ny));
    }
    return out;
  }

  // A picture the filter reads as directions. Red pushes sideways, green up and down, 128 means stay put.
  // Only the rim is painted, so the middle of the pane shows the backdrop straight through.
  function displacementMap(w, h, r, bezel) {
    const bend = bendProfile(bezel);
    const max = Math.max(...bend.map(Math.abs)) || 1;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) { d[i] = d[i + 1] = 128; d[i + 3] = 255; }
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        // Offset from the centre of the nearest corner arc. Along a straight edge one of the two stays 0.
        const x = px < r ? px - r : px >= w - r ? px - (w - r) : 0;
        const y = py < r ? py - r : py >= h - r ? py - (h - r) : 0;
        if (!x && !y) continue;
        const dist = Math.hypot(x, y), inset = r - dist;
        if (inset > bezel || inset < -1) continue;
        const edge = inset >= 0 ? 1 : 1 + inset; // a one pixel fade so the outline stays smooth
        const push = bend[Math.max(0, Math.min(SAMPLES - 1, (inset / bezel * SAMPLES) | 0))] / max;
        const k = (py * w + px) * 4;
        d[k] = (128 - x / dist * push * 127 * edge + 0.5) | 0;
        d[k + 1] = (128 - y / dist * push * 127 * edge + 0.5) | 0;
      }
    }
    ctx.putImageData(img, 0, 0);
    return { url: canvas.toDataURL(), scale: Math.min(max, bezel) };
  }

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute; width:0; height:0; overflow:hidden; pointer-events:none';
  document.body.append(svg);

  function glaze({ sel, name, bezel, blur }) {
    const el = document.querySelector(sel);
    if (!el) return;
    const filter = document.createElementNS(NS, 'filter');
    filter.id = 'lg-' + name;
    for (const [k, v] of Object.entries({ x: 0, y: 0, width: '100%', height: '100%', 'color-interpolation-filters': 'sRGB' })) filter.setAttribute(k, v);
    svg.append(filter);
    let drawn = '', timer;
    // The map is drawn for the pane's exact size and corner radius, so redraw once it settles at a new shape.
    const draw = () => {
      const w = el.offsetWidth, h = el.offsetHeight;
      const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, h / 2) | 0;
      const shape = `${w}x${h}r${r}`;
      if (!w || !h || r < 4 || shape === drawn) return;
      drawn = shape;
      const map = displacementMap(w, h, r, Math.min(bezel, r - 1));
      filter.innerHTML = `
        <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="soft"/>
        <feImage href="${map.url}" preserveAspectRatio="none" result="map"/>
        <feDisplacementMap in="soft" in2="map" scale="${map.scale.toFixed(1)}" xChannelSelector="R" yChannelSelector="G"/>`;
    };
    const later = () => { clearTimeout(timer); timer = setTimeout(draw, 120); };
    new ResizeObserver(later).observe(el);
    el.addEventListener('transitionend', later);
    draw();
  }

  PANES.forEach(glaze);
  const root = document.documentElement;
  root.classList.add('lg');
  // Bending the backdrop is redone every frame something scrolls under a pane, which a phone cannot keep up with.
  // On touch screens the panes fall back to the plain frosted blur while the page moves, and bend again once it stops.
  if (matchMedia('(pointer: coarse)').matches) {
    let settle, flat = false;
    addEventListener('scroll', () => {
      if (!flat) { flat = true; root.classList.remove('lg'); }
      clearTimeout(settle);
      settle = setTimeout(() => { flat = false; root.classList.add('lg'); }, 160);
    }, { passive: true });
  }
})();
