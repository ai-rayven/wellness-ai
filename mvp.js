// MVP walkthrough: the flows in docs/mvp.md with mock Auth, Edamam search and Firestore.
// Stored data uses the documented shapes (users, foods, logEntries, weights) and persists in localStorage.

// ---------- Mock Edamam: name, brand, kcal / protein / carbs / fat per 100 g ----------
const EDAMAM = [
  ['Banana', '', 89, 1.1, 22.8, 0.3],
  ['Apple', '', 52, 0.3, 13.8, 0.2],
  ['Blueberries', '', 57, 0.7, 14.5, 0.3],
  ['Rolled oats', '', 379, 13.2, 67.7, 6.5],
  ['Rolled oats', 'Quaker', 375, 12.5, 68.8, 6.3],
  ['Egg, whole, raw', '', 143, 12.6, 0.7, 9.5],
  ['Chicken breast, cooked', '', 165, 31, 0, 3.6],
  ['Salmon, Atlantic, cooked', '', 206, 22.1, 0, 12.4],
  ['White rice, cooked', '', 130, 2.7, 28.2, 0.3],
  ['Brown rice, cooked', '', 123, 2.7, 25.6, 1],
  ['Greek yogurt, plain, nonfat', '', 59, 10.2, 3.6, 0.4],
  ['Greek yogurt, plain', 'Fage Total 0%', 54, 10.3, 3.8, 0],
  ['Peanut butter', '', 588, 25.1, 20, 50.4],
  ['Whole wheat bread', '', 252, 12.4, 42.7, 3.5],
  ['Broccoli, cooked', '', 35, 2.4, 7.2, 0.4],
  ['Avocado', '', 160, 2, 8.5, 14.7],
  ['Olive oil', '', 884, 0, 0, 100],
  ['Almonds', '', 579, 21.2, 21.6, 49.9],
  ['Whole milk', '', 61, 3.2, 4.8, 3.3],
  ['Protein bar, chocolate', 'Quest', 353, 35.3, 41.2, 13.7],
].map(([name, brand, kcal, proteinG, carbsG, fatG]) => {
  const lookupId = 'food_' + (name + ' ' + brand).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24);
  return {
    id: 'edamam_' + lookupId, name, brand,
    nutrientsPer100g: { kcal, proteinG, carbsG, fatG },
    metadata: { source: 'edamam', lookupId },
  };
});

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const MACROS = [
  { key: 'proteinG', label: 'Protein', color: 'var(--protein)' },
  { key: 'carbsG', label: 'Carbs', color: 'var(--carbs)' },
  { key: 'fatG', label: 'Fat', color: 'var(--fat)' },
];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const r1 = (n) => Math.round(n * 10) / 10;

// ---------- Dates (local YYYY-MM-DD, as stored) ----------
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const TODAY = iso(new Date());
const fmtDay = (s) => (s === TODAY ? 'Today' : s === addDays(TODAY, -1) ? 'Yesterday'
  : parse(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
const ageFrom = (birth) => {
  if (!birth) return null;
  const b = parse(birth), t = new Date();
  return t.getFullYear() - b.getFullYear() - (t < new Date(t.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
};

// ---------- Mock Firestore ----------
const KEY = 'sano-mvp-2'; // bumped when the stored shape changes
const empty = () => ({ signedIn: false, user: null, foods: {}, logEntries: [], weights: {} });
let db;
try { db = JSON.parse(localStorage.getItem(KEY)) || empty(); } catch { db = empty(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
const now = () => new Date().toISOString();

const nutrientsFor = (food, grams) => {
  const f = grams / 100, n = food.nutrientsPer100g;
  return { kcal: Math.round(n.kcal * f), proteinG: r1(n.proteinG * f), carbsG: r1(n.carbsG * f), fatG: r1(n.fatG * f) };
};
const sum = (entries) => entries.reduce((t, e) => ({
  kcal: t.kcal + e.nutrients.kcal, proteinG: r1(t.proteinG + e.nutrients.proteinG),
  carbsG: r1(t.carbsG + e.nutrients.carbsG), fatG: r1(t.fatG + e.nutrients.fatG),
}), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });

// searchFoods Cloud Function: query Edamam, save results to the global foods collection, return them.
function searchFoods(q) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = EDAMAM.filter((f) => words.every((w) => (f.name + ' ' + f.brand).toLowerCase().includes(w)));
  hits.forEach((f) => { db.foods[f.id] ||= { ...f, createdAt: now() }; });
  save();
  return new Promise((res) => setTimeout(() => res(hits), 350));
}

function addEntry(food, meal, grams, date) {
  db.logEntries.push({
    id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date, meal, foodId: food.id,
    food: { name: food.name, brand: food.brand, nutrientsPer100g: food.nutrientsPer100g }, // snapshot
    grams, nutrients: nutrientsFor(food, grams), createdAt: now(),
  });
  save();
}

// Demo history on first sign-in so trends and recent foods have something to show.
function seed() {
  for (let i = 45; i >= 1; i--) {
    const w = 183 + i * 0.1 + Math.sin(i * 1.7) * 0.8;
    if (i % 4 !== 2) db.weights[addDays(TODAY, -i)] = { weightLb: r1(w), createdAt: now() };
  }
  const y = addDays(TODAY, -1);
  [['Rolled oats', 'breakfast', 60], ['Blueberries', 'breakfast', 80], ['Chicken breast, cooked', 'lunch', 150],
    ['White rice, cooked', 'lunch', 200], ['Salmon, Atlantic, cooked', 'dinner', 140], ['Broccoli, cooked', 'dinner', 120],
    ['Greek yogurt, plain, nonfat', 'snack', 170]].forEach(([name, meal, g]) => {
    const f = EDAMAM.find((x) => x.name === name && !x.brand);
    db.foods[f.id] ||= { ...f, createdAt: now() };
    addEntry(f, meal, g, y);
  });
}

// ---------- UI state ----------
const ui = { tab: 'today', day: TODAY, sheet: null, range: 30, weightDate: TODAY, showData: false };
const el = document.getElementById('mvp');
const layer = document.getElementById('sheet');

// ---------- Screens ----------
function signIn() {
  return `<section class="signin">
    <div class="signin-mark">${mark({ size: 72 })}</div>
    <h1 class="wordmark">${BRAND.name}</h1>
    <p class="muted">Log what you eat and your weight.</p>
    <button class="sso apple" data-act="signin" data-p="Apple">Continue with Apple</button>
    <button class="sso google" data-act="signin" data-p="Google">Continue with Google</button>
    <p class="muted small">Mock sign-in: no account is created.</p>
  </section>`;
}

function profileFields(u) {
  const t = u.targets;
  const age = ageFrom(u.birthDate);
  return `<div class="field"><label>Sex</label>
      <div class="seg">${['male', 'female'].map((s) => `<button data-act="sex" data-v="${s}" class="${u.sex === s ? 'on' : ''}">${cap(s)}</button>`).join('')}</div></div>
    <div class="field"><label for="birth">Birth date</label>
      <div class="row"><input id="birth" type="date" max="${TODAY}" value="${u.birthDate || ''}" data-in="birth"><span class="muted small" id="age">${age != null ? `Age ${age}` : ''}</span></div></div>
    <div class="field"><label>Daily targets</label>
      <div class="grid2">
        ${[['kcal', 'Calories', 'kcal'], ['proteinG', 'Protein', 'g'], ['carbsG', 'Carbs', 'g'], ['fatG', 'Fat', 'g']].map(([k, l, unit]) =>
          `<label class="num-in"><span>${l}</span><input type="number" inputmode="numeric" min="0" value="${t[k]}" data-in="target" data-k="${k}"><i>${unit}</i></label>`).join('')}
      </div></div>`;
}

let draft = null; // profile edits before Save
function setup() {
  draft ||= structuredClone(db.user);
  return `<section class="card"><h1>Set up your profile</h1>
    <p class="muted">Used for your daily targets. You can change these later.</p>
    ${profileFields(draft)}
    <button class="btn wide" data-act="save-profile" ${draft.sex && draft.birthDate ? '' : 'disabled'}>Continue</button>
  </section>`;
}

function today() {
  const entries = db.logEntries.filter((e) => e.date === ui.day);
  const tot = sum(entries), t = db.user.targets;
  const left = t.kcal - tot.kcal;
  return `<div class="day-nav">
      <button class="icon-btn" data-act="day" data-d="-1" aria-label="Previous day"><i data-lucide="chevron-left"></i></button>
      <b>${fmtDay(ui.day)}</b>
      <button class="icon-btn" data-act="day" data-d="1" aria-label="Next day" ${ui.day >= TODAY ? 'disabled' : ''}><i data-lucide="chevron-right"></i></button>
    </div>
    <section class="card">
      <div class="card-h"><h2>Calories</h2><span class="sub num">${left >= 0 ? `${left.toLocaleString()} left` : `${(-left).toLocaleString()} over`}</span></div>
      <div class="big num">${tot.kcal.toLocaleString()}<span class="muted" style="font-size:16px;font-weight:600"> / ${t.kcal.toLocaleString()} kcal</span></div>
      ${MACROS.map((m) => `<div class="macro"><div class="macro-top"><span><span class="dot" style="background:${m.color}"></span>${m.label}</span>
        <span class="num"><b>${Math.round(tot[m.key])}</b> / ${t[m.key]} g</span></div>
        <div class="track"><div class="fill" style="width:${Math.min(100, (tot[m.key] / t[m.key]) * 100 || 0)}%;background:${m.color}"></div></div></div>`).join('')}
    </section>
    ${MEALS.map((meal) => {
      const es = entries.filter((e) => e.meal === meal);
      return `<section class="card">
        <div class="card-h"><h2>${cap(meal)}</h2><span class="sub num">${es.length ? sum(es).kcal + ' kcal' : ''}</span></div>
        ${es.map((e) => `<button class="entry" data-act="edit" data-id="${e.id}">
          <span class="t"><b>${e.food.name}</b><span class="muted small num">${e.grams} g</span></span>
          <span class="num">${e.nutrients.kcal} kcal</span></button>`).join('')}
        <button class="add" data-act="add" data-meal="${meal}"><i data-lucide="plus"></i> Add food</button>
      </section>`;
    }).join('')}`;
}

function weightChart(points) {
  if (points.length < 2) return `<p class="muted">Log at least two days to see a trend.</p>`;
  const W = 320, H = 150, padL = 4, padR = 36, padT = 10, padB = 20;
  const start = parse(addDays(TODAY, -ui.range + 1)).getTime(), span = parse(TODAY).getTime() - start;
  const vals = points.map((p) => p.weightLb);
  const lo = Math.floor(Math.min(...vals)) - 1, hi = Math.ceil(Math.max(...vals)) + 1;
  const x = (d) => padL + ((parse(d).getTime() - start) / span) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight, last ${ui.range} days">
    ${ticks.map((v) => `<line x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/>
      <text x="${W - padR + 6}" y="${y(v) + 4}" font-size="10" fill="var(--text-2)">${v}</text>`).join('')}
    <text x="${padL}" y="${H - 4}" font-size="10" fill="var(--text-2)">${ui.range} days ago</text>
    <text x="${W - padR}" y="${H - 4}" font-size="10" fill="var(--text-2)" text-anchor="end">Today</text>
    <path d="${points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.weightLb).toFixed(1)}`).join('')}" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linejoin="round"/>
    ${points.map((p) => `<circle cx="${x(p.date)}" cy="${y(p.weightLb)}" r="3" fill="var(--brand)"/>`).join('')}
  </svg>`;
}

function weight() {
  const all = Object.entries(db.weights).map(([date, w]) => ({ date, ...w })).sort((a, b) => (a.date < b.date ? 1 : -1));
  const from = addDays(TODAY, -ui.range + 1);
  const inRange = all.filter((p) => p.date >= from).reverse();
  const existing = db.weights[ui.weightDate];
  return `<section class="card">
      <div class="card-h"><h2>Log weight</h2></div>
      <div class="grid2">
        <label class="num-in"><span>Date</span><input type="date" max="${TODAY}" value="${ui.weightDate}" data-in="wdate"></label>
        <label class="num-in"><span>Weight</span><input id="wval" type="number" inputmode="decimal" step="0.1" min="0" value="${existing ? existing.weightLb : ''}" placeholder="0.0"><i>lb</i></label>
      </div>
      <p class="muted small">${existing ? `Replaces ${existing.weightLb} lb already logged for ${fmtDay(ui.weightDate)}.` : 'One entry per day.'}</p>
      <button class="btn wide" data-act="save-weight">Save</button>
    </section>
    <section class="card">
      <div class="card-h"><h2>Trend</h2>
        <div class="seg small-seg">${[30, 90].map((n) => `<button data-act="range" data-v="${n}" class="${ui.range === n ? 'on' : ''}">${n}d</button>`).join('')}</div></div>
      ${weightChart(inRange)}
    </section>
    <section class="card">
      <div class="card-h"><h2>Entries</h2><span class="sub">${all.length}</span></div>
      ${all.length ? all.map((p, i) => {
        const prev = all[i + 1], d = prev ? r1(p.weightLb - prev.weightLb) : null;
        return `<div class="entry"><span class="t"><b>${fmtDay(p.date)}</b>${d != null ? `<span class="muted small num">${d > 0 ? '+' : ''}${d} lb</span>` : ''}</span>
          <span class="num">${p.weightLb} lb</span>
          <button class="chip" data-act="wedit" data-d="${p.date}" aria-label="Edit"><i data-lucide="pencil"></i></button>
          <button class="chip" data-act="wdel" data-d="${p.date}" aria-label="Delete"><i data-lucide="trash-2"></i></button></div>`;
      }).join('') : '<p class="muted">No entries yet.</p>'}
    </section>`;
}

function profile() {
  draft ||= structuredClone(db.user);
  const dirty = JSON.stringify(draft) !== JSON.stringify(db.user);
  return `<section class="card">
      <div class="card-h"><h2>Account</h2><span class="sub">${db.user.provider}</span></div>
      <div class="row"><div class="avatar">${db.user.displayName[0]}</div>
        <div style="flex:1"><b>${db.user.displayName}</b><div class="muted small">${db.user.email}</div></div>
        <button class="btn ghost" data-act="signout">Sign out</button></div>
    </section>
    <section class="card"><div class="card-h"><h2>Profile</h2></div>
      ${profileFields(draft)}
      <button class="btn wide" data-act="save-profile" ${dirty && draft.sex && draft.birthDate ? '' : 'disabled'}>Save</button>
    </section>
    <section class="card"><div class="card-h"><h2>Walkthrough</h2><span class="sub">not in app</span></div>
      <div class="row"><button class="btn ghost" data-act="data">${ui.showData ? 'Hide' : 'View'} stored data</button>
        <button class="btn ghost" data-act="reset">Reset demo</button></div>
      ${ui.showData ? `<pre class="data">${JSON.stringify(stored(), null, 2)}</pre>` : ''}
    </section>`;
}

// Firestore paths as documented, for checking the data model.
function stored() {
  const uid = db.user.id, out = {};
  out[`users/${uid}`] = (({ provider, ...u }) => u)(db.user);
  db.logEntries.forEach(({ id, ...e }) => { out[`users/${uid}/logEntries/${id}`] = e; });
  Object.entries(db.weights).sort().forEach(([d, w]) => { out[`users/${uid}/weights/${d}`] = w; });
  Object.values(db.foods).forEach(({ id, ...f }) => { out[`foods/${id}`] = f; });
  return out;
}

// ---------- Sheets: search + food detail ----------
function recentFoods() {
  const seen = new Set();
  return [...db.logEntries].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .filter((e) => !seen.has(e.foodId) && seen.add(e.foodId)).slice(0, 6).map((e) => db.foods[e.foodId]);
}
const foodRow = (f) => `<button class="entry" data-act="pick" data-id="${f.id}">
  <span class="t"><b>${f.name}</b><span class="muted small">${f.brand ? f.brand + ' · ' : ''}${f.nutrientsPer100g.kcal} kcal per 100 g</span></span><span class="muted"><i data-lucide="chevron-right"></i></span></button>`;

function results() {
  const s = ui.sheet;
  if (!s.q.trim()) {
    const rec = recentFoods();
    return rec.length ? `<div class="label">Recent</div><div class="card">${rec.map(foodRow).join('')}</div>`
      : `<p class="muted">Search for a food by name.</p>`;
  }
  if (s.loading) return `<p class="muted">Searching Edamam…</p>`;
  if (!s.results.length) return `<p class="muted">No results for “${s.q.replace(/</g, '&lt;')}”. Custom foods aren't in the MVP.</p>`;
  return `<div class="label">Results from Edamam</div><div class="card">${s.results.map(foodRow).join('')}</div>`;
}

function computed() {
  const s = ui.sheet, g = +s.grams;
  if (!(g > 0)) return `<p class="muted">Enter an amount in grams.</p>`;
  const n = nutrientsFor(s.food, g);
  return `<div class="grid2">
    <div class="tile"><div class="k">Calories</div><div class="v num">${n.kcal}</div></div>
    ${MACROS.map((m) => `<div class="tile"><div class="k"><span class="dot" style="background:${m.color}"></span>${m.label}</div><div class="v num">${n[m.key]}g</div></div>`).join('')}
  </div>`;
}

function sheet() {
  const s = ui.sheet;
  if (s.type === 'search') {
    return `<div class="c-full"><div class="c-head"><button class="icon-btn" data-act="close" aria-label="Close"><i data-lucide="x"></i></button><b>Add to ${cap(s.meal)}</b></div>
      <div style="padding:0 16px"><div class="ask"><input id="q" type="search" placeholder="Search foods, e.g. banana" value="${s.q.replace(/"/g, '&quot;')}" data-in="q" autocomplete="off"></div></div>
      <div class="c-scroll" id="results">${results()}</div></div>`;
  }
  const f = s.food, n = f.nutrientsPer100g, editing = !!s.entryId;
  return `<div class="c-full"><div class="c-head">
      <button class="icon-btn" data-act="${editing ? 'close' : 'back'}" aria-label="Back">${editing ? '<i data-lucide="x"></i>' : '<i data-lucide="chevron-left"></i>'}</button><b>${editing ? 'Edit entry' : 'Add food'}</b></div>
    <div class="c-scroll">
      <div><h2 style="margin:0">${f.name}</h2><div class="muted small">${f.brand ? f.brand + ' · ' : ''}per 100 g: ${n.kcal} kcal · P ${n.proteinG} · C ${n.carbsG} · F ${n.fatG}</div></div>
      <label class="num-in big-in"><span>Amount</span><input id="grams" type="number" inputmode="decimal" min="0" value="${s.grams}" data-in="grams"><i>g</i></label>
      <div class="field"><label>Meal</label><div class="seg">${MEALS.map((m) => `<button data-act="meal" data-v="${m}" class="${s.meal === m ? 'on' : ''}">${cap(m)}</button>`).join('')}</div></div>
      <div id="computed">${computed()}</div>
      <button class="btn wide" data-act="${editing ? 'update' : 'log'}">${editing ? 'Save changes' : `Log to ${fmtDay(ui.day)}`}</button>
      ${editing ? '<button class="btn ghost wide" data-act="delete">Delete entry</button>' : ''}
    </div></div>`;
}

// ---------- Render ----------
function render() {
  const signedIn = db.signedIn && db.user;
  const needsSetup = signedIn && !(db.user.sex && db.user.birthDate);
  document.body.classList.toggle('no-tabs', !signedIn || needsSetup);
  document.getElementById('tabs').hidden = !signedIn || needsSetup;
  el.innerHTML = !signedIn ? signIn() : needsSetup ? setup() : ui.tab === 'today' ? today() : ui.tab === 'weight' ? weight() : profile();
  document.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.v === ui.tab));
  layer.hidden = !ui.sheet;
  document.body.classList.toggle('coach-open', !!ui.sheet);
  layer.innerHTML = ui.sheet ? sheet() : '';
  window.lucide?.createIcons();
}
// After the next render.
const focus = (id) => setTimeout(() => { const i = document.getElementById(id); if (i) { i.focus(); i.select?.(); } });

const actions = {
  signin(b) {
    db.signedIn = true;
    if (!db.user) {
      db.user = { id: 'demo-uid', provider: b.dataset.p, displayName: 'Demo User', email: 'you@example.com', sex: null, birthDate: null,
        targets: { kcal: 2200, proteinG: 150, carbsG: 220, fatG: 70 }, createdAt: now() };
      seed();
    }
    draft = null; save();
  },
  signout() { db.signedIn = false; ui.tab = 'today'; ui.day = TODAY; draft = null; save(); },
  reset() { if (confirm('Clear all demo data?')) { db = empty(); draft = null; ui.showData = false; save(); } },
  data() { ui.showData = !ui.showData; },
  tab(b) { ui.tab = b.dataset.v; draft = null; scrollTo(0, 0); },
  sex(b) { draft.sex = b.dataset.v; },
  'save-profile'() { db.user = { ...db.user, ...draft }; draft = null; save(); },
  day(b) { ui.day = addDays(ui.day, +b.dataset.d); },
  add(b) { ui.sheet = { type: 'search', meal: b.dataset.meal, q: '', results: [], loading: false }; focus('q'); },
  pick(b) { const s = ui.sheet; ui.sheet = { type: 'food', food: db.foods[b.dataset.id], grams: 100, meal: s.meal, from: s }; focus('grams'); },
  back() { ui.sheet = ui.sheet.from; },
  close() { ui.sheet = null; },
  meal(b) { ui.sheet.meal = b.dataset.v; },
  log() {
    const s = ui.sheet;
    if (!(+s.grams > 0)) return focus('grams');
    addEntry(s.food, s.meal, +s.grams, ui.day); ui.sheet = null;
  },
  edit(b) {
    const e = db.logEntries.find((x) => x.id === b.dataset.id);
    // Edits use the entry's snapshot, so later changes to foods/{id} never alter it.
    ui.sheet = { type: 'food', food: { id: e.foodId, ...e.food }, grams: e.grams, meal: e.meal, entryId: e.id };
  },
  update() {
    const s = ui.sheet, e = db.logEntries.find((x) => x.id === s.entryId);
    if (!(+s.grams > 0)) return focus('grams');
    Object.assign(e, { grams: +s.grams, meal: s.meal, nutrients: nutrientsFor(s.food, +s.grams) });
    ui.sheet = null; save();
  },
  delete() { db.logEntries = db.logEntries.filter((x) => x.id !== ui.sheet.entryId); ui.sheet = null; save(); },
  range(b) { ui.range = +b.dataset.v; },
  'save-weight'() {
    const v = +document.getElementById('wval').value;
    if (!(v > 0)) return focus('wval');
    db.weights[ui.weightDate] = { weightLb: r1(v), createdAt: now() }; save();
  },
  wedit(b) { ui.weightDate = b.dataset.d; scrollTo(0, 0); focus('wval'); },
  wdel(b) { delete db.weights[b.dataset.d]; save(); },
};

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  e.preventDefault();
  actions[b.dataset.act](b);
  render();
});

// Inputs update state without a full re-render so focus stays put.
const showResults = () => { document.getElementById('results').innerHTML = results(); window.lucide?.createIcons(); };
let searchTimer;
document.addEventListener('input', (e) => {
  const t = e.target, k = t.dataset.in;
  if (k === 'q') {
    const s = ui.sheet; s.q = t.value; s.loading = !!s.q.trim();
    showResults();
    clearTimeout(searchTimer);
    if (s.loading) searchTimer = setTimeout(async () => {
      const q = s.q, hits = await searchFoods(q);
      if (ui.sheet === s && s.q === q) { s.results = hits; s.loading = false; showResults(); }
    }, 250);
  } else if (k === 'grams') {
    ui.sheet.grams = t.value;
    document.getElementById('computed').innerHTML = computed();
  } else if (k === 'birth') {
    draft.birthDate = t.value || null;
    const a = ageFrom(draft.birthDate);
    document.getElementById('age').textContent = a != null ? `Age ${a}` : '';
    syncSave();
  } else if (k === 'target') {
    draft.targets[t.dataset.k] = Math.max(0, Math.round(+t.value || 0));
    syncSave();
  } else if (k === 'wdate' && t.value) {
    ui.weightDate = t.value > TODAY ? TODAY : t.value; render();
  }
});
function syncSave() {
  const b = document.querySelector('[data-act="save-profile"]');
  const dirty = !db.user.sex || JSON.stringify(draft) !== JSON.stringify(db.user);
  if (b) b.disabled = !(dirty && draft.sex && draft.birthDate);
}

render();
