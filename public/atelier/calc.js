/* Time-saved estimate on the homepage. Hours a month = hours a week x people x the share a workflow takes over
   x 4.33 weeks, and its worth is those hours x the visitor's own hourly cost. The working line under the result
   always shows that sum, so nothing is hidden or invented. */
(() => {
  const form = document.querySelector('.calc-in');
  if (!form) return;
  const $ = id => document.getElementById(id);
  const hrs = $('calc-hrs'), ppl = $('calc-ppl'), share = $('calc-share'), rate = $('calc-rate');
  const WEEKS = 4.33;
  const peso = n => '₱' + Math.round(n).toLocaleString('en-PH');
  let sayT = 0;

  function update() {
    form.querySelectorAll('output').forEach(o => { o.textContent = $(o.htmlFor.value).value + o.dataset.unit; });
    const h = +hrs.value, p = +ppl.value, s = +share.value / 100, r = Math.max(0, +rate.value || 0);
    // The worth uses the rounded hours, so the working line multiplies out exactly.
    const hours = Math.round(h * p * s * WEEKS), worth = Math.round(hours * r / 10) * 10;
    $('calc-hours').textContent = hours.toLocaleString('en-PH');
    $('calc-money').textContent = peso(worth);
    $('calc-work').textContent = `${h} h a week × ${p} ${p === 1 ? 'person' : 'people'} × ${share.value}% × ${WEEKS} weeks ≈ ${hours} h, × ${peso(r)} an hour`;
    // Screen readers hear the result once the visitor stops adjusting, not on every slider step.
    clearTimeout(sayT);
    sayT = setTimeout(() => { $('calc-say').textContent = `About ${hours} hours a month back, worth about ${peso(worth)}.`; }, 700);
  }
  form.addEventListener('input', update);
  form.addEventListener('submit', e => e.preventDefault());
  update();
})();
