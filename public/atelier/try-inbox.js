/* Try it yourself, on the CS Live Inbox page. A visitor pastes a customer email and /api/demo/inbox runs the
   workflow's two steps live, first deciding whether it needs a reply, then drafting one for a person to review.
   When the live demo is off, the samples still show a result, clearly marked as written in advance. */
(() => {
  const form = document.getElementById('try-form');
  if (!form) return;
  const input = document.getElementById('try-in'), out = document.getElementById('try-out');
  const count = document.getElementById('try-count'), go = form.querySelector('.try-go');
  const samples = form.querySelector('.try-samples');
  const MAX = 1500;

  // Made-up emails for a small online shop, each with the result written in advance for when the demo is off.
  const SAMPLES = [
    {
      label: 'Late order',
      email: 'Hi, I ordered a blue linen shirt last Monday and it still hasn’t arrived. Can you tell me where it is?\n\nThanks,\nMaria',
      result: { needsReply: true, reason: 'A customer is asking where their order is.', draft: 'Hi Maria,\n\nThanks for getting in touch, and sorry your linen shirt hasn’t reached you yet. Your order [order number] shipped on [ship date], and you can follow it here: [tracking link].\n\nIf it still hasn’t arrived by [date], just reply to this email and we’ll sort it out right away.\n\nThe team' },
    },
    {
      label: 'Wrong size',
      email: 'Hello, the running shoes I got are a size too small. Can I swap them for a bigger pair?\n\nBen',
      result: { needsReply: true, reason: 'A customer wants to exchange an item for another size.', draft: 'Hi Ben,\n\nSorry the shoes came in too small, that’s no fun. We can help you swap them for a bigger pair. Here’s how exchanges work: [exchange steps].\n\nReply with your order number [order number] and the size you need, and we’ll take it from there.\n\nThe team' },
    },
    {
      label: 'Sales pitch',
      email: 'Congratulations! Your store has been selected for our premium SEO package. Reply today to claim 50% off.',
      result: { needsReply: false, reason: 'A sales offer, not a customer question.', draft: null },
    },
  ];

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const sync = () => {
    count.textContent = input.value.length + ' / ' + MAX;
    samples.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(input.value === SAMPLES[i].email)));
  };
  SAMPLES.forEach(s => {
    const b = el('button', null, s.label);
    b.type = 'button';
    b.addEventListener('click', () => { input.value = s.email; input.removeAttribute('aria-invalid'); sync(); input.focus(); });
    samples.append(b);
  });
  input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); sync(); });

  function step(label, title, text, wait) {
    const s = el('div', 'try-step' + (wait ? ' wait' : ''));
    s.append(el('small', null, label), el('b', null, title));
    if (text) s.append(el('p', null, text));
    return s;
  }
  function show(r, sampleNote) {
    const nodes = [];
    if (sampleNote) nodes.push(el('span', 'try-tag', sampleNote));
    nodes.push(step('Step 1 · Does it need a reply?', r.needsReply ? 'Yes, it needs a reply' : 'No reply needed', r.reason));
    if (r.needsReply && r.draft) {
      const s = step('Step 2 · Draft saved for review', 'Here is the draft');
      s.append(el('p', 'try-draft', r.draft));
      nodes.push(s, el('p', 'try-note', 'In the real workflow this lands in Gmail as a draft. A person reads it, fills anything in [brackets] and presses send.'));
    } else {
      nodes.push(el('p', 'try-note', 'In the real workflow this email is left alone, so nobody spends time on it.'));
    }
    out.replaceChildren(...nodes);
  }
  function message(text) { out.replaceChildren(el('p', 'try-empty', text)); }
  // Live demo unavailable. A sample still gets its result written in advance, labelled as such.
  function offline(text) {
    const s = SAMPLES.find(x => x.email === text);
    if (s) show(s.result, 'Live demo is off · sample result written in advance');
    else message('The live demo is switched off right now. Pick one of the samples to see a result written in advance.');
  }

  let busy = false;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;
    const text = input.value.trim();
    if (!text) { input.setAttribute('aria-invalid', 'true'); message('Paste an email first, or pick one of the samples.'); input.focus(); return; }
    busy = true; go.disabled = true;
    out.replaceChildren(step('Step 1 · Does it need a reply?', 'Reading the email', null, true));
    try {
      const res = await fetch('/api/demo/inbox', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: text.slice(0, MAX) }), signal: AbortSignal.timeout(30000) });
      if (res.status === 429) message('That’s a lot of tries in a minute. Wait a moment, then try again.');
      else if (res.status === 400) message('That email couldn’t be read. Keep it under 1500 characters and try again.');
      else if (!res.ok) offline(text);
      else {
        const r = await res.json();
        show({ needsReply: !!r.needsReply, reason: String(r.reason || ''), draft: r.draft ? String(r.draft) : null });
      }
    } catch {
      offline(text);
    }
    busy = false; go.disabled = false;
  });
  sync();
})();
