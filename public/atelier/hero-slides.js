/* Hero photo rules for the homepage, shared by the hero controller in index.html and by hero-particles.js. During
   an event window, or with a ?theme= preview, the costume photo comes first and then the usual 5 photos, round and
   round. Each photo holds still for 6 seconds. When the point portrait runs, each change also has a 2.2 second
   burst, so the photo still stands still for 6 seconds after it forms. The costume photo is found only through the
   frozen COSTUMES map below, keyed by the theme id that seasonal.js picked, so a path is never built from the URL.
   coverOf works out where a photo sits in its box, the same way CSS object-fit: cover does, so the points land
   exactly where the photo was.
   Swapping in the full-size costume photos: save each Canva download as public/atelier/hero/costume-halloween.jpg,
   costume-christmas.jpg, costume-newyear.jpg or costume-birthday.jpg (1408x1136 JPEG, quality about 80, under
   200 KB), replacing the small stand-in of the same name. No code change is needed. */
(() => {
  const COSTUMES = Object.freeze({
    halloween: '/atelier/hero/costume-halloween.jpg',
    christmas: '/atelier/hero/costume-christmas.jpg',
    newyear: '/atelier/hero/costume-newyear.jpg',
    birthday: '/atelier/hero/costume-birthday.jpg',
  });
  const BASE = Object.freeze(['campus', 'lobby', 'studio', 'grad', 'nightcode']);
  const WITH_COSTUME = Object.freeze(['costume', ...BASE]);

  // The theme comes from atelierSeasonal.resolve(). Any id that is not a key of the map gives no costume.
  const costumeFor = theme => (theme && typeof theme.id === 'string' && Object.hasOwn(COSTUMES, theme.id) ? COSTUMES[theme.id] : null);

  const order = costumeSrc => (typeof costumeSrc === 'string' ? WITH_COSTUME : BASE);

  // Reads a computed object-position such as "50% 22%" into fractions from the left and from the top. Keywords
  // work too. Anything else, such as pixel offsets, counts as centred.
  const KEYWORDS = { left: 0, top: 0, center: 0.5, right: 1, bottom: 1 };
  const VERTICAL = new Set(['top', 'bottom']);
  function parsePosition(objectPosition) {
    const parts = String(objectPosition || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (parts.length < 1 || parts.length > 2) return [0.5, 0.5];
    const read = part => {
      if (Object.hasOwn(KEYWORDS, part)) return KEYWORDS[part];
      const m = /^(-?\d+(?:\.\d+)?)%$/.exec(part);
      return m ? Number(m[1]) / 100 : null;
    };
    const values = parts.map(read);
    if (values.includes(null)) return [0.5, 0.5];
    if (parts.length === 1) return VERTICAL.has(parts[0]) ? [0.5, values[0]] : [values[0], 0.5];
    // "top left" names the vertical side first.
    if (VERTICAL.has(parts[0]) || parts[1] === 'left' || parts[1] === 'right') return [values[1], values[0]];
    return [values[0], values[1]];
  }

  // The part of a photo that shows in a box, as (scaleX, scaleY, offsetX, offsetY) for uv * scale + offset in a
  // shader. Texture rows count up from the bottom, so the top offset is turned round.
  function coverOf(imgW, imgH, boxAspect, posX, posY) {
    const ia = imgW / imgH;
    const sx = Math.min(1, boxAspect / ia);
    const sy = Math.min(1, ia / boxAspect);
    return [sx, sy, (1 - sx) * posX, (1 - sy) * (1 - posY)];
  }

  window.atelierHeroSlides = Object.freeze({ COSTUMES, BASE, HOLD_MS: 6000, BURST_MS: 2200, costumeFor, order, parsePosition, coverOf });
})();
