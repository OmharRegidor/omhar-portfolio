/* Phone menu, shared by every Atelier page. Under 860px the header's WhatsApp button is replaced by a menu
   button. The menu is built from the page's own header links, so it always lists the same pages as desktop.
   It opens as a full-screen black sheet that wipes down from the top, the links rise in one by one, and the two
   lines of the button turn into a cross. Esc, the button, or any link closes it. */
(() => {
  const top = document.querySelector('.top');
  const links = top && top.querySelector('.nav, .top-links');
  if (!links) return;
  const book = top.querySelector('.book');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width: 860px)');

  const css = `
.mm-btn{ display:none; position:relative; width:44px; height:44px; margin-right:-10px; padding:0; border:0; background:transparent; color:#FFFFFF; cursor:pointer }
.mm-btn i{ position:absolute; left:11px; width:22px; height:1.5px; border-radius:2px; background:currentColor; transition:top 320ms var(--ease, ease) 120ms, rotate 320ms var(--ease, ease) }
.mm-btn i:first-child{ top:17px } .mm-btn i:last-child{ top:25px }
.mm-open .mm-btn i{ top:21px; transition:top 280ms var(--ease, ease), rotate 360ms var(--ease, ease) 140ms }
.mm-open .mm-btn i:first-child{ rotate:45deg } .mm-open .mm-btn i:last-child{ rotate:-45deg }
.mm-btn:focus-visible{ outline:2px solid #FFFFFF; outline-offset:2px }
@media (max-width:860px){ .mm-btn{ display:block } .top .book{ display:none } }
.mm-open .top{ z-index:61 }
.mm-panel{ position:fixed; inset:0; z-index:60; display:grid; grid-template-rows:1fr auto; gap:32px; padding:96px 24px calc(28px + env(safe-area-inset-bottom)); overflow-y:auto; background:#0D0D0D; color:#FFFFFF; font-family:var(--sans, system-ui, sans-serif); clip-path:inset(0 0 100% 0); visibility:hidden; transition:clip-path 620ms cubic-bezier(.76, 0, .24, 1), visibility 0s linear 620ms }
.mm-open .mm-panel{ clip-path:inset(0 0 0 0); visibility:visible; transition:clip-path 620ms cubic-bezier(.76, 0, .24, 1), visibility 0s }
.mm-list{ list-style:none; margin:0; padding:0; align-self:start; border-top:1px solid rgb(255 255 255 / .12) }
.mm-list li{ opacity:0; translate:0 22px; transition:opacity 200ms ease, translate 200ms ease }
.mm-open .mm-list li{ opacity:1; translate:0 0; transition:opacity 500ms ease calc(200ms + var(--i) * 60ms), translate 700ms var(--ease, ease) calc(200ms + var(--i) * 60ms) }
.mm-list a{ display:flex; align-items:baseline; gap:16px; padding:15px 0; border-bottom:1px solid rgb(255 255 255 / .12); color:#FFFFFF; text-decoration:none; font:300 clamp(30px, 8vw, 40px)/1.05 var(--display, system-ui, sans-serif); letter-spacing:-0.03em }
.mm-list a small{ min-width:26px; font:500 12px/1 var(--sans, system-ui, sans-serif); letter-spacing:.18em; color:rgb(255 255 255 / .45) }
.mm-list a[aria-current]{ font-family:var(--serif, "Instrument Serif", Georgia, serif); font-style:italic; font-weight:400 }
.mm-list a[aria-current] small{ color:#FFFFFF }
.mm-foot{ display:grid; gap:14px; opacity:0; translate:0 14px; transition:opacity 200ms ease, translate 200ms ease }
.mm-open .mm-foot{ opacity:1; translate:0 0; transition:opacity 500ms ease 560ms, translate 700ms var(--ease, ease) 560ms }
.mm-book{ display:flex; justify-content:center; align-items:center; gap:10px; min-height:52px; background:#FFFFFF; color:#111111; text-decoration:none; font-size:14px; font-weight:500; letter-spacing:.14em; text-transform:uppercase }
.mm-book .icon{ width:1.15em; height:1.15em; flex-shrink:0 }
.mm-ask{ display:flex; justify-content:center; align-items:center; gap:10px; min-height:52px; border:1px solid rgb(255 255 255 / .3); background:transparent; color:#FFFFFF; font:inherit; font-size:15px; cursor:pointer }
.mm-ask i{ width:8px; height:8px; border-radius:50%; background:#FFFFFF }
.mm-mail{ justify-self:center; padding:6px 0; color:rgb(255 255 255 / .7); font-size:14px; text-underline-offset:3px }
.mm-panel :focus-visible{ outline:2px solid #FFFFFF; outline-offset:3px }
@media (min-width:861px){ .mm-panel{ display:none } }
@media (prefers-reduced-motion: reduce){
  .mm-panel, .mm-open .mm-panel{ clip-path:none; opacity:0; transition:opacity 1ms, visibility 0s linear 1ms }
  .mm-open .mm-panel{ opacity:1; transition:opacity 1ms }
  .mm-list li, .mm-foot, .mm-open .mm-list li, .mm-open .mm-foot{ translate:none; transition:none }
  .mm-btn i, .mm-open .mm-btn i{ transition:none }
}`;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

  /* button, placed where the Book button sits */
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'mm-btn';
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'mm-panel'); btn.setAttribute('aria-label', 'Open menu');
  btn.innerHTML = '<i aria-hidden="true"></i><i aria-hidden="true"></i>';
  top.append(btn);

  /* panel, built from the header links */
  const panel = document.createElement('nav');
  panel.className = 'mm-panel'; panel.id = 'mm-panel'; panel.setAttribute('aria-label', 'Site menu');
  const list = document.createElement('ul'); list.className = 'mm-list';
  [...links.querySelectorAll('a')].forEach((a, i) => {
    const li = document.createElement('li'); li.style.setProperty('--i', i);
    const l = document.createElement('a');
    l.href = a.getAttribute('href');
    if (a.hasAttribute('aria-current')) l.setAttribute('aria-current', a.getAttribute('aria-current'));
    l.innerHTML = `<small aria-hidden="true">${String(i + 1).padStart(2, '0')}</small><span></span>`;
    l.querySelector('span').textContent = a.textContent.trim();
    li.append(l); list.append(li);
  });
  const foot = document.createElement('div'); foot.className = 'mm-foot';
  if (book) foot.insertAdjacentHTML('beforeend', `<a class="mm-book" href="${book.getAttribute('href')}" target="_blank" rel="noopener">Chat on WhatsApp <svg class="icon" aria-hidden="true" focusable="false"><use href="/atelier/icons.svg#i-arrow-right"/></svg></a>`);
  foot.insertAdjacentHTML('beforeend', '<button class="mm-ask" type="button" data-ask-open aria-haspopup="dialog"><i aria-hidden="true"></i>Ask Omhar AI</button><a class="mm-mail" href="mailto:omharregidor@gmail.com">omharregidor@gmail.com</a>');
  panel.append(list, foot);
  document.body.append(panel);

  /* open and close */
  const root = document.documentElement;
  let open = false, inerted = [];
  function setOpen(on, { restoreFocus = true } = {}) {
    if (on === open) return;
    open = on;
    root.classList.toggle('mm-open', on);
    btn.setAttribute('aria-expanded', String(on));
    btn.setAttribute('aria-label', on ? 'Close menu' : 'Open menu');
    root.style.overflow = on ? 'hidden' : '';
    if (on) {
      // Everything except the header and the menu is set aside, so Tab stays inside the menu.
      inerted = [...document.body.children].filter(n => n !== panel && n !== top && !n.contains(top) && !n.inert && n.tagName !== 'SCRIPT' && n.tagName !== 'STYLE');
      inerted.forEach(n => { n.inert = true; });
      setTimeout(() => { const first = list.querySelector('a'); if (first && open) first.focus({ preventScroll: true }); }, reduce.matches ? 0 : 380);
    } else {
      inerted.forEach(n => { n.inert = false; }); inerted = [];
      if (restoreFocus) btn.focus({ preventScroll: true });
    }
  }
  btn.addEventListener('click', () => setOpen(!open));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) setOpen(false); });
  panel.addEventListener('click', e => {
    const a = e.target.closest('a, button');
    if (!a) return;
    if (a.matches('.mm-ask')) { setOpen(false, { restoreFocus: false }); return; }
    if (a.target === '_blank' || a.protocol === 'mailto:') { setOpen(false, { restoreFocus: false }); return; }
    const url = new URL(a.href, location.href);
    const samePage = url.pathname === location.pathname && url.hash;
    if (!samePage) return; // another page: let the browser go there
    e.preventDefault();
    setOpen(false, { restoreFocus: false });
    // The sheet wipes up while the page scrolls to the section.
    const target = document.getElementById(url.hash.slice(1));
    history.pushState(null, '', url.hash);
    if (target) target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
  });
  // Turning a phone sideways into desktop width closes the menu.
  phone.addEventListener('change', e => { if (!e.matches) setOpen(false, { restoreFocus: false }); });
})();
