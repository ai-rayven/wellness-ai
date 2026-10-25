// Onboarding mockup: three designs (Steps, Chat, Story) over one shared flow + swipe engine.
// Forms are prefilled so the flow can be clicked through quickly.

// ---------- Data ----------
const STEPS = ['welcome', 'body', 'activity', 'goal', 'protein', 'carbs', 'fats', 'treats', 'report'];

const CATS = {
  protein: { label: 'Proteins', color: 'var(--protein)', ask: 'Which proteins would you happily eat?' },
  carbs: { label: 'Carbs', color: 'var(--carbs)', ask: 'Now carbs. What fuels you?' },
  fats: { label: 'Fats', color: 'var(--fat)', ask: 'Healthy fats you enjoy?' },
  treats: { label: 'Treats', color: 'var(--treat)', ask: 'Be honest: which treats do you love?' },
};

// [emoji, name, per-100g note]
const FOODS = {
  protein: [['🍗', 'Chicken breast', '31g protein · 165 kcal'], ['🐟', 'Salmon', '25g protein · 208 kcal'], ['🥚', 'Eggs', '13g protein · 155 kcal'],
    ['🥛', 'Greek yogurt', '10g protein · 59 kcal'], ['🥩', 'Lean beef', '26g protein · 217 kcal'], ['🥡', 'Tofu', '8g protein · 76 kcal'],
    ['🦐', 'Shrimp', '24g protein · 99 kcal'], ['🦃', 'Turkey', '29g protein · 189 kcal'], ['🫘', 'Lentils', '9g protein · 116 kcal']],
  carbs: [['🍚', 'White rice', '28g carbs · 130 kcal'], ['🥣', 'Oats', '66g carbs · 389 kcal'], ['🍠', 'Sweet potato', '20g carbs · 86 kcal'],
    ['🍝', 'Pasta', '31g carbs · 158 kcal'], ['🍞', 'Sourdough', '51g carbs · 270 kcal'], ['🌾', 'Quinoa', '21g carbs · 120 kcal'],
    ['🍌', 'Banana', '23g carbs · 89 kcal'], ['🫐', 'Berries', '14g carbs · 57 kcal']],
  fats: [['🥑', 'Avocado', '15g fat · 160 kcal'], ['🥜', 'Peanut butter', '50g fat · 588 kcal'], ['🌰', 'Almonds', '49g fat · 579 kcal'],
    ['🫒', 'Olive oil', '100g fat · 884 kcal'], ['🧀', 'Cheddar', '33g fat · 403 kcal'], ['🥥', 'Coconut', '33g fat · 354 kcal']],
  treats: [['🍦', 'Ice cream', '207 kcal'], ['🍫', 'Dark chocolate', '546 kcal'], ['🍪', 'Cookies', '488 kcal'],
    ['🍩', 'Donuts', '452 kcal'], ['🍬', 'Gummy candy', '343 kcal'], ['🧁', 'Cupcakes', '305 kcal']],
};

const ACTIVITY = [
  { k: 'sedentary', icon: '🪑', t: 'Mostly sitting', d: 'Desk job, little exercise', x: 1.2 },
  { k: 'light', icon: '🚶', t: 'Lightly active', d: 'Walks, 1–2 workouts a week', x: 1.375 },
  { k: 'moderate', icon: '🏃', t: 'Moderately active', d: '3–4 workouts a week', x: 1.55 },
  { k: 'very', icon: '🏋️', t: 'Very active', d: '5+ workouts or a physical job', x: 1.725 },
];
const GOALS = [
  { k: 'lose', icon: '🔥', t: 'Lose fat', d: 'About 1 lb a week', adj: -0.2 },
  { k: 'maintain', icon: '⚖️', t: 'Maintain', d: 'Eat better, same weight', adj: 0 },
  { k: 'gain', icon: '💪', t: 'Build muscle', d: 'Lean bulk', adj: 0.1 },
];

// Prefilled answers for quick clicking.
const state = {
  step: 0,
  sex: 'male', age: 32, height: 70, weight: 182, // height in inches, weight in lb
  activity: 'moderate', goal: 'lose',
  swipes: {}, // food name -> true (like) | false (nope)
  slide: 0, // story report slide (design C)
};
let design = 'a';
try { design = localStorage.getItem('obDesign') || 'a'; } catch {}

// ---------- Profile math ----------
const fmtHeight = (inches) => `${Math.floor(inches / 12)}′${inches % 12}″`;
const pick = (list, k) => list.find((o) => o.k === k);
const liked = (cat) => FOODS[cat].filter((f) => state.swipes[f[1]] === true);
const noped = (cat) => FOODS[cat].filter((f) => state.swipes[f[1]] === false);
const remaining = (cat) => FOODS[cat].filter((f) => !(f[1] in state.swipes));

function profile() {
  const kg = state.weight * 0.4536, cm = state.height * 2.54;
  // Mifflin–St Jeor BMR × activity, then goal adjustment.
  const bmr = 10 * kg + 6.25 * cm - 5 * state.age + (state.sex === 'male' ? 5 : -161);
  const tdee = bmr * pick(ACTIVITY, state.activity).x;
  const kcal = Math.round((tdee * (1 + pick(GOALS, state.goal).adj)) / 10) * 10;
  const protein = Math.round(state.weight * (state.goal === 'maintain' ? 0.8 : 1));
  const fat = Math.round(state.weight * 0.35);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));

  const names = (cat) => liked(cat).map((f) => f[1]);
  const lp = names('protein'), lc = names('carbs'), lf = names('fats'), lt = names('treats');
  const plant = lp.filter((n) => ['Tofu', 'Lentils'].includes(n)).length;
  const meat = lp.filter((n) => ['Chicken breast', 'Lean beef', 'Turkey'].includes(n)).length;
  const sea = lp.filter((n) => ['Salmon', 'Shrimp'].includes(n)).length;
  const tags = [];
  tags.push(plant && !meat ? 'Plant-forward' : sea === 2 ? 'Seafood lover' : 'Omnivore');
  tags.push(lc.length >= 5 ? 'Carb-friendly' : lc.length <= 2 ? 'Low-carb leaning' : 'Balanced carbs');
  if (lt.length >= 3) tags.push('Sweet tooth');

  const meals = [];
  for (let i = 0; i < 3 && lp.length && lc.length; i++) {
    const f = lf.length ? ` & ${lf[i % lf.length].toLowerCase()}` : '';
    meals.push(`${lp[i % lp.length]}, ${lc[i % lc.length].toLowerCase()}${f}`);
  }
  const treatKcal = lt.length ? 150 + 50 * Math.min(2, lt.length - 1) : 0;
  return { kcal, protein, carbs, fat, tdee: Math.round(tdee), tags, lp, lc, lf, lt, meals, treatKcal,
    avoid: ['protein', 'carbs', 'fats', 'treats'].flatMap((c) => noped(c).map((f) => f[1])) };
}

// ---------- Navigation ----------
const ob = document.getElementById('ob');
const go = (i) => { state.step = Math.max(0, Math.min(STEPS.length - 1, i)); state.slide = 0; render(); };
const next = () => go(state.step + 1);

// Auto-swipe: fill the rest of the current deck with a plausible mix (dev shortcut).
function autoSwipe(cat) {
  remaining(cat).forEach((f, i) => (state.swipes[f[1]] = cat === 'treats' ? i % 2 === 0 : i % 3 !== 2));
  next();
}

function record(cat, name, like) {
  state.swipes[name] = like;
  if (!remaining(cat).length) setTimeout(next, 250);
  else render();
}

// ---------- Swipe engine (shared by all designs) ----------
function deck(cat, cls = '') {
  const rest = remaining(cat);
  const total = FOODS[cat].length, done = total - rest.length;
  const cards = rest.slice(0, 3).reverse().map((f, i, arr) => {
    const top = i === arr.length - 1;
    const depth = arr.length - 1 - i;
    return `<div class="sw-card ${top ? 'is-top' : ''}" data-name="${f[1]}" style="--depth:${depth};--cat:${CATS[cat].color}">
      <div class="stamp like">LIKE</div><div class="stamp nope">NOPE</div>
      <div class="sw-emoji">${f[0]}</div>
      <div class="sw-info"><b>${f[1]}</b><span>${f[2]} per 100 g</span></div>
    </div>`;
  }).join('');
  return `<div class="sw ${cls}" data-cat="${cat}">
    <div class="sw-count num">${done + 1 > total ? total : done + 1} / ${total}</div>
    <div class="sw-stack">${cards}</div>
    <div class="sw-btns">
      <button class="sw-btn nope" data-swipe="0" aria-label="Don't like">✕</button>
      <button class="sw-auto" data-auto="${cat}">Auto-swipe ⏩</button>
      <button class="sw-btn like" data-swipe="1" aria-label="Like">♥</button>
    </div>
  </div>`;
}

function fly(card, like) {
  const cat = card.closest('.sw').dataset.cat;
  card.style.transition = 'transform .25s ease-in, opacity .25s';
  card.style.transform = `translateX(${like ? 140 : -140}%) rotate(${like ? 18 : -18}deg)`;
  card.style.opacity = '0';
  card.querySelector(like ? '.like' : '.nope').style.opacity = 1;
  setTimeout(() => record(cat, card.dataset.name, like), 200);
}

function bindDeck() {
  const card = ob.querySelector('.sw-card.is-top');
  if (!card) return;
  let x0 = null, dx = 0;
  card.addEventListener('pointerdown', (e) => { x0 = e.clientX; dx = 0; card.setPointerCapture(e.pointerId); card.style.transition = 'none'; });
  card.addEventListener('pointermove', (e) => {
    if (x0 === null) return;
    dx = e.clientX - x0;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    card.querySelector('.like').style.opacity = Math.max(0, dx / 90);
    card.querySelector('.nope').style.opacity = Math.max(0, -dx / 90);
  });
  const end = () => {
    if (x0 === null) return;
    x0 = null;
    if (Math.abs(dx) > 90) return fly(card, dx > 0);
    card.style.transition = 'transform .2s';
    card.style.transform = '';
    card.querySelectorAll('.stamp').forEach((s) => (s.style.opacity = 0));
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', end);
}

// ---------- Shared controls ----------
const stepper = (key, label, show, step, min, max) => `<div class="stepper">
  <span class="st-label">${label}</span>
  <div class="st-ctrl">
    <button data-inc="${key}" data-by="${-step}" data-min="${min}" data-max="${max}" aria-label="Decrease ${label}">−</button>
    <b class="num">${show(state[key])}</b>
    <button data-inc="${key}" data-by="${step}" data-min="${min}" data-max="${max}" aria-label="Increase ${label}">+</button>
  </div>
</div>`;

const seg = (key, opts) => `<div class="seg">${opts.map(([v, t]) =>
  `<button data-set="${key}" data-val="${v}" aria-pressed="${state[key] === v}">${t}</button>`).join('')}</div>`;

const options = (key, list) => `<div class="opts">${list.map((o) => `<button class="opt" data-set="${key}" data-val="${o.k}" aria-pressed="${state[key] === o.k}">
  <span class="opt-ic">${o.icon}</span><span class="opt-t"><b>${o.t}</b><span>${o.d}</span></span></button>`).join('')}</div>`;

const bodyFields = () => seg('sex', [['male', 'Male'], ['female', 'Female']])
  + stepper('height', 'Height', fmtHeight, 1, 48, 90)
  + stepper('weight', 'Weight', (v) => `${v} lb`, 1, 80, 450)
  + stepper('age', 'Age', (v) => v, 1, 13, 99);

const chipList = (items, cls = '') => items.length
  ? `<div class="chips wrap">${items.map((n) => `<span class="chip ${cls}">${n}</span>`).join('')}</div>`
  : '<span class="muted small">None picked</span>';

const macroSplit = (p) => {
  const parts = [['Protein', p.protein * 4, 'var(--protein)', p.protein], ['Carbs', p.carbs * 4, 'var(--carbs)', p.carbs], ['Fat', p.fat * 9, 'var(--fat)', p.fat]];
  return `<div class="stack" role="img" aria-label="Macro split">${parts.map(([, k, c]) => `<div style="width:${(k / p.kcal) * 100}%;background:${c}"></div>`).join('')}</div>
  <div class="grid3" style="margin-top:12px">${parts.map(([n, , c, g]) => `<div class="tile"><div class="k"><span class="dot" style="background:${c}"></span>${n}</div><div class="v num">${g}<span class="muted" style="font-size:13px;font-weight:500">g</span></div></div>`).join('')}</div>`;
};

// ---------- Design A: Steps (one question per screen) ----------
function designA() {
  const s = STEPS[state.step];
  const screen = (title, sub, body, cta = 'Continue') => `<div class="a-screen">
    <div class="a-body"><h2 class="a-title">${title}</h2>${sub ? `<p class="muted">${sub}</p>` : ''}${body}</div>
    ${cta ? `<div class="a-foot"><button class="btn wide" data-next>${cta}</button></div>` : ''}
  </div>`;
  if (s === 'welcome') return `<div class="a-screen a-welcome">
      <div class="a-body"><div class="logo">✦</div><h2 class="a-title">We make it easy to change your body.</h2>
      <p class="muted">A few questions and some swiping. Then your coach builds meals around food you actually like.</p></div>
      <div class="a-foot"><button class="btn wide" data-next>Get started</button><p class="muted small" style="text-align:center">Takes about 2 minutes</p></div>
    </div>`;
  if (s === 'body') return screen('About you', 'We use this to estimate how much you burn each day.', bodyFields());
  if (s === 'activity') return screen('How active are you?', 'Think about a typical week.', options('activity', ACTIVITY));
  if (s === 'goal') return screen('What’s your goal?', '', options('goal', GOALS));
  if (CATS[s]) return screen(`<span class="cat-pill" style="--cat:${CATS[s].color}">${CATS[s].label}</span>${CATS[s].ask}`,
    'Swipe right if you like it, left if you don’t.', deck(s), null);
  const p = profile();
  return screen('Here’s what we learned', '', `
    <section class="card"><div class="muted small">Daily target</div>
      <div class="big num">${p.kcal.toLocaleString()} <span class="muted" style="font-size:15px;font-weight:500">kcal</span></div>
      <div class="muted small num" style="margin-bottom:12px">You burn about ${p.tdee.toLocaleString()} kcal/day · ${pick(GOALS, state.goal).t.toLowerCase()}</div>
      ${macroSplit(p)}
    </section>
    <section class="card"><div class="card-h"><h2>Your taste profile</h2></div>${chipList(p.tags, 'tag-chip')}</section>
    <section class="card"><div class="card-h"><h2>Meals we’ll start with</h2></div>
      ${p.meals.length ? p.meals.map((m) => `<div class="plan-row"><span>🍽️</span><span class="t">${m}</span></div>`).join('') : '<span class="muted small">Swipe a few more foods to get meal ideas.</span>'}
    </section>
    <section class="card"><div class="card-h"><h2>Treats</h2></div>
      <p style="margin:0">${p.treatKcal ? `We’ll keep ~${p.treatKcal} kcal a day for <b>${p.lt.slice(0, 2).join(' or ').toLowerCase()}</b>. No guilt, it’s in the plan.` : 'No treat budget, so there’s more room for meals.'}</p>
    </section>
    <section class="card"><div class="card-h"><h2>We’ll avoid</h2></div>${chipList(p.avoid)}</section>`, 'Start my plan');
}

// ---------- Design B: Chat (the coach runs onboarding) ----------
function designB() {
  const p = profile();
  const ai = (html) => `<div class="msg ai"><i class="av">✦</i><div>${html}</div></div>`;
  const me = (t) => `<div class="msg me">${t}</div>`;
  const answer = {
    welcome: () => me('Let’s do it'),
    body: () => me(`${state.sex === 'male' ? 'Male' : 'Female'}, ${state.age}, ${fmtHeight(state.height)}, ${state.weight} lb`),
    activity: () => me(pick(ACTIVITY, state.activity).t),
    goal: () => me(pick(GOALS, state.goal).t),
  };
  const ask = {
    welcome: () => ai('Hi! I’m your nutrition coach. <b>We make it easy to change your body.</b> Can I ask a few quick questions?'),
    body: () => ai('First, the basics. I use these to estimate how much energy you burn.'),
    activity: () => ai('How active is a normal week for you?'),
    goal: () => ai('And what are we working toward?'),
  };
  const out = [];
  STEPS.slice(0, state.step + 1).forEach((s, i) => {
    const current = i === state.step;
    if (CATS[s]) {
      out.push(ai(`${CATS[s].ask} <span class="muted">Swipe right for yes.</span>`));
      if (current) out.push(`<div class="b-widget">${deck(s, 'sw-sm')}</div>`);
      else out.push(me(liked(s).length ? `👍 ${liked(s).map((f) => f[1]).join(', ')}` : 'None of those'));
      return;
    }
    if (s === 'report') {
      out.push(ai(`Got it, here’s your plan. I’d aim for <b class="num">${p.kcal.toLocaleString()} kcal</b> a day.${macroSplit(p)}`));
      out.push(ai(`Your taste profile: <b>${p.tags.join(' · ')}</b>. I’ll start you on:
        ${p.meals.map((m) => `<div class="plan-row" style="margin-top:6px"><span>🍽️</span><span class="t">${m}</span></div>`).join('')}`));
      out.push(ai(p.treatKcal ? `And I’ll save ~${p.treatKcal} kcal a day for ${p.lt.slice(0, 2).join(' or ').toLowerCase()} 🍫` : 'No treats needed, so more room for real meals.'));
      out.push(`<div class="b-widget"><button class="btn wide" data-next>Start my plan</button></div>`);
      return;
    }
    out.push(ask[s]());
    if (!current) return out.push(answer[s]());
    const widget = s === 'welcome' ? ''
      : s === 'body' ? `<div class="b-form">${bodyFields()}</div>`
      : s === 'activity' ? options('activity', ACTIVITY)
      : options('goal', GOALS);
    out.push(`<div class="b-widget">${widget}<button class="btn wide" data-next>${s === 'welcome' ? 'Let’s do it' : 'Send'}</button></div>`);
  });
  return `<div class="b-chat">${out.join('')}</div>`;
}

// ---------- Design C: Story (bold full-screen, Wrapped-style report) ----------
function designC() {
  const s = STEPS[state.step];
  const shell = (bg, body, cta = 'Next') => `<div class="c-screen" style="--bg:${bg}">
    <div class="c-body">${body}</div>${cta ? `<div class="a-foot"><button class="btn wide light" data-next>${cta}</button></div>` : ''}</div>`;
  const slider = (key, label, show, min, max) => `<label class="c-slider"><span>${label}</span><b class="num">${show(state[key])}</b>
    <input type="range" data-range="${key}" min="${min}" max="${max}" value="${state[key]}"></label>`;
  if (s === 'welcome') return shell('var(--accent)', '<div class="c-kicker">Wellness AI</div><h2 class="c-huge">We make it easy to change your body.</h2>', 'Let’s go');
  if (s === 'body') return shell('#22303f', `<h2 class="c-big">About you</h2>${seg('sex', [['male', 'Male'], ['female', 'Female']])}
    ${slider('height', 'Height', fmtHeight, 48, 90)}${slider('weight', 'Weight', (v) => `${v} lb`, 80, 450)}${slider('age', 'Age', (v) => v, 13, 99)}`);
  if (s === 'activity') return shell('#3b2a4a', `<h2 class="c-big">How much do you move?</h2>${options('activity', ACTIVITY)}`);
  if (s === 'goal') return shell('#4a2a2a', `<h2 class="c-big">What do you want to change?</h2>${options('goal', GOALS)}`);
  if (CATS[s]) return shell('#141414', `<div class="c-kicker"><span class="dot" style="background:${CATS[s].color}"></span>${CATS[s].label}</div><h2 class="c-big">${CATS[s].ask}</h2>${deck(s, 'sw-full')}`, null);
  // Report as tap-through story slides.
  const p = profile();
  const slides = [
    ['var(--accent)', `<div class="c-kicker">Your daily target</div><div class="c-huge num">${p.kcal.toLocaleString()}</div><div class="c-sub">calories a day to ${pick(GOALS, state.goal).t.toLowerCase()}</div>`],
    ['#22303f', `<div class="c-kicker">Your macros</div><h2 class="c-big num">${p.protein}g protein</h2><div class="c-macros">${macroSplit(p)}</div>`],
    ['#3b2a4a', `<div class="c-kicker">You are</div>${p.tags.map((t) => `<h2 class="c-big" style="margin:4px 0">${t}</h2>`).join('')}<div class="c-sub">Based on ${Object.keys(state.swipes).length} swipes</div>`],
    ['#2a3a2a', `<div class="c-kicker">You’ll be eating</div>${p.meals.map((m) => `<div class="c-meal">🍽️ ${m}</div>`).join('') || '<div class="c-sub">Swipe more foods for ideas</div>'}`],
    ['#4a2a2a', `<div class="c-kicker">Treat budget</div><div class="c-huge num">${p.treatKcal}</div><div class="c-sub">${p.treatKcal ? `kcal a day for ${p.lt.slice(0, 2).join(' or ').toLowerCase()}` : 'kcal. More room for meals'}</div>`],
  ];
  const i = Math.min(state.slide, slides.length - 1);
  const last = i === slides.length - 1;
  return `<div class="c-screen story" style="--bg:${slides[i][0]}">
    <div class="story-bars">${slides.map((_, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="c-body" data-story>${slides[i][1]}</div>
    <div class="a-foot">${last ? '<button class="btn wide light" data-next>Start my plan</button>' : '<p class="c-sub" style="text-align:center">Tap to continue</p>'}</div>
  </div>`;
}

// ---------- Render ----------
const designs = { a: designA, b: designB, c: designC };
function render() {
  document.body.dataset.design = design;
  ob.innerHTML = designs[design]();
  document.querySelectorAll('[data-design]').forEach((b) => b.setAttribute('aria-selected', b.dataset.design === design));
  document.getElementById('progress').innerHTML = STEPS.map((_, i) => `<i class="${i <= state.step ? 'on' : ''}"></i>`).join('');
  document.getElementById('back').style.visibility = state.step ? 'visible' : 'hidden';
  bindDeck();
  if (design === 'b') scrollTo({ top: document.body.scrollHeight });
  else scrollTo({ top: 0 });
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-next],[data-design],[data-set],[data-inc],[data-swipe],[data-auto],[data-story],#back');
  if (!el) return;
  const d = el.dataset;
  if (el.id === 'back') {
    if (design === 'c' && STEPS[state.step] === 'report' && state.slide) { state.slide--; return render(); }
    return go(state.step - 1);
  }
  if ('next' in d) return STEPS[state.step] === 'report' ? (location.href = 'index.html') : next();
  if ('design' in d) {
    design = d.design;
    try { localStorage.setItem('obDesign', design); } catch {}
    return render();
  }
  if ('set' in d) { state[d.set] = d.val; return render(); }
  if ('inc' in d) { state[d.inc] = Math.max(+d.min, Math.min(+d.max, state[d.inc] + +d.by)); return render(); }
  if ('swipe' in d) { const c = ob.querySelector('.sw-card.is-top'); return c && fly(c, d.swipe === '1'); }
  if ('auto' in d) return autoSwipe(d.auto);
  if ('story' in d) { state.slide = Math.min(state.slide + 1, 4); return render(); }
});
document.addEventListener('input', (e) => {
  const k = e.target.dataset.range;
  if (!k) return;
  state[k] = +e.target.value;
  e.target.previousElementSibling.textContent = { height: fmtHeight, weight: (v) => `${v} lb`, age: (v) => v }[k](state[k]);
});

render();
