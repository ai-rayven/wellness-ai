// Mock data + the Coach dashboard. No build step: plain JS rendering into #app.

// ---------- Mock data ----------
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const today = new Date();
today.setHours(0, 0, 0, 0);
const dayMs = 86400000;
const fmtDay = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const targets = { kcal: 2200, protein: 180, carbs: 220, fat: 70 };
const eaten = { protein: 132, carbs: 168, fat: 51 };
eaten.kcal = eaten.protein * 4 + eaten.carbs * 4 + eaten.fat * 9;

const MACROS = [
  { key: 'protein', label: 'Protein', color: 'var(--protein)' },
  { key: 'carbs', label: 'Carbs', color: 'var(--carbs)' },
  { key: 'fat', label: 'Fat', color: 'var(--fat)' },
];

// 30 days of scale weight with noise, plus an exponentially smoothed trend.
const weights = [];
let trend = 184.6;
for (let i = 29; i >= 0; i--) {
  const date = new Date(today - i * dayMs);
  const scale = 184.6 - (29 - i) * 0.14 + (rand() - 0.5) * 2.2;
  trend = weights.length ? trend + 0.1 * (scale - trend) : scale;
  weights.push({ date, scale: scale.toFixed(1), trend: trend.toFixed(1) });
}
const latest = weights[weights.length - 1];
const weekChange = (latest.trend - weights[weights.length - 8].trend).toFixed(1);

// Habit history: meals logged per day (0–4) for ~20 weeks, ending today.
const WEEKS = 20;
const habit = [];
const start = new Date(today - (today.getDay() + (WEEKS - 1) * 7) * dayMs);
for (let d = new Date(start); d <= today; d = new Date(+d + dayMs)) {
  const age = (today - d) / dayMs;
  const p = age < 40 ? 0.92 : 0.65; // more consistent recently
  habit.push({ date: d, meals: age < 12 || rand() < p ? 1 + Math.floor(rand() * 4) : 0 });
}
habit[habit.length - 1].meals = 3;
let streak = 0;
for (let i = habit.length - 1; i >= 0 && habit[i].meals > 0; i--) streak++;

const meals = [
  { icon: '🥣', name: 'Greek yogurt & berry bowl', kcal: 410, p: 38, done: true },
  { icon: '🥗', name: 'Chicken shawarma salad', kcal: 620, p: 52, done: true },
  { icon: '🍌', name: 'Banana + whey shake', kcal: 330, p: 30, done: true },
  { icon: '🍣', name: 'Miso salmon rice bowl', kcal: 690, p: 46, done: false },
];

// ---------- Tooltip (hover on desktop, tap/scrub on mobile) ----------
const tip = document.getElementById('tip');
function showTip(html, x, y) {
  tip.innerHTML = html;
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, x - w / 2)) + 'px';
  tip.style.top = Math.max(8, y - h - 14) + 'px';
}
const hideTip = () => (tip.hidden = true);
addEventListener('scroll', hideTip, { passive: true });
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.chart')) hideTip(); });

// ---------- Components ----------
const pct = (a, b) => Math.min(100, Math.round((a / b) * 100));

function ring(value, max, size, stroke, color, inner = '') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const frac = Math.min(1, value / max);
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="width:${size}px" role="img" aria-label="${Math.round(frac * 100)}%">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--card-2)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c * frac} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    ${inner}
  </svg>`;
}

function weightChart(id, height = 150) {
  const W = 320, H = height, padL = 4, padR = 34, padT = 10, padB = 20;
  const vals = weights.flatMap((w) => [+w.scale, +w.trend]);
  const lo = Math.floor(Math.min(...vals)), hi = Math.ceil(Math.max(...vals));
  const x = (i) => padL + (i / (weights.length - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  const line = weights.map((w, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(w.trend).toFixed(1)}`).join('');
  return `<svg id="${id}" class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Scale weight and trend, last 30 days">
    ${ticks.map((t) => `<line x1="${padL}" x2="${W - padR}" y1="${y(t)}" y2="${y(t)}" stroke="var(--grid)"/>
      <text x="${W - padR + 6}" y="${y(t) + 4}" font-size="10" fill="var(--text-2)">${t}</text>`).join('')}
    <text x="${padL}" y="${H - 4}" font-size="10" fill="var(--text-2)">${fmtDay(weights[0].date)}</text>
    <text x="${W - padR}" y="${H - 4}" font-size="10" fill="var(--text-2)" text-anchor="end">Today</text>
    ${weights.map((w, i) => `<circle cx="${x(i)}" cy="${y(w.scale)}" data-ty="${y(w.trend)}" r="3" fill="var(--muted)" opacity=".55"/>`).join('')}
    <path d="${line}" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <line class="xh" x1="0" x2="0" y1="${padT}" y2="${H - padB}" stroke="var(--text-2)" stroke-dasharray="2 3" visibility="hidden"/>
    <circle class="xd" r="4.5" fill="var(--brand)" stroke="var(--card)" stroke-width="2" visibility="hidden"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/>
  </svg>
  <div class="legend">
    <span><span class="dot" style="background:var(--muted);opacity:.55"></span>Scale weight</span>
    <span><span class="dot" style="background:var(--brand)"></span>Trend</span>
  </div>`;
}

function bindWeightChart(id) {
  const svg = document.getElementById(id);
  if (!svg) return;
  const xh = svg.querySelector('.xh'), xd = svg.querySelector('.xd');
  const W = 320, padL = 4, padR = 34;
  const move = (e) => {
    const r = svg.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(weights.length - 1, Math.round(((vx - padL) / (W - padL - padR)) * (weights.length - 1))));
    const w = weights[i];
    const dots = svg.querySelectorAll('circle[r="3"]');
    const cx = +dots[i].getAttribute('cx');
    xh.setAttribute('x1', cx); xh.setAttribute('x2', cx); xh.setAttribute('visibility', 'visible');
    xd.setAttribute('cx', cx);
    xd.setAttribute('cy', dots[i].dataset.ty);
    xd.setAttribute('visibility', 'visible');
    showTip(`<b>${fmtDay(w.date)}</b> · ${w.scale} lb<br>Trend ${w.trend} lb`, r.left + (cx / W) * r.width, r.top + 10);
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') { hideTip(); xh.setAttribute('visibility', 'hidden'); xd.setAttribute('visibility', 'hidden'); }
  });
}

function heatmap(id, weeks = WEEKS) {
  const cell = 12, gap = 3, step = cell + gap, padL = 0, padT = 14;
  const days = habit.slice(-((weeks - 1) * 7 + today.getDay() + 1));
  const W = weeks * step - gap, H = padT + 7 * step - gap;
  let months = '', lastMonth = -1;
  const rects = days.map((h, i) => {
    const col = Math.floor(i / 7), row = h.date.getDay();
    if (row === 0 && h.date.getMonth() !== lastMonth && h.date.getDate() <= 7) {
      lastMonth = h.date.getMonth();
      months += `<text x="${col * step}" y="10" font-size="10" fill="var(--text-2)">${h.date.toLocaleDateString(undefined, { month: 'short' })}</text>`;
    }
    return `<rect data-i="${habit.length - days.length + i}" x="${padL + col * step}" y="${padT + row * step}" width="${cell}" height="${cell}" rx="3" fill="var(--heat-${h.meals})"/>`;
  }).join('');
  return `<svg id="${id}" class="chart heat" viewBox="0 0 ${W} ${H}" role="img" aria-label="Days with meals logged, last ${weeks} weeks">${months}${rects}</svg>
  <div class="heat-legend">Less ${[0, 1, 2, 3, 4].map((l) => `<i style="background:var(--heat-${l})"></i>`).join('')} More</div>`;
}

function bindHeatmap(id) {
  const svg = document.getElementById(id);
  if (!svg) return;
  const on = (e) => {
    const el = e.target.closest('rect');
    if (!el) return;
    const h = habit[+el.dataset.i];
    const r = el.getBoundingClientRect();
    showTip(`<b>${fmtDay(h.date)}</b> · ${h.meals ? `${h.meals} meal${h.meals > 1 ? 's' : ''} logged` : 'Nothing logged'}`, r.left + r.width / 2, r.top);
  };
  svg.addEventListener('pointerover', on);
  svg.addEventListener('pointerdown', on);
  svg.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && hideTip());
}

// ---------- Dashboard ----------
function dashboard() {
  const proteinLeft = targets.protein - eaten.protein;
  const days = habit.slice(-7);
  return `
  <section class="card coach">
    <div class="who"><i>${avMark()}</i>Your coach</div>
    <p>You're <b>${proteinLeft}g short on protein</b> today. Tonight's miso salmon bowl covers most of it — you're on pace for <b>${Math.abs(weekChange)} lb/week</b>, right on goal.</p>
    <div class="chips">
      ${['Swap dinner', 'High-protein snack', 'Cook from my pantry'].map((q) => `<button class="chip" data-ask="${q}">${q}</button>`).join('')}
    </div>
    <button class="ask-fake" data-ask="">Ask your coach or log a meal…</button>
  </section>

  <section class="card">
    <div class="card-h"><h2>Macros</h2><span class="sub num">${eaten.kcal} / ${targets.kcal} kcal</span></div>
    <div class="grid3" style="text-align:center">
      ${MACROS.map((m) => `<div>
        <div style="display:flex;justify-content:center">${ring(eaten[m.key], targets[m.key], 84, 8, m.color,
          `<text x="42" y="47" text-anchor="middle" font-size="16" font-weight="700" fill="var(--text)">${eaten[m.key]}g</text>`)}</div>
        <div class="small" style="margin-top:6px;font-weight:600">${m.label}</div>
        <div class="small muted num">of ${targets[m.key]}g</div>
      </div>`).join('')}
    </div>
  </section>

  <section class="card">
    <div class="card-h"><h2>Today's meals</h2><span class="sub">${meals.filter((m) => m.done).length}/${meals.length} eaten</span></div>
    ${meals.map((m) => `<div class="meal">
      <div class="ph">${m.icon}</div>
      <div class="t"><b>${m.name}</b><span class="muted small num">${m.kcal} kcal · ${m.p}g protein</span></div>
      <div class="check ${m.done ? 'done' : ''}">${m.done ? '✓' : ''}</div>
    </div>`).join('')}
  </section>

  <section class="card">
    <div class="card-h"><h2>Weight</h2><span class="sub num">${latest.trend} lb · ${weekChange} this wk</span></div>
    ${weightChart('wC', 110)}
  </section>

  <section class="card">
    <div class="card-h"><h2>This week</h2><span class="sub">🔥 ${streak}-day streak</span></div>
    <div class="week">${days.map((h, i) => `<div>
      <div class="d">${h.date.toLocaleDateString(undefined, { weekday: 'narrow' })}</div>
      <div class="c ${h.meals ? 'on' : ''} ${i === 6 ? 'today' : ''}">${h.date.getDate()}</div>
    </div>`).join('')}</div>
    <div style="margin-top:14px">${heatmap('hC')}</div>
  </section>`;
}

const app = document.getElementById('app');
function renderDashboard() {
  hideTip();
  app.innerHTML = dashboard();
  bindWeightChart('wC');
  bindHeatmap('hC');
}

document.getElementById('today').textContent = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
renderDashboard();
