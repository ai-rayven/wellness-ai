// AI coach mockup: three switchable surfaces (Chat, Sheet, Briefing) sharing one scripted "brain".
// Uses the dashboard's globals (targets, eaten, meals, weekChange, renderDashboard).

const VARIANTS = { a: 'Chat', b: 'Sheet', c: 'Briefing' };
const SUGGESTIONS = [
  { icon: '💪', q: 'High-protein snack', sub: 'Close today’s protein gap' },
  { icon: '📝', q: 'Log: 2 eggs & toast', sub: 'Type or say what you ate' },
  { icon: '🛒', q: 'Cook from my pantry', sub: 'Recipes from what you bought' },
  { icon: '🔁', q: 'Swap dinner', sub: 'Same macros, something different' },
  { icon: '📅', q: 'Plan tomorrow', sub: 'A full day that hits your targets' },
];

let variant = 'a';
try { variant = localStorage.getItem('coachVariant') || 'a'; } catch {}
let thread = []; // { from: 'me' | 'ai', text, card }

const left = () => ({
  kcal: targets.kcal - eaten.kcal,
  protein: targets.protein - eaten.protein,
});
const recalc = () => (eaten.kcal = eaten.protein * 4 + eaten.carbs * 4 + eaten.fat * 9);

// ---------- Scripted replies ----------
function reply(text) {
  const t = text.toLowerCase();
  if (/log|ate|had/.test(t)) {
    const item = { icon: '🍳', name: '2 eggs & sourdough toast', kcal: 300, p: 18, c: 30, f: 12 };
    return { text: `Logged it. You have ${left().protein - item.p}g protein and ${left().kcal - item.kcal} kcal left today.`, card: { type: 'log', ...item } };
  }
  if (/protein|snack/.test(t)) {
    return { text: `You need ${left().protein}g more protein. This fits your remaining ${left().kcal} kcal:`,
      card: { type: 'recipe', icon: '🥞', name: 'Cottage cheese protein pancakes', time: '10 min', kcal: 340, p: 34, c: 30, f: 8, act: 'Add as snack' } };
  }
  if (/pantry|cook|bought/.test(t)) {
    return { text: 'From your last grocery log: chicken thighs, rice, spinach, and lemons. Chicken expires tomorrow, so use it first:',
      card: { type: 'recipe', icon: '🍋', name: 'Lemon chicken & spinach rice', time: '25 min', kcal: 580, p: 48, c: 55, f: 16, act: 'Add to dinner' } };
  }
  if (/swap|dinner/.test(t)) {
    return { text: 'Here’s a swap with about the same macros as the miso salmon bowl:',
      card: { type: 'recipe', icon: '🌮', name: 'Turkey taco lettuce bowls', time: '20 min', kcal: 650, p: 50, c: 52, f: 22, act: 'Replace dinner' } };
  }
  if (/plan|tomorrow/.test(t)) {
    return { text: 'Tomorrow hits 2,190 kcal and 182g protein, mostly from what’s in your pantry:',
      card: { type: 'plan', items: [['🥣', 'Overnight protein oats', 450], ['🥙', 'Chicken pita wrap', 610], ['🍎', 'Apple + string cheese', 190], ['🍝', 'Beef & lentil bolognese', 720]], act: 'Use this plan' } };
  }
  return { text: 'I can build meals around your goals, log what you eat, or plan from your pantry. Try one of these:', card: { type: 'suggest' } };
}

// ---------- Cards ----------
const macroLine = (c) => `<span class="num">${c.kcal} kcal · <b style="color:var(--text)">${c.p}g P</b> · ${c.c}g C · ${c.f}g F</span>`;

function card(c, i) {
  if (!c) return '';
  if (c.type === 'recipe') return `<div class="rcard">
      <div class="rcard-top"><div class="ph">${c.icon}</div><div class="t"><b>${c.name}</b><span class="muted small">${c.time}</span></div></div>
      <div class="small muted">${macroLine(c)}</div>
      <div class="rcard-acts"><button class="btn" data-act="${i}">${c.done ? 'Added ✓' : c.act}</button><button class="btn ghost" data-recipe>View recipe</button></div>
    </div>`;
  if (c.type === 'log') return `<div class="rcard">
      <div class="rcard-top"><div class="ph">${c.icon}</div><div class="t"><b>${c.name}</b><span class="small muted">${macroLine(c)}</span></div>
      <div class="check ${c.undone ? '' : 'done'}">${c.undone ? '' : '✓'}</div></div>
      <div class="rcard-acts"><button class="btn ghost" data-act="${i}">${c.undone ? 'Log again' : 'Undo'}</button></div>
    </div>`;
  if (c.type === 'plan') return `<div class="rcard">
      ${c.items.map(([ic, n, k]) => `<div class="plan-row"><span>${ic}</span><span class="t">${n}</span><span class="muted small num">${k}</span></div>`).join('')}
      <div class="rcard-acts"><button class="btn" data-act="${i}">${c.done ? 'Plan saved ✓' : c.act}</button></div>
    </div>`;
  if (c.type === 'suggest') return `<div class="chips wrap">${SUGGESTIONS.map((s) => `<button class="chip" data-ask="${s.q}">${s.q}</button>`).join('')}</div>`;
  return '';
}

// Card actions mutate the mock state so the dashboard reflects them.
function act(i) {
  const c = thread[i].card;
  if (c.type === 'log') {
    const sign = c.undone ? 1 : -1;
    eaten.protein += sign * c.p; eaten.carbs += sign * c.c; eaten.fat += sign * c.f; recalc();
    if (c.undone) meals.push(c.meal); else meals.splice(meals.indexOf(c.meal), 1);
    c.undone = !c.undone;
  } else if (!c.done) {
    c.done = true;
    if (c.act === 'Replace dinner') Object.assign(meals[meals.length - 1], { icon: c.icon, name: c.name, kcal: c.kcal, p: c.p });
    if (c.act === 'Add as snack' || c.act === 'Add to dinner') meals.push({ icon: c.icon, name: c.name, kcal: c.kcal, p: c.p, done: false });
  }
  renderDashboard();
  renderCoach();
}

// ---------- Ask flow ----------
let typing = false;
function ask(q) {
  q = q.trim();
  if (!q || typing) return;
  thread.push({ from: 'me', text: q });
  typing = true;
  renderCoach();
  setTimeout(() => {
    const r = reply(q);
    if (r.card && r.card.type === 'log') { // logging applies immediately
      eaten.protein += r.card.p; eaten.carbs += r.card.c; eaten.fat += r.card.f; recalc();
      r.card.meal = { icon: r.card.icon, name: r.card.name, kcal: r.card.kcal, p: r.card.p, done: true };
      meals.push(r.card.meal);
      renderDashboard();
    }
    thread.push({ from: 'ai', ...r });
    typing = false;
    renderCoach();
  }, 700);
}

// ---------- Shared pieces ----------
const contextStrip = () => `<div class="ctx num">
  <span><b>${left().kcal}</b> kcal left</span><span><b style="color:var(--protein)">${left().protein}g</b> protein left</span><span><b>${weekChange}</b> lb/wk</span>
</div>`;

const askBar = (ph = 'Ask your coach or log a meal…') => `<form class="ask">
  <input name="q" placeholder="${ph}" autocomplete="off" enterkeyhint="send" aria-label="Message your coach">
  <button type="button" class="mic" aria-label="Voice">🎙️</button>
  <button class="send" aria-label="Send">↑</button>
</form>`;

const head = (title) => `<div class="c-head">
  <button class="icon-btn" data-close aria-label="Close">✕</button>
  <b>${title}</b>
  <div class="mini-switch" role="tablist" aria-label="Coach design">
    ${Object.entries(VARIANTS).map(([k, n]) => `<button data-variant="${k}" aria-selected="${k === variant}">${k.toUpperCase()}</button>`).join('')}
  </div>
</div>`;

const bubble = (m, i) => m.from === 'me'
  ? `<div class="msg me">${m.text}</div>`
  : `<div class="msg ai"><i class="av">✦</i><div>${m.text}${card(m.card, i)}</div></div>`;
const lastOf = (from) => [...thread].reverse().find((m) => m.from === from && !('brief' in m));
const typingDots = () => (typing ? `<div class="msg ai"><i class="av">✦</i><div class="dots"><span></span><span></span><span></span></div></div>` : '');

// ---------- Variant A: Chat (full-screen conversation) ----------
function chatView() {
  const greet = { from: 'ai', text: `Morning! You’re ${left().protein}g short on protein with ${left().kcal} kcal to go. Want me to fix that?`, card: { type: 'suggest' } };
  const msgs = thread.length ? thread : [greet];
  return `<div class="c-full">
    ${head('Coach')}
    ${contextStrip()}
    <div class="c-scroll">${msgs.map(bubble).join('')}${typingDots()}</div>
    <div class="c-foot">
      <div class="chips">${SUGGESTIONS.map((s) => `<button class="chip" data-ask="${s.q}">${s.q}</button>`).join('')}</div>
      ${askBar()}
    </div>
  </div>`;
}

// ---------- Variant B: Sheet (one focused answer over the dashboard) ----------
function sheetView() {
  const lastAi = lastOf('ai'), lastMe = lastOf('me');
  const body = typing
    ? `<div class="q-echo">${lastMe.text}</div>${typingDots()}`
    : lastAi && lastMe
      ? `<div class="q-echo">${lastMe.text}</div><div class="answer">${lastAi.text}${card(lastAi.card, thread.indexOf(lastAi))}</div>
         <button class="link" data-reset>← Ask something else</button>`
      : `<div class="list">${SUGGESTIONS.map((s) => `<button class="list-row" data-ask="${s.q}">
           <span class="ic">${s.icon}</span><span class="t"><b>${s.q}</b><span class="muted small">${s.sub}</span></span><span class="muted">›</span>
         </button>`).join('')}</div>`;
  return `<div class="c-backdrop" data-close></div>
  <div class="c-sheet">
    <div class="grab"></div>
    ${head('Coach')}
    ${contextStrip()}
    <div class="c-scroll">${body}</div>
    <div class="c-foot">${askBar('What do you need?')}</div>
  </div>`;
}

// ---------- Variant C: Briefing (proactive cards first, ask second) ----------
const briefing = [
  { tag: 'Protein gap', text: () => `You’re ${left().protein}g short. A quick fix that fits ${left().kcal} kcal:`, q: 'High-protein snack' },
  { tag: 'Pantry', text: () => 'Chicken thighs from Tuesday’s shop expire tomorrow.', q: 'Cook from my pantry' },
  { tag: 'Weekly check-in', text: () => `Trend is ${weekChange} lb this week, right on pace. I’d keep targets as they are.`, q: null },
];
let briefState = {}; // index -> 'open' | 'ok' | 'dismissed'

function briefingView() {
  const cards = briefing.map((b, i) => {
    if (briefState[i] === 'dismissed') return '';
    const ans = thread.find((m) => m.brief === i);
    return `<div class="bcard">
      <div class="tag">${b.tag}</div>
      <p>${b.text()}</p>
      ${ans ? card(ans.card, thread.indexOf(ans)) : b.q
        ? `<div class="rcard-acts"><button class="btn" data-brief="${i}">Show me</button><button class="btn ghost" data-dismiss="${i}">Not now</button></div>`
        : `<div class="rcard-acts"><button class="btn" data-dismiss="${i}">${briefState[i] === 'ok' ? 'Kept ✓' : 'Sounds good'}</button><button class="btn ghost" data-ask="Adjust my targets">Adjust</button></div>`}
    </div>`;
  }).join('');
  const lastMe = lastOf('me'), lastAi = lastOf('ai');
  return `<div class="c-full">
    ${head('Today’s briefing')}
    <div class="c-scroll">
      <div class="brief-hi">
        <div class="big num">${left().kcal}<span class="muted" style="font-size:15px;font-weight:500"> kcal left</span></div>
        <div class="muted small num">${left().protein}g protein to go · ${((n) => `${n} meal${n === 1 ? '' : 's'} planned`)(meals.filter((m) => !m.done).length)}</div>
      </div>
      ${lastMe ? `<div class="bcard asked"><div class="tag">You asked: ${lastMe.text}</div>
        ${typing ? typingDots() : `<p>${lastAi.text}</p>${card(lastAi.card, thread.indexOf(lastAi))}`}</div>` : ''}
      ${cards || '<p class="muted small" style="text-align:center">You’re all caught up.</p>'}
    </div>
    <div class="c-foot">${askBar()}</div>
  </div>`;
}

// Briefing "Show me" answers inline inside its own card (no typing delay needed).
function openBrief(i) {
  const r = reply(briefing[i].q);
  thread.push({ from: 'ai', brief: i, ...r });
  renderCoach();
}

// ---------- Mount ----------
const layer = document.getElementById('coach');
const views = { a: chatView, b: sheetView, c: briefingView };

function renderCoach() {
  if (layer.hidden) return;
  const focused = document.activeElement && document.activeElement.name === 'q';
  layer.classList.remove('v-a', 'v-b', 'v-c');
  layer.classList.add('v-' + variant);
  layer.innerHTML = views[variant]();
  const sc = layer.querySelector('.c-scroll');
  if (sc && variant === 'a') sc.scrollTop = sc.scrollHeight;
  if (focused) layer.querySelector('input[name=q]').focus();
}

function openCoach(q) {
  layer.hidden = false;
  document.body.classList.add('coach-open');
  if (location.hash !== '#coach') history.pushState(null, '', '#coach');
  layer.classList.add('enter');
  setTimeout(() => layer.classList.remove('enter'), 300);
  renderCoach();
  if (q) ask(q);
}
function closeCoach() {
  layer.hidden = true;
  document.body.classList.remove('coach-open');
  if (location.hash === '#coach') history.back();
}
addEventListener('popstate', () => { if (location.hash !== '#coach' && !layer.hidden) closeCoach(); });

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-ask],[data-close],[data-variant],[data-act],[data-reset],[data-brief],[data-dismiss],[data-coach]');
  if (!el) return;
  const d = el.dataset;
  if ('coach' in d) return openCoach();
  if ('ask' in d) {
    if (layer.hidden) openCoach(d.ask); else ask(d.ask);
    if (!d.ask) layer.querySelector('input[name=q]').focus();
    return;
  }
  if ('close' in d) return closeCoach();
  if ('variant' in d) {
    variant = d.variant;
    try { localStorage.setItem('coachVariant', variant); } catch {}
    return renderCoach();
  }
  if ('act' in d) return act(+d.act);
  if ('reset' in d) { thread = []; return renderCoach(); }
  if ('brief' in d) return openBrief(+d.brief);
  if ('dismiss' in d) {
    const i = +d.dismiss;
    briefState[i] = briefing[i].q ? 'dismissed' : 'ok';
    if (briefing[i].q === null) setTimeout(() => { briefState[i] = 'dismissed'; renderCoach(); }, 800);
    return renderCoach();
  }
});
document.addEventListener('submit', (e) => {
  if (!e.target.matches('.ask')) return;
  e.preventDefault();
  const input = e.target.q;
  ask(input.value);
  input.value = '';
});

if (location.hash === '#coach') { history.replaceState(null, '', location.pathname); openCoach(); }
