/* The homepage hero photo drawn as a portrait of points, with three.js. Brighter parts of the photo get bigger
   points, so it reads like a halftone print. The points breathe a little and move away from the cursor, and when
   the photo changes they burst out and form the next one. This file only draws. The hero controller in index.html
   picks the photo, times the changes and owns the pause button. It shows the right <img> and writes data-slide and
   data-paused on the hero, and this file follows them. Each photo comes from the <img> already on the page, with
   its own crop, so nothing is downloaded twice and the points sit exactly where the photo sat.
   It waits until the page has loaded and the browser is idle before it fetches three.js, so the real photo is
   always the first thing on screen. Reduced motion, a preview mode other than the slideshow, or no WebGL2 leave the
   plain photos alone and three.js is never fetched. If the graphics are lost, a photo fails, or motion is switched
   off mid-visit, the canvas goes away quietly and the photos underneath carry on. Pause stops every movement,
   and so does the hero leaving the screen or the tab being hidden. */
const hero = document.querySelector('.hero');
const media = hero && hero.querySelector('.hero-media');
const slides = window.atelierHeroSlides;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const phone = matchMedia('(max-width: 860px)');

const VERT = /* glsl */`
uniform sampler2D uFrom, uTo;
uniform vec4 uCovFrom, uCovTo;
uniform float uT, uTime, uAspect, uSize, uDist, uPointerAmt;
uniform vec2 uPointer;
attribute vec2 aUv;
attribute vec3 aRand;
varying vec3 vCol;
varying float vAlpha;
float lum(vec3 c){ return pow(dot(c, vec3(.2126, .7152, .0722)), 1.0 / 2.2); }
void main(){
  vec3 a = texture2D(uFrom, aUv * uCovFrom.xy + uCovFrom.zw).rgb;
  vec3 b = texture2D(uTo, aUv * uCovTo.xy + uCovTo.zw).rgb;
  float t = clamp((uT - aRand.x * 0.4) / 0.6, 0.0, 1.0);
  vec3 col = mix(a, b, smoothstep(0.42, 0.58, t));
  float L = lum(col);
  vec2 p = (aUv - 0.5) * vec2(uAspect, 1.0);
  float z = L * 0.07 + sin(uTime * 1.1 + aUv.x * 6.0 + aUv.y * 4.0) * 0.006;
  p += vec2(sin(uTime * 0.7 + aRand.y * 6.283), cos(uTime * 0.6 + aRand.z * 6.283)) * 0.0006;
  vec2 d = p - uPointer;
  float f = exp(-dot(d, d) / 0.010) * uPointerAmt;
  p += normalize(d + 1e-5) * f * 0.045;
  z += f * 0.10;
  // Pull each point back along its line to the camera, so depth makes it bigger but it still lands on its spot in
  // the photo crop. Only the burst moves points off the photo.
  p *= (uDist - z) / uDist;
  float burst = sin(3.14159 * t); burst *= burst;
  vec2 dir = normalize(p - vec2(0.0, 0.12) + 1e-4);
  float ang = (aRand.y - 0.5) * 1.4;
  dir = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * dir;
  p += dir * burst * (0.12 + aRand.z * 0.5);
  z += burst * (aRand.z - 0.3) * 0.9;
  vec4 mv = modelViewMatrix * vec4(p, z, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.5 + 0.8 * L) * (1.0 - 0.35 * burst) * (uDist / -mv.z);
  vCol = col;
  vAlpha = 1.0 - 0.35 * burst;
}`;

const FRAG = /* glsl */`
varying vec3 vCol;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vCol, smoothstep(0.5, 0.32, d) * vAlpha);
  #include <colorspace_fragment>
}`;

// Photos are shrunk to this many pixels on their long side before they go to the graphics card. The portrait has
// at most 230 points across, so a bigger texture only costs memory and upload time.
const TEXTURE_PX = 640;
// With no cursor move for this long, or on a phone, the portrait drifts on its own and the camera rests centred.
const IDLE_MS = 2500;

const allowed = () => !reduce.matches && document.body.dataset.photo === 'slideshow';
const still = () => { hero.dataset.fx = 'still'; };

const pageLoaded = () => new Promise(done => {
  if (document.readyState === 'complete') done();
  else addEventListener('load', () => done(), { once: true });
});
const browserIdle = () => new Promise(done => {
  if ('requestIdleCallback' in window) requestIdleCallback(() => done(), { timeout: 3000 });
  else setTimeout(done, 300);
});

async function start() {
  if (!allowed()) return still();
  const canvas = document.createElement('canvas');
  let gl = null;
  try {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: true, stencil: false, powerPreference: 'high-performance' });
  } catch { gl = null; }
  if (!gl) return still();
  // With no graphics card, the browser draws WebGL on the processor. Then the portrait gets fewer points, drawn at
  // half resolution and 30 frames a second, and it only moves for a change or a moving cursor, so the rest of the
  // page keeps its speed.
  // Chrome and Safari only name the real drawing engine through the debug extension.
  let engine = String(gl.getParameter(gl.RENDERER));
  if (/^webkit webgl$/i.test(engine)) {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    if (info) engine = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
  }
  const light = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(engine);

  let THREE;
  try {
    // three r170, npm three@0.170.0 build/three.module.min.js, sha256 08fd7545d13d2c7fb65ab691530a802dafefd638596501854f267d0fb13c39e7
    THREE = await import('./vendor/three.module.min.js');
  } catch { return still(); }
  if (!allowed()) return still();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: false, alpha: false });
  } catch { return still(); }
  renderer.setPixelRatio(light ? 0.5 : Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // The gaps between points show the hero background, which follows the accent.
  const paintBg = () => {
    const bg = getComputedStyle(hero).getPropertyValue('--hero-bg').trim();
    renderer.setClearColor(/^#[0-9a-f]{3,8}$/i.test(bg) ? bg : '#0D0D0D', 1);
  };
  paintBg();
  canvas.className = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  // Sized so a plane 1 unit tall exactly fills the box.
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
  camera.position.z = 0.5 / Math.tan(THREE.MathUtils.degToRad(15));

  const size = { w: 1, h: 1, aspect: 1 };
  // Cursor in plane units: x from -aspect/2 to aspect/2, y from -0.5 to 0.5. Smoothed toward target.
  const pointer = new THREE.Vector2(9, 9), target = new THREE.Vector2(9, 9);
  let pointerAmt = 0, lastMove = -1e9;

  const uniforms = {
    uFrom: { value: null }, uTo: { value: null },
    uCovFrom: { value: new THREE.Vector4() }, uCovTo: { value: new THREE.Vector4() },
    uT: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 1 }, uSize: { value: 4 },
    uDist: { value: camera.position.z }, uPointer: { value: pointer }, uPointerAmt: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthTest: false, depthWrite: false });

  /* photos */
  const made = new Map(); // <img> → its texture
  let fromImg = null, toImg = null;
  async function textureFor(img) {
    if (made.has(img)) return made.get(img);
    await img.decode();
    if (!img.naturalWidth) throw new Error('empty photo');
    const k = Math.min(1, TEXTURE_PX / Math.max(img.naturalWidth, img.naturalHeight));
    const small = document.createElement('canvas');
    small.width = Math.max(1, Math.round(img.naturalWidth * k));
    small.height = Math.max(1, Math.round(img.naturalHeight * k));
    const g = small.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, small.width, small.height);
    const tex = new THREE.Texture(small);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    renderer.initTexture(tex);
    // The graphics card has its own copy now, so the small canvas can let go of its pixels.
    small.width = small.height = 0;
    made.set(img, tex);
    return tex;
  }
  // The same crop the <img> has on the page, read from its own object-position.
  function cover(img, out) {
    const [x, y] = slides.parsePosition(getComputedStyle(img).objectPosition);
    const [sx, sy, ox, oy] = slides.coverOf(img.naturalWidth, img.naturalHeight, size.aspect, x, y);
    return out.set(sx, sy, ox, oy);
  }

  /* points */
  let points = null, cols = 0, rows = 0;
  function build() {
    // A plain 1x screen gets fewer, larger points, since 230 across snaps to the pixel grid there and reads as a mesh.
    const sharp = (devicePixelRatio || 1) >= 1.5;
    const c = (phone.matches ? 150 : sharp ? 230 : 190) * (light ? 0.6 : 1);
    const r = Math.max(1, Math.round(c / size.aspect));
    if (points && c === cols && r === rows) return;
    cols = c; rows = r;
    const n = cols * rows;
    const uv = new Float32Array(n * 2), rnd = new Float32Array(n * 3);
    for (let y = 0, k = 0; y < rows; y++) for (let x = 0; x < cols; x++, k++) {
      uv[k * 2] = (x + 0.5) / cols; uv[k * 2 + 1] = (y + 0.5) / rows;
      rnd[k * 3] = Math.random(); rnd[k * 3 + 1] = Math.random(); rnd[k * 3 + 2] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geometry.setAttribute('aUv', new THREE.BufferAttribute(uv, 2));
    geometry.setAttribute('aRand', new THREE.BufferAttribute(rnd, 3));
    if (points) { points.geometry.dispose(); scene.remove(points); }
    points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);
  }

  function resize() {
    size.w = Math.max(1, media.clientWidth);
    size.h = Math.max(1, media.clientHeight);
    size.aspect = size.w / size.h;
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.aspect;
    camera.updateProjectionMatrix();
    build();
    uniforms.uAspect.value = size.aspect;
    uniforms.uSize.value = (size.h / rows) * renderer.getPixelRatio() * 1.25;
    if (fromImg) cover(fromImg, uniforms.uCovFrom.value);
    if (toImg) cover(toImg, uniforms.uCovTo.value);
  }

  /* burst */
  let burst = null; // { t } seconds into the current change, or null when the photo is formed
  function settle() {
    if (!burst) return;
    burst = null;
    fromImg = toImg;
    uniforms.uFrom.value = uniforms.uTo.value;
    uniforms.uCovFrom.value.copy(uniforms.uCovTo.value);
    uniforms.uT.value = 0;
    hero.dataset.burst = 'off';
  }

  /* loop */
  let time = 0, last = 0, onScreen = true, dead = false, live = false, scrolling = false, scrollTimer = 0, rested = false;
  const paused = () => hero.dataset.paused === 'true';
  function step(dt) {
    time += dt;
    if (burst) {
      burst.t += dt;
      uniforms.uT.value = Math.min(1, burst.t / (slides.BURST_MS / 1000));
      if (uniforms.uT.value >= 1) settle();
    }
    // No cursor for 2.5 seconds, or a phone: a slow drifting point keeps the photo alive.
    const idle = performance.now() - lastMove > IDLE_MS;
    if (idle) target.set(Math.sin(time * 0.45) * 0.22 * size.aspect, Math.sin(time * 0.31 + 1) * 0.16 + 0.08);
    const ease = Math.min(1, dt * 3);
    pointerAmt += ((idle ? 0.55 : 1) - pointerAmt) * ease;
    if (pointer.x > 5) pointer.copy(target);
    pointer.lerp(target, Math.min(1, dt * 6));
    uniforms.uTime.value = time;
    uniforms.uPointerAmt.value = pointerAmt;
    // A small camera lean toward a real cursor gives the points real depth. With no cursor it eases back to the
    // centre, so the portrait at rest sits exactly on the photo.
    const lean = idle ? 0 : 1;
    camera.position.x += (pointer.x * 0.06 * lean - camera.position.x) * ease;
    camera.position.y += (pointer.y * 0.04 * lean - camera.position.y) * ease;
    camera.lookAt(0, 0, 0);
  }
  function frame(now) {
    if (light && last && now - last < 30) return;
    const leaning = Math.abs(camera.position.x) + Math.abs(camera.position.y) > 1e-4;
    if (light && !burst && !leaning && performance.now() - lastMove > IDLE_MS) {
      if (rested) { last = now; return; }
      rested = true;
    } else rested = false;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    step(dt);
    renderer.render(scene, camera);
  }
  // The loop runs only while the portrait is up, the hero is on screen, the tab is showing, the page is not being
  // scrolled and pause is off. Holding still during a scroll leaves the whole frame to the scroll, so it stays
  // smooth on a phone. Pausing mid-burst lands the burst first, so the last frame is always a formed photo.
  function sync() {
    if (dead) return;
    const run = live && onScreen && !document.hidden && !scrolling && !paused();
    if (!run && live && paused() && burst) { settle(); renderer.render(scene, camera); }
    last = 0;
    renderer.setAnimationLoop(run ? frame : null);
    hero.dataset.loop = run ? 'on' : 'off';
  }

  /* following the controller */
  let wanted = 0;
  async function follow() {
    if (dead) return;
    const img = media.querySelector('.ph.show');
    if (!img || img === toImg) return;
    const ticket = ++wanted;
    let tex;
    try { tex = await textureFor(img); } catch { return stop(); }
    if (dead || ticket !== wanted) return;
    if (!live || paused()) {
      // First photo, or a change while paused: show it formed, with no burst.
      fromImg = toImg = img;
      uniforms.uFrom.value = uniforms.uTo.value = tex;
      cover(img, uniforms.uCovFrom.value);
      cover(img, uniforms.uCovTo.value);
      uniforms.uT.value = 0;
      burst = null;
      hero.dataset.burst = 'off';
      renderer.render(scene, camera);
      return;
    }
    // A change that arrives mid-burst starts from the photo it was heading to.
    if (burst) settle();
    toImg = img;
    uniforms.uTo.value = tex;
    cover(img, uniforms.uCovTo.value);
    uniforms.uT.value = 0;
    burst = { t: 0 };
    hero.dataset.burst = 'on';
  }

  const observers = [];
  const onPointerMove = e => {
    const r = media.getBoundingClientRect();
    target.set(((e.clientX - r.left) / r.width - 0.5) * size.aspect, 0.5 - (e.clientY - r.top) / r.height);
    lastMove = performance.now();
  };
  const onPointerLeave = () => { lastMove = -1e9; };
  const onScroll = () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => { scrolling = false; sync(); }, 180);
    if (!scrolling) { scrolling = true; sync(); }
  };
  const onLost = e => { e.preventDefault(); stop(); };
  const onMotion = () => { if (reduce.matches) stop(); };

  // Back to the plain photos. The <img> under the canvas is already the right one.
  function stop() {
    if (dead) return;
    dead = true;
    observers.forEach(o => o.disconnect());
    hero.removeEventListener('pointermove', onPointerMove);
    hero.removeEventListener('pointerleave', onPointerLeave);
    removeEventListener('scroll', onScroll);
    clearTimeout(scrollTimer);
    document.removeEventListener('visibilitychange', sync);
    reduce.removeEventListener('change', onMotion);
    canvas.removeEventListener('webglcontextlost', onLost);
    try {
      renderer.setAnimationLoop(null);
      made.forEach(tex => tex.dispose());
      if (points) points.geometry.dispose();
      material.dispose();
      renderer.dispose();
    } catch { /* the context is already gone */ }
    canvas.remove();
    hero.dataset.loop = 'off';
    hero.dataset.burst = 'off';
    const wasUp = hero.dataset.fx === 'particles';
    still();
    if (!wasUp) return;
    // Leaving particles mode would restart the photo's slow zoom from 6% bigger, and a change could still be in its
    // cross-fade. Land both at their end, so the photo shows fully, exactly where the points were.
    const shown = media.querySelector('.ph.show');
    if (shown && shown.getAnimations) shown.getAnimations().forEach(a => a.finish());
  }

  canvas.addEventListener('webglcontextlost', onLost);
  reduce.addEventListener('change', onMotion);
  media.append(canvas);
  resize();
  try {
    await follow();
  } catch { return stop(); }
  if (dead || !toImg) return stop();

  const slideWatch = new MutationObserver(() => { follow(); sync(); });
  slideWatch.observe(hero, { attributes: true, attributeFilter: ['data-slide', 'data-paused'] });
  const modeWatch = new MutationObserver(() => {
    if (!allowed()) return stop();
    paintBg();
    if (hero.dataset.loop !== 'on') renderer.render(scene, camera);
  });
  modeWatch.observe(document.body, { attributes: true, attributeFilter: ['data-photo', 'data-accent'] });
  const sizeWatch = new ResizeObserver(() => { resize(); if (!hero.dataset.loop || hero.dataset.loop === 'off') renderer.render(scene, camera); });
  sizeWatch.observe(media);
  const screenWatch = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
  screenWatch.observe(hero);
  observers.push(slideWatch, modeWatch, sizeWatch, screenWatch);
  hero.addEventListener('pointermove', onPointerMove, { passive: true });
  hero.addEventListener('pointerleave', onPointerLeave);
  addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', sync);

  live = true;
  hero.dataset.burst = 'off';
  hero.dataset.fx = 'particles';
  sync();
}

if (hero && media && slides) {
  if (!allowed()) still();
  else pageLoaded().then(browserIdle).then(start).catch(still);
}
