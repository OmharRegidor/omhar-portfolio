/* Ask Omhar AI. One chat panel shared by the homepage and the automation pages.
   Open it with any element that has data-ask-open, or ask a question straight away with data-ask="<id>".
   Starter answers are prepared text taken from the site's FAQs and workflow pages, so they are instant and
   cost nothing. Typed questions go to the live assistant at /api/chat, which streams its answer. When that is
   switched off or out of reach, the nearest prepared answer is shown instead, or a short note on what it can
   answer. */
(() => {
  const WHATSAPP = 'https://wa.me/639506009518?text=Hi%20Omhar%2C%20I%20saw%20your%20portfolio%20and%20want%20to%20talk%20about%20a%20project.';
  const EMAIL = 'omharregidor@gmail.com';
  const onAutoPage = !!document.getElementById('view-auto');
  const autoHref = slug => (onAutoPage ? '' : '/automations') + '#auto-' + slug;

  /* Answers. Facts only from the FAQs, project rows and workflow pages. Never a price, a date or availability. */
  const KB = {
    automate: { q: 'What can Omhar automate?', a: ['Omhar builds n8n automations that connect apps like Gmail, Shopify, Slack and OpenAI. He has built three so far. One drafts replies to customer emails for a person to review, one posts a daily sales summary to Slack, and one answers staff questions about company procedures.', 'If a task in your business repeats every day, it is worth asking about.'], follow: ['emails', 'pulse', 'sop'] },
    emails: { q: 'Can AI answer my emails?', a: ['Yes, with a person still in control. In Omhar’s CS Live Inbox workflow, a low-cost AI model first checks whether each new email needs a reply. The ones that do get a reply written by a stronger model and saved as a Gmail draft, so someone on the team reviews it before it is sent.'], link: ['See it run', autoHref('live-inbox')], follow: ['inbox-sends', 'start'] },
    start: { q: 'How do I start a project?', a: ['Message Omhar on WhatsApp, or email ' + EMAIL + ' with a short note about what you need. Then you walk through what is slowing your business down and what you would like to build.'], book: true, follow: ['cost', 'built'] },
    cost: { q: 'How much does a project cost?', a: ['It depends on what you need, so Omhar prices each project on its own. The quickest way to a clear answer is a WhatsApp message to Omhar.'], book: true, follow: ['built', 'automate'] },
    available: { q: 'Is Omhar taking new projects?', a: ['The best way to check is a WhatsApp message, or an email to ' + EMAIL + '.'], book: true, follow: ['start', 'built'] },
    built: { q: 'What has Omhar built?', a: ['Nine live web projects. His own startup Agad, which sends job alerts with AI-written applications through Gmail, a resort booking site with an AI assistant (BiNuKBoK View Point Resort), a loyalty platform with iOS and Android apps (Noxa Loyalty), a florist shop with sales, inventory and POS (SweetBlooms), a media agency website (JAZA Media), a portfolio site for a virtual assistant (Crisia VA), a sales pipeline tracker (SalesPipe), plus a website design for a Singapore bathroom brand (HERA Bathroom) and its ATHENA product page built in Shopify.'], follow: ['booking', 'mobile', 'stack'] },
    booking: { q: 'Can he build a booking site with AI?', a: ['Yes. BiNuKBoK View Point Resort is a full-stack booking site with online reservations, an availability calendar, QR-code check-in, an admin dashboard and an AI assistant that answers live availability and guest-arrival questions from the database.'], follow: ['built', 'start'] },
    mobile: { q: 'Does he build mobile apps?', a: ['Yes. Noxa Loyalty has a web app, an iOS app on the App Store and an Android app where customers track points and redeem rewards. Omhar builds mobile apps with React Native.'], follow: ['stack', 'start'] },
    stack: { q: 'What tech does he use?', a: ['Next.js, React, TypeScript and Tailwind CSS on the front end, and Node.js, Express, Supabase, PostgreSQL, MySQL and MongoDB on the back end. React Native for mobile, n8n with OpenAI for automation, and Docker with GitHub Actions for delivery.'], follow: ['built', 'automate'] },
    pulse: { q: 'How does the daily sales summary work?', a: ['Every day a scheduled run pulls the store’s orders from Shopify. A code step works out the totals and top products, then an AI model writes a short summary that is posted to the team’s Slack. Code does the math first, so the figures stay exact.'], link: ['See it run', autoHref('sales-pulse')], follow: ['sop', 'start'] },
    sop: { q: 'Can AI answer my team’s questions?', a: ['Yes. Omhar’s SOP Assistant is an AI agent that answers staff questions from the company’s written procedures. The same assistant works in Slack and in a chat window, and the chat version remembers recent messages so follow-up questions make sense.'], link: ['See it run', autoHref('sop')], follow: ['agent', 'start'] },
    n8n: { q: 'What is n8n?', a: ['n8n is a workflow automation tool that connects apps like Gmail, Shopify and Slack so routine tasks run on their own. Each workflow is a chain of steps, called nodes, that starts from a trigger such as a new email, a chat message or a daily schedule.'], follow: ['automate', 'agent'] },
    agent: { q: 'What is an AI agent?', a: ['An AI model given a specific job and the tools or information it needs to act on it, not just chat. In the SOP Assistant, the agent reads a staff question and answers it from the company’s written procedures.'], follow: ['sop', 'start'] },
    // CS Live Inbox page
    'inbox-sends': { q: 'Does it send emails by itself?', a: ['No. It only saves the reply as a Gmail draft. A person on the team reviews each draft and presses send, so nothing reaches a customer without that check.'], follow: ['inbox-mine', 'start'] },
    'inbox-mine': { q: 'Could this work with my inbox?', a: ['It is built in n8n with Gmail and OpenAI. n8n connects to many common business apps, so over WhatsApp Omhar can check how it would fit your inbox and tools.'], book: true, follow: ['cost'] },
    'inbox-cheap': { q: 'Why use two AI models?', a: ['To keep costs low. A cheap model reads every email first, and only the ones that truly need an answer reach the stronger model, which writes the reply with real order details.'], follow: ['inbox-sends', 'inbox-mine'] },
    // Daily Sales Pulse page
    'pulse-numbers': { q: 'Where do the numbers come from?', a: ['From the store’s Shopify orders. A code step adds them up and works out the trends, and the AI only explains the numbers, so it never has to calculate them.'], follow: ['pulse-mine', 'start'] },
    'pulse-mine': { q: 'Could it post to my team chat?', a: ['This one posts to Slack. n8n connects to many chat and email apps, so over WhatsApp Omhar can check whether yours works.'], book: true, follow: ['cost'] },
    'pulse-human': { q: 'What does a person still do?', a: ['A person reads the summary and decides what to act on. The workflow does the gathering and the math, people make the calls.'], follow: ['pulse-numbers', 'start'] },
    // SOP Assistant page
    'sop-source': { q: 'Where do the answers come from?', a: ['From the company’s written procedures. The agent reads the staff question and answers from those documents. A person writes and updates the procedures it answers from.'], follow: ['sop-where', 'sop-mine'] },
    'sop-where': { q: 'Does it work outside Slack?', a: ['Yes. The same assistant works in Slack and in a chat window, so staff get the same answers wherever they ask.'], follow: ['sop-source', 'sop-mine'] },
    'sop-mine': { q: 'Could I get one for my team?', a: ['That is a good thing to talk through on WhatsApp, starting with which procedures your team asks about most.'], book: true, follow: ['cost'] },
    // Gear page
    gear: { q: 'What gear does Omhar use?', a: ['A MacBook Pro with the M4 Pro chip in Space Black is his main machine, and a Lenovo ThinkPad T460 is his second laptop. He types on an AULA F75 mechanical keyboard and uses an A4Tech 2X Click mouse.'], link: ['See the gear', '/gear'], follow: ['stack', 'built'] },
    scope: { a: ['I can answer questions about Omhar’s work, his projects and automations, and how to start a project. Try one of these.'] }
  };
  const STARTERS = {
    home: ['automate', 'emails', 'start'],
    'live-inbox': ['inbox-sends', 'inbox-cheap', 'inbox-mine'],
    'sales-pulse': ['pulse-numbers', 'pulse-human', 'pulse-mine'],
    sop: ['sop-source', 'sop-where', 'sop-mine'],
    gear: ['gear', 'stack', 'start']
  };
  const TOPIC = { 'live-inbox': 'CS Live Inbox', 'sales-pulse': 'Daily Sales Pulse', sop: 'SOP Assistant' };
  // Typed questions are matched by keywords, the best score wins.
  const KEYS = [
    ['cost', /\b(price|pricing|cost|costs|rate|rates|budget|quote|how much|fee|charge)\b/],
    ['available', /\b(available|availability|taking|free to|capacity|schedule|when can)\b/],
    ['start', /\b(start|book|call|contact|reach|email you|hire|work with)\b/],
    ['inbox-sends', /\b(send|sends|sent) (by itself|automatically|on its own)\b/],
    ['emails', /\b(email|emails|inbox|gmail|reply|replies|customer service|support)\b/],
    ['pulse', /\b(sales|shopify|summary|report|orders)\b/],
    ['sop', /\b(slack|sop|procedure|procedures|staff|employees|team questions)\b/],
    ['automate', /\b(automate|automation|automations|workflow|workflows|zapier)\b/],
    ['n8n', /\bwhat is n8n\b|\bn8n\b/],
    ['agent', /\b(agent|agents)\b/],
    ['booking', /\b(booking|resort|reservation|reservations|hotel)\b/],
    ['mobile', /\b(mobile|ios|android|app store|react native|phone app)\b/],
    ['stack', /\b(stack|tech|technology|language|framework|next\.?js|react|typescript|database)\b/],
    ['gear', /\b(gear|setup|laptop|laptops|macbook|thinkpad|keyboard|mouse|hardware|computer|desk)\b/],
    ['built', /\b(built|projects|portfolio|work|shipped|clients|examples|made)\b/]
  ];
  const match = text => {
    const t = ' ' + text.toLowerCase() + ' ';
    let best = 'scope', score = 0;
    KEYS.forEach(([id, re], i) => { const m = t.match(new RegExp(re.source, 'g')); const s = m ? m.length * 10 - i * .01 : 0; if (s > score) { score = s; best = id; } });
    return best;
  };
  const ctx = () => {
    if (document.body.dataset.page === 'gear') return 'gear';
    const m = onAutoPage && location.hash.match(/^#auto-([a-z-]+)/); return m && STARTERS[m[1]] ? m[1] : 'home';
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const full = matchMedia('(max-width: 600px)');
  // Arrow and close icons from the shared Phosphor sprite, always beside a word or inside a labelled button.
  const icon = n => `<svg class="icon" aria-hidden="true" focusable="false"><use href="/atelier/icons.svg#i-${n}"/></svg>`;

  /* styles */
  const css = `
.ao-launch{ position:fixed; right:24px; bottom:calc(24px + env(safe-area-inset-bottom)); z-index:45; width:60px; height:60px; display:grid; place-items:center; padding:0; border:1px solid rgb(255 255 255 / .22); border-radius:50%; background:#121413; color:#FFFFFF; cursor:pointer; box-shadow:0 14px 34px rgb(0 0 0 / .3); transition:opacity 260ms ease, translate 360ms var(--ease, ease), background-color 200ms ease, visibility 0s linear 360ms; opacity:0; translate:0 12px; visibility:hidden }
.ao-launch.on{ opacity:1; translate:0 0; visibility:visible; transition:opacity 260ms ease, translate 360ms var(--ease, ease), background-color 200ms ease, visibility 0s }
.ao-launch svg{ width:26px; height:26px }
/* A soft grey ring breathes around the bubble, visible on both the dark and the light sections. */
.ao-launch::before{ content:""; position:absolute; inset:-1px; border-radius:50%; border:1.5px solid rgb(140 140 136 / .7); animation:ao-breathe 2.8s ease-out infinite; pointer-events:none }
@keyframes ao-breathe{ 0%{ opacity:.9; scale:1 } 70%,100%{ opacity:0; scale:1.45 } }
.ao-launch:hover{ background:#000000 }
.ao-launch:focus-visible{ outline:2px solid #FFFFFF; outline-offset:3px; box-shadow:0 0 0 6px #121413, 0 14px 34px rgb(0 0 0 / .3) }
.ao-tip{ position:absolute; right:calc(100% + 12px); top:50%; translate:6px -50%; padding:8px 12px; background:#FFFFFF; color:#121413; font:500 14px/1 var(--sans, system-ui, sans-serif); white-space:nowrap; box-shadow:0 8px 24px rgb(0 0 0 / .18), 0 0 0 1px rgb(0 0 0 / .06); opacity:0; pointer-events:none; transition:opacity 180ms ease, translate 240ms var(--ease, ease) }
.ao-launch:hover .ao-tip, .ao-launch:focus-visible .ao-tip{ opacity:1; translate:0 -50% }
.ao-panel{ position:fixed; right:20px; bottom:calc(20px + env(safe-area-inset-bottom)); z-index:65; width:min(400px, calc(100vw - 32px)); height:min(640px, calc(100vh - 118px)); display:grid; grid-template-rows:auto 1fr auto; background:#FFFFFF; color:var(--ink, #121413); border:1px solid var(--line, #DCDBD5); box-shadow:0 30px 70px rgb(0 0 0 / .22); font-family:var(--sans, system-ui, sans-serif); opacity:0; translate:0 14px; visibility:hidden; transition:opacity 220ms ease, translate 320ms var(--ease, ease), visibility 0s linear 320ms }
.ao-panel.on{ opacity:1; translate:0 0; visibility:visible; transition:opacity 220ms ease, translate 320ms var(--ease, ease), visibility 0s }
.ao-head{ display:grid; grid-template-columns:1fr auto; gap:2px 12px; align-items:start; padding:18px 18px 14px; border-bottom:1px solid var(--line, #DCDBD5) }
.ao-head h2{ margin:0; font:300 24px/1.1 var(--display, system-ui, sans-serif); letter-spacing:-0.03em }
.ao-head p{ grid-column:1; margin:0; font-size:13.5px; line-height:1.45; color:var(--muted, #5B5D59) }
.ao-x{ grid-column:2; grid-row:1 / span 2; display:grid; place-items:center; width:40px; height:40px; padding:0; border-radius:50%; border:1px solid var(--line, #DCDBD5); background:transparent; color:inherit; font-size:20px; line-height:1; cursor:pointer }
.ao-x:hover{ border-color:var(--ink, #121413) }
.ao-panel .icon{ width:1.15em; height:1.15em; flex-shrink:0 }
.ao-x .icon{ width:20px; height:20px }
.ao-log{ overflow-y:auto; overscroll-behavior:contain; padding:18px; display:flex; flex-direction:column; gap:14px }
.ao-msg{ max-width:88%; font-size:15px; line-height:1.55 }
.ao-msg p{ margin:0 }
.ao-msg p + p{ margin-top:8px }
.ao-msg a{ color:inherit; text-underline-offset:3px; overflow-wrap:anywhere }
.ao-msg ul{ display:grid; gap:6px; margin:8px 0 0; padding-left:1.1em }
.ao-msg ul:first-child{ margin-top:0 }
.ao-msg ul + p{ margin-top:8px }
.ao-bot{ align-self:flex-start; padding:12px 14px; background:var(--paper, #F7F6F2) }
.ao-me{ align-self:flex-end; padding:10px 14px; background:var(--ink, #121413); color:#FFFFFF }
.ao-acts{ display:flex; flex-wrap:wrap; gap:10px 16px; margin-top:12px }
.ao-acts a{ display:inline-flex; align-items:center; gap:6px; font-size:14px; font-weight:500; color:var(--ink, #121413); text-underline-offset:3px }
.ao-book{ display:inline-flex; align-items:center; gap:8px; min-height:40px; padding:0 16px; background:var(--ink, #121413); color:#FFFFFF !important; text-decoration:none; font-size:12.5px !important; letter-spacing:.12em; text-transform:uppercase }
.ao-chips{ display:flex; flex-wrap:wrap; gap:8px }
.ao-chips button{ min-height:38px; padding:0 14px; border:1px solid var(--line, #DCDBD5); border-radius:999px; background:#FFFFFF; color:var(--ink, #121413); font:inherit; font-size:14px; text-align:left; cursor:pointer; transition:border-color 200ms ease }
.ao-chips button:hover, .ao-chips button:focus-visible{ border-color:var(--ink, #121413) }
.ao-card{ align-self:stretch; display:grid; gap:10px; justify-items:start; padding:14px; border:1px solid var(--ink, #121413) }
.ao-card p{ margin:0; font:300 19px/1.25 var(--display, system-ui, sans-serif); letter-spacing:-0.02em }
.ao-typing{ align-self:flex-start; display:inline-flex; gap:5px; padding:14px; background:var(--paper, #F7F6F2) }
.ao-typing i{ width:6px; height:6px; border-radius:50%; background:var(--muted, #5B5D59); animation:ao-dot 1s ease-in-out infinite }
.ao-typing i:nth-child(2){ animation-delay:.15s } .ao-typing i:nth-child(3){ animation-delay:.3s }
@keyframes ao-dot{ 0%,100%{ opacity:.25 } 50%{ opacity:1 } }
.ao-form{ display:grid; grid-template-columns:1fr auto; gap:8px; padding:12px 14px 10px; border-top:1px solid var(--line, #DCDBD5) }
.ao-form input{ min-width:0; min-height:44px; padding:0 12px; border:1px solid var(--line, #DCDBD5); background:#FFFFFF; color:inherit; font:inherit; font-size:16px }
.ao-form input:focus-visible{ outline:2px solid var(--ink, #121413); outline-offset:0; border-color:var(--ink, #121413) }
.ao-form button{ min-height:44px; padding:0 16px; border:0; background:var(--ink, #121413); color:#FFFFFF; font:inherit; font-size:14px; font-weight:500; cursor:pointer }
.ao-note{ grid-column:1 / -1; margin:0; font-size:12px; color:var(--muted, #5B5D59) }
.ao-sr{ position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap }
.ao-panel :focus-visible{ outline:2px solid var(--ink, #121413); outline-offset:2px }
@media (max-width:600px){
  .ao-panel{ inset:0; width:auto; height:100dvh; border:0; translate:0 24px }
  .ao-launch{ right:16px; bottom:calc(16px + env(safe-area-inset-bottom)); width:56px; height:56px }
}
@media (hover:none){ .ao-tip{ display:none } }
@media (prefers-reduced-motion: reduce){ .ao-launch, .ao-panel{ translate:none !important } .ao-launch::before, .ao-typing i{ animation:none; opacity:0 } }`;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);

  /* markup */
  document.body.insertAdjacentHTML('beforeend', `
<button class="ao-launch" type="button" data-ask-open aria-haspopup="dialog" aria-label="Ask Omhar AI"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.8 7.04L4 20l1.1-4.4A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" stroke-width="2.4"/></svg><span class="ao-tip" aria-hidden="true">Ask Omhar AI</span></button>
<section class="ao-panel" role="dialog" aria-modal="false" aria-labelledby="ao-title" aria-describedby="ao-sub" hidden>
  <div class="ao-head"><h2 id="ao-title">Ask Omhar AI</h2><p id="ao-sub">Omhar built this assistant. He builds ones like it for businesses.</p><button class="ao-x" type="button" aria-label="Close chat">${icon('x')}</button></div>
  <div class="ao-log" role="log" aria-live="polite" aria-relevant="additions"></div>
  <form class="ao-form"><label class="ao-sr" for="ao-in">Ask a question about Omhar’s work</label><input id="ao-in" type="text" autocomplete="off" maxlength="300" placeholder="Ask about his work…"><button type="submit">Send</button><p class="ao-note">Typed questions are answered by AI, which can make mistakes. Please don’t share private details.</p></form>
</section>`);
  const panel = document.querySelector('.ao-panel'), log = panel.querySelector('.ao-log'), form = panel.querySelector('.ao-form'), input = panel.querySelector('#ao-in');
  const launch = document.querySelector('.ao-launch');
  let opener = null, started = false, sent = 0, cardShown = false, busy = false, hideT = 0, inerted = [];

  /* bubble: shows on every page once the opening animation has played, hides while the chat is open */
  let launchReady = false;
  const syncLaunch = () => launch.classList.toggle('on', launchReady && panel.hidden);
  setTimeout(() => { launchReady = true; syncLaunch(); }, reduce.matches ? 0 : 1200);

  /* building blocks */
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const scrollDown = () => log.scrollTo({ top: log.scrollHeight, behavior: reduce.matches ? 'auto' : 'smooth' });
  function chips(ids) {
    const wrap = el('div', 'ao-chips');
    ids.filter(id => KB[id] && KB[id].q).forEach(id => { const b = el('button', null, KB[id].q); b.type = 'button'; b.addEventListener('click', () => { wrap.remove(); ask(id); }); wrap.append(b); });
    return wrap;
  }
  function bookLink() { const a = el('a', 'ao-book', 'Chat on WhatsApp'); a.href = WHATSAPP; a.target = '_blank'; a.rel = 'noopener'; a.insertAdjacentHTML('beforeend', icon('arrow-right')); return a; }
  // A prepared answer is entry.a. A live answer arrives already split into paragraphs as body.
  function botSay(entry, followIds, body) {
    const m = el('div', 'ao-msg ao-bot');
    if (body) m.append(...body); else entry.a.forEach(t => m.append(el('p', null, t)));
    if (entry.link || entry.book) {
      const acts = el('div', 'ao-acts');
      if (entry.book) acts.append(bookLink());
      if (entry.link) { const a = el('a', null, entry.link[0]); a.insertAdjacentHTML('beforeend', icon('arrow-right')); a.href = entry.link[1]; a.addEventListener('click', () => { if (onAutoPage) close(); }); acts.append(a); }
      m.append(acts);
    }
    log.append(m);
    if (followIds && followIds.length) log.append(chips(followIds));
    if (sent >= 3 && !cardShown && !entry.book) {
      cardShown = true;
      const c = el('div', 'ao-card'); c.append(el('p', null, 'Want to talk it through with Omhar?'), bookLink()); log.append(c);
    }
    scrollDown();
  }
  function typing() {
    const t = el('div', 'ao-typing'); t.setAttribute('aria-label', 'Omhar AI is typing'); t.innerHTML = '<i></i><i></i><i></i>';
    log.append(t); scrollDown();
    return t;
  }
  const follows = id => (id === 'scope' || !KB[id] ? STARTERS[ctx()] : (KB[id].follow || []));
  // The thread as the live assistant sees it, newest last. /api/chat takes at most 8 messages of 1000 characters.
  const history = [];
  const remember = (role, content) => { history.push({ role, content: content.slice(0, 1000) }); if (history.length > 7) history.shift(); };
  function startTurn(text) {
    busy = true; sent++;
    log.querySelectorAll('.ao-chips').forEach(c => c.remove());
    log.append(el('div', 'ao-msg ao-me', text)); scrollDown();
    remember('user', text);
  }
  function prepared(id, t, wait) {
    const entry = KB[id] || KB.scope;
    remember('assistant', entry.a.join(' '));
    setTimeout(() => { t.remove(); botSay(entry, follows(id)); busy = false; }, wait);
  }
  function ask(id) {
    if (busy) return;
    startTurn((KB[id] || KB.scope).q);
    prepared(id, typing(), reduce.matches ? 0 : 650 + Math.min((KB[id] || KB.scope).a.join(' ').length, 400));
  }

  // Live answers are plain text. Blank lines start a new paragraph, and the booking link, the email and the site's
  // own pages become links.
  const LINKS = /(https:\/\/wa\.me\/639506009518[^\s)]*|omharregidor@gmail\.com|\/automations#auto-(?:live-inbox|sales-pulse|sop)\b|\/automations\b|\/gear\b)/;
  function inline(node, text) {
    text.split(LINKS).forEach((part, i) => {
      if (!(i % 2)) { node.append(part.replace(/\s*\n\s*/g, ' ')); return; }
      const a = el('a', null, part.includes('wa.me') ? 'WhatsApp' : part.replace('https://', ''));
      a.href = part.includes('@') ? 'mailto:' + part : part;
      if (part.startsWith('https://')) { a.target = '_blank'; a.rel = 'noopener'; }
      node.append(a);
    });
    return node;
  }
  // The assistant is asked for plain sentences, but a list it sends anyway still shows as a list.
  const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/;
  function paragraphs(text) {
    const out = [];
    text.trim().split(/\n{2,}/).forEach(block => {
      let lines = [], list = null;
      const flush = () => { if (lines.length) out.push(inline(el('p'), lines.join('\n'))); lines = []; };
      block.split('\n').forEach(line => {
        if (BULLET.test(line)) { flush(); if (!list) out.push(list = el('ul')); list.append(inline(el('li'), line.replace(BULLET, ''))); }
        else { list = null; lines.push(line); }
      });
      flush();
    });
    return out;
  }
  async function askLive(text) {
    if (busy) return;
    startTurn(text);
    const t = typing();
    const fallback = () => prepared(match(text), t, 0);
    let res;
    try {
      res = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: history }), signal: AbortSignal.timeout(25000) });
    } catch { return fallback(); }
    // The static provider means no live model answered, so a prepared answer beats its generic "book a call" reply.
    if (!res.ok || !res.body || res.headers.get('x-chat-provider') === 'static') return fallback();
    // The answer shows as it streams in. Screen readers hear it once, complete, when the finished message lands.
    const draft = el('div', 'ao-msg ao-bot'); draft.setAttribute('aria-hidden', 'true');
    const line = el('p'); draft.append(line);
    const reader = res.body.getReader(), dec = new TextDecoder();
    let full = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        if (!draft.isConnected) { t.remove(); log.append(draft); }
        line.textContent = full;
        log.scrollTop = log.scrollHeight;
      }
    } catch { /* keep what arrived */ }
    full += dec.decode();
    draft.remove();
    if (!full.trim()) return fallback();
    t.remove();
    remember('assistant', full);
    botSay({ book: /wa\.me\/639506009518/.test(full) }, follows(match(text)), paragraphs(full));
    busy = false;
  }
  function greet() {
    const where = ctx();
    const hi = where === 'home'
      ? 'Hi, I’m Omhar’s AI assistant. Ask me about his projects, his automations, or how to start one with him.'
      : where === 'gear'
        ? 'Hi, I’m Omhar’s AI assistant. Ask me about his gear, the tools he builds with, or how to start a project.'
        : 'Hi, I’m Omhar’s AI assistant. Ask me anything about the ' + TOPIC[where] + ' workflow, or about working with Omhar.';
    const m = el('div', 'ao-msg ao-bot'); m.append(el('p', null, hi)); log.append(m);
    log.append(chips(STARTERS[where]));
  }

  /* open and close */
  function open(o = {}) {
    opener = o.opener || document.activeElement;
    clearTimeout(hideT);
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('on'));
    syncLaunch();
    if (full.matches) { inerted = [...document.body.children].filter(n => n !== panel && !n.inert && n.tagName !== 'SCRIPT' && n.tagName !== 'STYLE'); inerted.forEach(n => { n.inert = true; }); panel.setAttribute('aria-modal', 'true'); }
    if (!started) { started = true; greet(); }
    if (o.ask) ask(o.ask);
    setTimeout(() => input.focus({ preventScroll: true }), reduce.matches ? 0 : 60);
  }
  function close() {
    panel.classList.remove('on');
    inerted.forEach(n => { n.inert = false; }); inerted = []; panel.setAttribute('aria-modal', 'false');
    hideT = setTimeout(() => { panel.hidden = true; syncLaunch(); }, reduce.matches ? 0 : 320);
    if (opener && opener.isConnected && !opener.classList.contains('ao-launch')) opener.focus({ preventScroll: true });
    else if (opener && opener.classList.contains('ao-launch')) setTimeout(() => launch.focus({ preventScroll: true }), reduce.matches ? 0 : 330);
  }
  panel.querySelector('.ao-x').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim(); if (!text || busy) return;
    input.value = '';
    askLive(text);
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-ask-open], [data-ask]');
    if (!t || panel.contains(t)) return;
    e.preventDefault();
    if (!panel.hidden && !t.dataset.ask) { input.focus(); return; }
    open({ opener: t, ask: t.dataset.ask });
  });
  // On the automation pages the starters follow the workflow on screen, so a new page starts a fresh chat.
  addEventListener('hashchange', () => { if (!onAutoPage || !started) return; log.replaceChildren(); history.length = 0; sent = 0; cardShown = false; if (!panel.hidden) greet(); else started = false; });
  window.AskOmhar = { open, close };
})();
