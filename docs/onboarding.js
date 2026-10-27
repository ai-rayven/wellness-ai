// Sano onboarding mockup (Story design): body stats, swipe broad food groups, free-form "tell us anything",
// then a tap-through story report that ends on an AI breakdown page. Forms are prefilled for quick click-through.

// ---------- Data ----------
const STEPS = ['welcome', 'body', 'activity', 'goal', 'protein', 'carbs', 'fats', 'treats', 'ramble', 'report'];

const CATS = {
  protein: { label: 'Proteins', color: 'var(--protein)', ask: 'Which proteins would you happily eat?' },
  carbs: { label: 'Carbs', color: 'var(--carbs)', ask: 'Now carbs. What fuels you?' },
  fats: { label: 'Fats', color: 'var(--fat)', ask: 'Fats you enjoy?' },
  treats: { label: 'Treats', color: 'var(--treat)', ask: 'Be honest: which treats do you love?' },
};

// Broad groups, not specific foods: [emoji, name, examples, word used when naming meals]
const FOODS = {
  protein: [['🍗', 'Poultry', 'Chicken, turkey', 'Chicken'], ['🥩', 'Red meat', 'Beef, lamb', 'Steak'], ['🥓', 'Pork', 'Pork chops, ham', 'Pork'],
    ['🐟', 'Fish', 'Salmon, tuna, cod', 'Salmon'], ['🦐', 'Shellfish', 'Shrimp, crab, mussels', 'Shrimp'], ['🥚', 'Eggs', 'Any style', 'Eggs'],
    ['🥛', 'Dairy', 'Yogurt, cottage cheese, milk', 'Greek yogurt'], ['🥡', 'Tofu & soy', 'Tofu, tempeh, edamame', 'Tofu'], ['🫘', 'Beans & lentils', 'Black beans, chickpeas', 'Lentils']],
  carbs: [['🍚', 'Rice', 'White, brown, jasmine', 'rice'], ['🍝', 'Pasta & noodles', 'Spaghetti, ramen', 'noodles'], ['🍞', 'Bread', 'Toast, wraps, tortillas', 'wraps'],
    ['🥔', 'Potatoes', 'Russet, sweet potato', 'potatoes'], ['🥣', 'Oats & cereal', 'Oatmeal, granola', 'oats'], ['🍎', 'Fruit', 'Berries, bananas, apples', 'fruit'],
    ['🌾', 'Whole grains', 'Quinoa, barley, farro', 'quinoa']],
  fats: [['🥑', 'Avocado', 'Guac, sliced', 'avocado'], ['🥜', 'Nuts & seeds', 'Almonds, chia, peanuts', 'nuts'], ['🫒', 'Oils', 'Olive, avocado oil', 'olive oil'],
    ['🧀', 'Cheese', 'Cheddar, feta, parmesan', 'cheese'], ['🧈', 'Butter & cream', 'Butter, sour cream', 'butter']],
  treats: [['🍦', 'Ice cream', 'Frozen desserts', 'ice cream'], ['🍫', 'Chocolate', 'Bars, candy', 'chocolate'], ['🍪', 'Baked goods', 'Cookies, pastries, cake', 'baked goods'],
    ['🍟', 'Salty snacks', 'Chips, fries, popcorn', 'salty snacks'], ['🥤', 'Sweet drinks', 'Soda, juice, coffee drinks', 'sweet drinks']],
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

const SAMPLE_RAMBLE = 'I’m lactose intolerant so milk wrecks me, but hard cheese is fine. I hate mushrooms and anything with cilantro. '
  + 'I work night shifts three days a week so my big meal is usually around midnight. I meal prep on Sundays and don’t want to cook more than 20 minutes on weekdays. '
  + 'I love spicy food, especially Korean and Mexican. Trying to cut back on soda, I drink like 2 cans a day. Groceries are around $80 a week.';

// Mock "AI" extraction: keyword rules over the free-form text. Each yields a note (what we heard) and a rule (what the coach will do).
const INSIGHTS = [
  { re: /lactose/i, icon: '🥛', tag: 'Intolerance', note: () => 'Lactose intolerant', rule: () => 'Lactose-free dairy only; hard cheese is OK' },
  { re: /\b(allerg\w*) to (\w+)/i, icon: '⚠️', tag: 'Allergy', note: (m) => `Allergic to ${m[2]}`, rule: (m) => `Never include ${m[2]}` },
  { re: /(hate|can’t stand|can't stand|don’t like|don't like) ([^.]+?)(?:\.|$)/i, icon: '🚫', tag: 'Dislikes',
    note: (m) => `Hates ${m[2].replace(/anything with /i, '')}`, rule: (m) => `Leave out ${m[2].replace(/anything with /i, '')}`,
    items: (m) => m[2].replace(/anything with /i, '').split(/,? and |, /).map(cap) },
  { re: /night shifts?/i, icon: '🌙', tag: 'Schedule', note: (_, t) => `Night shifts${/three|3/i.test(t) ? ' 3×/week' : ''}`, rule: () => 'Biggest meal late on shift days' },
  { re: /meal prep/i, icon: '🥡', tag: 'Cooking', note: (_, t) => `Meal preps${/sunday/i.test(t) ? ' on Sundays' : ''}`, rule: () => 'Batch-cook recipes that keep 4 days' },
  { re: /(\d+) minutes?/i, icon: '⏱️', tag: 'Time', note: (m) => `≤${m[1]} min on weekdays`, rule: (m) => `Weekday recipes under ${m[1]} minutes` },
  { re: /(korean|mexican|thai|indian|italian|japanese|chinese|mediterranean)/gi, icon: '🌶️', tag: 'Cuisines', all: true,
    note: (ms, t) => `${/spicy/i.test(t) ? 'Spicy · ' : ''}${ms.map((m) => cap(m[1])).join(', ')}`, rule: (ms) => `More ${ms.map((m) => cap(m[1])).join(' and ')} flavors` },
  { re: /soda/i, icon: '🥤', tag: 'Habit', note: (_, t) => `Soda${/(\d+) cans?/i.test(t) ? `, ${t.match(/(\d+) cans?/i)[1]} cans a day` : ''}`,
    rule: (_, t) => `Swap soda for zero-sugar options${/(\d+) cans?/i.test(t) ? ` (saves ~${t.match(/(\d+) cans?/i)[1] * 140} kcal/day)` : ''}` },
  { re: /\$(\d+)/, icon: '💵', tag: 'Budget', note: (m) => `$${m[1]} a week on groceries`, rule: (m) => `Grocery lists that stay under $${m[1]}/week` },
];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function insights(text) {
  return INSIGHTS.flatMap((r) => {
    if (r.all) {
      const ms = [...text.matchAll(r.re)];
      return ms.length ? [{ ...r, noteT: r.note(ms, text), ruleT: r.rule(ms, text), ms }] : [];
    }
    const m = text.match(r.re);
    return m ? [{ ...r, noteT: r.note(m, text), ruleT: r.rule(m, text), itemsT: r.items ? r.items(m) : [] }] : [];
  });
}

// Prefilled answers for quick clicking.
const state = {
  step: 0,
  sex: 'male', age: 32, height: 70, weight: 182, // height in inches, weight in lb
  activity: 'moderate', goal: 'lose',
  swipes: {}, // food name -> true (like) | false (nope)
  ramble: SAMPLE_RAMBLE,
  slide: 0, // report slide; the last index is the AI breakdown page
};

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
  const plant = lp.filter((n) => ['Tofu & soy', 'Beans & lentils'].includes(n)).length;
  const meat = lp.filter((n) => ['Poultry', 'Red meat', 'Pork'].includes(n)).length;
  const sea = lp.filter((n) => ['Fish', 'Shellfish'].includes(n)).length;
  const tags = [];
  tags.push(plant && !meat ? 'Plant-forward' : sea === 2 ? 'Seafood lover' : 'Omnivore');
  tags.push(lc.length >= 5 ? 'Carb-friendly' : lc.length <= 2 ? 'Low-carb leaning' : 'Balanced carbs');
  if (lt.length >= 3) tags.push('Sweet tooth');

  const found = insights(state.ramble);
  const lactose = found.some((i) => i.tag === 'Intolerance');
  const cuisines = (found.find((i) => i.tag === 'Cuisines') || { ms: [] }).ms.map((m) => cap(m[1]));
  const dish = (cat) => liked(cat).map((f) => f[3]);
  const dp = dish('protein').map((d) => (lactose && d === 'Greek yogurt' ? 'Lactose-free yogurt' : d)), dc = dish('carbs'), df = dish('fats');
  const meals = [];
  for (let i = 0; i < 3 && dp.length && dc.length; i++) {
    const style = cuisines.length ? `${cuisines[i % cuisines.length]}-style ` : '';
    const fat = df.length ? ` & ${df[i % df.length]}` : '';
    meals.push(`${style}${style ? dp[i % dp.length].toLowerCase() : dp[i % dp.length]}, ${dc[i % dc.length]}${fat}`.replace(/^./, (c) => c.toUpperCase()));
  }
  const treatKcal = lt.length ? 150 + 50 * Math.min(2, lt.length - 1) : 0;
  return { kcal, protein, carbs, fat, tdee: Math.round(tdee), tags, lp, lc, lf, lt, meals, treatKcal, found,
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

// ---------- Swipe deck ----------
function deck(cat) {
  const rest = remaining(cat);
  const total = FOODS[cat].length, done = total - rest.length;
  const cards = rest.slice(0, 3).reverse().map((f, i, arr) => {
    const top = i === arr.length - 1;
    const depth = arr.length - 1 - i;
    return `<div class="sw-card ${top ? 'is-top' : ''}" data-name="${f[1]}" style="--depth:${depth};--cat:${CATS[cat].color}">
      <div class="stamp like">LIKE</div><div class="stamp nope">NOPE</div>
      <div class="sw-emoji">${f[0]}</div>
      <div class="sw-info"><b>${f[1]}</b><span>${f[2]}</span></div>
    </div>`;
  }).join('');
  return `<div class="sw" data-cat="${cat}">
    <div class="sw-count num">${Math.min(done + 1, total)} / ${total}</div>
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

// ---------- Controls ----------
const seg = (key, opts) => `<div class="seg">${opts.map(([v, t]) =>
  `<button data-set="${key}" data-val="${v}" aria-pressed="${state[key] === v}">${t}</button>`).join('')}</div>`;

const options = (key, list) => `<div class="opts">${list.map((o) => `<button class="opt" data-set="${key}" data-val="${o.k}" aria-pressed="${state[key] === o.k}">
  <span class="opt-ic">${o.icon}</span><span class="opt-t"><b>${o.t}</b><span>${o.d}</span></span></button>`).join('')}</div>`;

const slider = (key, label, show, min, max) => `<label class="c-slider"><span>${label}</span><b class="num">${show(state[key])}</b>
  <input type="range" data-range="${key}" min="${min}" max="${max}" value="${state[key]}"></label>`;

const chips = (items) => items.length
  ? `<div class="chips wrap">${items.map((n) => `<span class="chip">${n}</span>`).join('')}</div>`
  : '<span class="c-dim">None</span>';

const macroSplit = (p) => {
  const parts = [['Protein', p.protein * 4, 'var(--protein)', p.protein], ['Carbs', p.carbs * 4, 'var(--carbs)', p.carbs], ['Fat', p.fat * 9, 'var(--fat)', p.fat]];
  return `<div class="stack" role="img" aria-label="Macro split">${parts.map(([, k, c]) => `<div style="width:${(k / p.kcal) * 100}%;background:${c}"></div>`).join('')}</div>
  <div class="grid3" style="margin-top:12px">${parts.map(([n, , c, g]) => `<div class="tile"><div class="k"><span class="dot" style="background:${c}"></span>${n}</div><div class="v num">${g}<span class="muted" style="font-size:13px;font-weight:500">g</span></div></div>`).join('')}</div>`;
};

// ---------- Screens ----------
const shell = (tint, body, cta = 'Next') => `<div class="c-screen" style="--tint:${tint}">
  <div class="c-body">${body}</div>${cta ? `<div class="a-foot"><button class="btn wide" data-next>${cta}</button></div>` : ''}</div>`;

function rambleScreen() {
  const found = insights(state.ramble);
  return shell('var(--tint-1)', `<div class="c-kicker">Last one</div>
    <h2 class="c-big">Tell us anything.</h2>
    <p class="c-sub" style="margin:-6px 0 14px">Allergies, foods you hate, your schedule, cravings, budget. Just ramble, we’ll sort it out.</p>
    <div class="ramble">
      <textarea id="ramble" rows="7" aria-label="Tell us about your eating">${state.ramble}</textarea>
      <button class="mic-btn ${listening ? 'on' : ''}" data-mic aria-label="Dictate">${listening ? '● Listening…' : '🎙️ Tap to talk'}</button>
    </div>
    <div class="heard" id="heard">${heard(found)}</div>`, 'See my results');
}
const heard = (found) => found.length
  ? `<div class="c-dim small">Picked up so far</div><div class="chips wrap">${found.map((i) => `<span class="chip">${i.icon} ${i.noteT}</span>`).join('')}</div>`
  : '<div class="c-dim small">We’ll pick out preferences as you type.</div>';

function report() {
  const p = profile();
  const slides = [
    ['var(--tint-1)', `<div class="c-kicker">Your daily target</div><div class="c-huge num">${p.kcal.toLocaleString()}</div><div class="c-sub">calories a day to ${pick(GOALS, state.goal).t.toLowerCase()}</div>`],
    ['var(--tint-2)', `<div class="c-kicker">Your macros</div><h2 class="c-big num">${p.protein}g protein</h2><div class="c-macros">${macroSplit(p)}</div>`],
    ['var(--tint-3)', `<div class="c-kicker">You are</div>${p.tags.map((t) => `<h2 class="c-big" style="margin:4px 0">${t}</h2>`).join('')}<div class="c-sub">Based on ${Object.keys(state.swipes).length} swipes</div>`],
    ['var(--tint-1)', `<div class="c-kicker">In your words</div>${p.found.length ? p.found.map((i) => `<div class="c-meal">${i.icon} ${i.noteT}</div>`).join('') : '<div class="c-sub">Nothing yet. Tell your coach anytime.</div>'}`],
    ['var(--tint-2)', `<div class="c-kicker">You’ll be eating</div>${p.meals.map((m) => `<div class="c-meal">🍽️ ${m}</div>`).join('') || '<div class="c-sub">Swipe more foods for ideas</div>'}`],
    ['var(--tint-1)', `<div class="c-kicker">Treat budget</div><div class="c-huge num">${p.treatKcal}</div><div class="c-sub">${p.treatKcal ? `kcal a day for ${p.lt.slice(0, 2).join(' or ').toLowerCase()}` : 'kcal. More room for meals'}</div>`],
  ];
  const i = Math.min(state.slide, slides.length);
  const bars = `<div class="story-bars">${[...slides, 0].map((_, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</div>`;
  if (i === slides.length) return breakdown(p, bars);
  return `<div class="c-screen story" style="--tint:${slides[i][0]}">
    ${bars}
    <div class="c-body" data-story>${slides[i][1]}</div>
    <div class="a-foot"><p class="c-sub" style="text-align:center">Tap to continue</p></div>
  </div>`;
}

// Final page: everything the AI learned, in one scrollable breakdown.
function breakdown(p, bars) {
  const goal = pick(GOALS, state.goal).t.toLowerCase();
  const schedule = p.found.find((x) => x.tag === 'Schedule'), time = p.found.find((x) => x.tag === 'Time');
  const loves = [...p.lp.slice(0, 2), ...p.lc.slice(0, 1)].map((n) => n.toLowerCase());
  const summary = `You burn about <b>${p.tdee.toLocaleString()} kcal</b> a day. To ${goal} I’ll keep you around <b>${p.kcal.toLocaleString()}</b> with <b>${p.protein}g protein</b>.`
    + (loves.length ? ` You like ${loves.join(', ')}, so most meals start there.` : '')
    + (schedule ? ' On night-shift days I’ll move your biggest meal later.' : '')
    + (time ? ` Weekday cooking stays under ${time.ruleT.match(/\d+/)[0]} minutes.` : '');
  const groups = Object.entries(CATS).map(([k, c]) => `<div class="bd-row"><span class="bd-k"><span class="dot" style="background:${c.color}"></span>${c.label}</span>${chips(liked(k).map((f) => f[1]))}</div>`).join('');
  return `<div class="c-screen breakdown" style="--tint:var(--tint-2)">
    ${bars}
    <div class="c-body">
      <div class="bd-who"><i class="av">${avMark()}</i><div><div class="c-kicker">Your AI breakdown</div><div class="c-dim small">Your coach uses this from day one</div></div></div>
      <p class="bd-summary">${summary}</p>

      <section class="bd-card"><h3>Daily targets</h3>
        <div class="c-macros">${macroSplit(p)}</div>
        ${p.treatKcal ? `<p class="c-dim small" style="margin:10px 0 0">Includes ~${p.treatKcal} kcal for treats</p>` : ''}
      </section>

      <section class="bd-card"><h3>Foods you like</h3>${groups}</section>

      <section class="bd-card"><h3>How I’ll plan for you</h3>
        ${p.found.length ? p.found.map((x) => `<div class="bd-rule"><span>${x.icon}</span><div><b>${x.ruleT}</b><span class="c-dim small">${x.tag} · “${x.noteT}”</span></div></div>`).join('')
          : '<p class="c-dim small">Tell me more anytime in chat and I’ll adapt.</p>'}
      </section>

      <section class="bd-card"><h3>Starter meals</h3>${p.meals.map((m) => `<div class="plan-row"><span>🍽️</span><span class="t">${m}</span></div>`).join('') || '<p class="c-dim small">Swipe more foods for ideas.</p>'}</section>

      <section class="bd-card"><h3>I’ll avoid</h3>${chips([...p.avoid, ...p.found.flatMap((x) => x.itemsT || [])])}</section>
    </div>
    <div class="a-foot"><button class="btn wide" data-next>Start my plan</button></div>
  </div>`;
}

function screen() {
  const s = STEPS[state.step];
  if (s === 'welcome') return `<div class="c-screen">
    <div class="c-body welcome">${mark({ size: 132 })}<div class="wordmark c-word">${BRAND.name}</div>${BRAND.tagline ? `<div class="tagline">${BRAND.tagline}</div>` : ''}
      <h2 class="c-big" style="margin-top:36px">We make it easy to change your body.</h2></div>
    <div class="a-foot"><button class="btn wide" data-next>Let’s go</button></div></div>`;
  if (s === 'body') return shell('var(--tint-2)', `<h2 class="c-big">About you</h2>${seg('sex', [['male', 'Male'], ['female', 'Female']])}
    ${slider('height', 'Height', fmtHeight, 48, 90)}${slider('weight', 'Weight', (v) => `${v} lb`, 80, 450)}${slider('age', 'Age', (v) => v, 13, 99)}`);
  if (s === 'activity') return shell('var(--tint-1)', `<h2 class="c-big">How much do you move?</h2>${options('activity', ACTIVITY)}`);
  if (s === 'goal') return shell('var(--tint-3)', `<h2 class="c-big">What do you want to change?</h2>${options('goal', GOALS)}`);
  if (CATS[s]) return shell('var(--tint-1)', `<div class="c-kicker"><span class="dot" style="background:${CATS[s].color}"></span>${CATS[s].label}</div><h2 class="c-big">${CATS[s].ask}</h2>${deck(s)}`, null);
  if (s === 'ramble') return rambleScreen();
  return report();
}

// ---------- Mock dictation: types the sample out as if spoken ----------
let listening = false;
function dictate() {
  if (listening) return;
  listening = true;
  state.ramble = '';
  render();
  const words = SAMPLE_RAMBLE.split(' ');
  let n = 0;
  const t = setInterval(() => {
    n += 2;
    state.ramble = words.slice(0, n).join(' ');
    const ta = document.getElementById('ramble');
    if (!ta) return clearInterval(t);
    ta.value = state.ramble;
    ta.scrollTop = ta.scrollHeight;
    document.getElementById('heard').innerHTML = heard(insights(state.ramble));
    if (n >= words.length) { clearInterval(t); listening = false; render(); }
  }, 90);
}

// ---------- Render ----------
function render() {
  const s = STEPS[state.step];
  ob.innerHTML = screen();
  document.getElementById('progress').innerHTML = STEPS.map((_, i) => `<i class="${i <= state.step ? 'on' : ''}"></i>`).join('');
  document.getElementById('back').style.visibility = state.step ? 'visible' : 'hidden';
  document.body.classList.toggle('on-report', s === 'report');
  bindDeck();
  scrollTo({ top: 0 });
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-next],[data-set],[data-swipe],[data-auto],[data-story],[data-mic],#back');
  if (!el) return;
  const d = el.dataset;
  if (el.id === 'back') {
    if (STEPS[state.step] === 'report' && state.slide) { state.slide--; return render(); }
    return go(state.step - 1);
  }
  if ('next' in d) return STEPS[state.step] === 'report' ? (location.href = 'index.html') : next();
  if ('set' in d) { state[d.set] = d.val; return render(); }
  if ('swipe' in d) { const c = ob.querySelector('.sw-card.is-top'); return c && fly(c, d.swipe === '1'); }
  if ('auto' in d) return autoSwipe(d.auto);
  if ('story' in d) { state.slide++; return render(); }
  if ('mic' in d) return dictate();
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'ramble') {
    state.ramble = e.target.value;
    document.getElementById('heard').innerHTML = heard(insights(state.ramble));
    return;
  }
  const k = e.target.dataset.range;
  if (!k) return;
  state[k] = +e.target.value;
  e.target.previousElementSibling.textContent = { height: fmtHeight, weight: (v) => `${v} lb`, age: (v) => v }[k](state[k]);
});

render();
