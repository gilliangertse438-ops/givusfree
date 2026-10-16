import * as st from './store.js';
import { MEALS, ACTIVITY, DIETS, EXERCISES, COLORS, dayKey, addDays, energy, eUnit, wShow, wUnit, wToKg } from './store.js';
import { FOODS, searchLocal, estimateFromText, scaleFood } from './foods.js';
import { analyzeMeal, lookupBarcode, searchProducts, loadImage, shrink, squareThumb } from './ai.js';
import { icon, esc, fmt, $, $$, buzz, toast, openSheet, closeSheet, closeAllSheets, countUp, burst } from './ui.js';

const app = $('#app');
const bar = $('#tabbar');
const S = { tab: 'today', date: dayKey(), ob: null, obStep: 0, prev: {}, prevNum: {} };

// ============================================================ render
function render(animate = false) {
  const p = st.activeProfile();
  if (!p || S.ob) { bar.hidden = true; app.innerHTML = onboarding(); afterRender(); return; }
  const screens = { today, progress, foods, me };
  app.innerHTML = `<div class="screen ${animate ? '' : 'no-anim'}">${screens[S.tab](p)}</div>`;
  bar.hidden = false;
  bar.innerHTML = tabbar();
  afterRender();
  if (animate) window.scrollTo({ top: 0 });
}

function afterRender() {
  // tween anything marked with data-to from its previous value
  const els = $$('[data-k]');
  for (const el of els) {
    const k = el.dataset.k, prop = el.dataset.prop;
    const from = S.prev[k] ?? el.dataset.from;
    if (from != null) setProp(el, prop, from);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const el of els) { setProp(el, el.dataset.prop, el.dataset.to); S.prev[el.dataset.k] = el.dataset.to; }
  }));
  for (const el of $$('[data-count]')) {
    const k = el.dataset.count, to = +el.dataset.val;
    countUp(el, to, { from: S.prevNum[k] ?? 0, dur: 1000 });
    S.prevNum[k] = to;
  }
}
function setProp(el, prop, v) {
  if (prop === 'width') el.style.width = v + '%';
  else if (prop === 'dash') el.style.strokeDashoffset = v;
}

function tabbar() {
  const t = (id, ic, label) => `<button class="tab ${S.tab === id ? 'on' : ''}" data-act="tab" data-tab="${id}" aria-label="${label}">${icon(ic, 23)}<span>${label}</span></button>`;
  return t('today', 'home', 'Today') + t('progress', 'chart', 'Progress') +
    `<div class="snap-tab"><button class="snap-btn" data-act="snap" aria-label="Snap your food">${icon('cam', 28, 2)}</button></div>` +
    t('foods', 'book', 'Foods') + t('me', 'user', 'Me');
}

const avatar = (p, cls = '') => `<div class="avatar av-${p.color || 'blue'} ${cls}">${esc((p.name || '?').trim()[0]?.toUpperCase() || '?')}</div>`;
const mealFor = () => { const h = new Date().getHours(); return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snacks'; };
const mealIcon = { breakfast: 'sun', lunch: 'bowl', dinner: 'moon', snacks: 'apple' };
const mealName = (id) => MEALS.find(m => m.id === id)?.name || id;
function dateLabel(key) {
  const today = dayKey();
  const d = new Date(key + 'T12:00:00');
  const short = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (key === today) return ['Today', short];
  if (key === addDays(today, -1)) return ['Yesterday', short];
  if (key === addDays(today, 1)) return ['Tomorrow', short];
  return [d.toLocaleDateString('en-US', { weekday: 'long' }), short];
}
function greeting() { const h = new Date().getHours(); return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }

// ============================================================ TODAY
function today(p) {
  const pl = st.plan(p), t = st.totals(S.date), d = st.peekDay(S.date);
  const budget = pl.kcal + t.burned, left = budget - t.kcal, over = left < 0;
  const C = 2 * Math.PI * 76, frac = Math.min(1, t.kcal / budget);
  const [dl, ds] = dateLabel(S.date);
  const macro = (k, label, col, goal) => {
    const v = t[k], pct = Math.min(100, (v / goal) * 100);
    return `<div class="macro"><div class="top"><b>${label}</b><span class="num">${Math.round(v)}/${goal}g</span></div><div class="bar"><i class="${col}" data-k="m-${k}" data-prop="width" data-from="0" data-to="${pct}"></i></div></div>`;
  };
  const glasses = Math.min(12, Math.ceil(pl.water / 250)), filled = Math.round(t.water / 250);
  const meals = MEALS.map(m => {
    const list = d?.meals[m.id] || [];
    const kc = list.reduce((a, e) => a + e.kcal, 0);
    return `<section class="card meal">
      <div class="meal-head">
        <div class="meal-ico ${m.id}">${icon(mealIcon[m.id], 20)}</div>
        <div class="grow"><div class="meal-name">${m.name}</div><div class="meal-kcal num">${list.length ? fmt(energy(kc, p)) + ' ' + eUnit(p) : 'Nothing yet'}</div></div>
        <button class="add-btn" data-act="add" data-meal="${m.id}" aria-label="Add to ${m.name}">${icon('plus', 20, 2.2)}</button>
      </div>
      ${list.map(e => `<button class="entry lrow" style="padding:10px 0" data-act="entry" data-meal="${m.id}" data-id="${e.id}">
        ${e.img ? `<img class="thumb" src="${e.img}" alt="">` : `<div class="thumb">${icon(e.items ? 'cam' : 'bowl', 18)}</div>`}
        <div class="grow"><div class="n">${esc(e.name)}</div><div class="d">${esc(e.portion || '')}</div></div>
        <div class="k num">${fmt(energy(e.kcal, p))}</div></button>`).join('') || `<div class="empty-line">${m.id === 'snacks' ? 'A handful of nuts counts too.' : 'Tap + or snap a photo.'}</div>`}
    </section>`;
  }).join('');
  const ex = d?.exercise || [];
  return `<div class="stagger">
    <header class="topbar">
      <div class="hello"><small>${greeting()}</small>${esc(p.name)}</div>
      <button data-act="switch" aria-label="Switch profile">${avatar(p)}</button>
    </header>
    <div class="datebar">
      <button data-act="date" data-d="-1" aria-label="Previous day">${icon('left')}</button>
      <button class="dlabel" data-act="date" data-d="0" style="width:auto">${dl}<span>${ds}</span></button>
      <button data-act="date" data-d="1" aria-label="Next day">${icon('right')}</button>
    </div>
    <section class="card hero">
      <div class="hero-grid">
        <div class="hero-stat"><div class="v num" data-count="eaten" data-val="${energy(t.kcal, p)}">0</div><div class="l">Eaten</div></div>
        <div class="ring-wrap">
          <svg viewBox="0 0 176 176"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fb3ff"/><stop offset="1" stop-color="#2eef8a"/></linearGradient></defs>
            <circle class="ring-bg" cx="88" cy="88" r="76"/>
            <circle class="ring-fg ${over ? 'over' : ''}" cx="88" cy="88" r="76" stroke="${over ? '#ff3d8b' : 'url(#rg)'}" stroke-dasharray="${C}" data-k="ring" data-prop="dash" data-from="${C}" data-to="${C * (1 - (over ? 1 : frac))}"/>
          </svg>
          <div class="ring-center"><div class="big num ${over ? 't-pink' : ''}" data-count="left" data-val="${energy(Math.abs(left), p)}">0</div><div class="cap">${over ? eUnit(p) + ' over' : eUnit(p) + ' left'}</div></div>
        </div>
        <div class="hero-stat"><div class="v num" data-count="burned" data-val="${energy(t.burned, p)}">0</div><div class="l">Burned</div></div>
      </div>
      <div class="macros">${macro('protein', 'Protein', 'c-blue', pl.protein)}${macro('carbs', 'Carbs', 'c-green', pl.carbs)}${macro('fat', 'Fat', 'c-pink', pl.fat)}</div>
    </section>
    <div class="h-sec">Meals <b class="num">Goal ${fmt(energy(pl.kcal, p))} ${eUnit(p)}</b></div>
    ${meals}
    <div class="h-sec">Water <b class="num">${(t.water / 1000).toFixed(2).replace(/0$/, '')} / ${(pl.water / 1000).toFixed(1)} L</b></div>
    <section class="card"><div class="row between"><div class="row">${icon('drop', 20)}<span class="sub">Tap a glass. Each is 250 ml.</span></div></div>
      <div class="water">${Array.from({ length: glasses }, (_, i) => `<button class="drop ${i < filled ? 'on' : ''}" data-act="water" data-i="${i}" aria-label="Glass ${i + 1}"></button>`).join('')}</div>
    </section>
    <div class="h-sec">Movement <b class="num">${fmt(energy(t.burned, p))} ${eUnit(p)} burned</b></div>
    <section class="card">
      ${ex.map(x => `<button class="lrow" style="padding:8px 0" data-act="del-ex" data-id="${x.id}"><div class="meal-ico snacks" style="background:rgba(46,239,138,.12);color:var(--green)">${icon('run', 19)}</div><div class="grow"><div class="n">${esc(x.name)}</div><div class="d">${x.min} min</div></div><div class="k num t-green">+${fmt(energy(x.kcal, p))}</div></button>`).join('')}
      <button class="btn ghost sm" style="width:100%;margin-top:${ex.length ? 10 : 0}px" data-act="exercise">${icon('plus', 18)} Log exercise</button>
    </section>
  </div>`;
}

// ============================================================ PROGRESS
function progress(p) {
  const pl = st.plan(p), D = st.data();
  const days = Array.from({ length: 7 }, (_, i) => addDays(dayKey(), i - 6));
  const tots = days.map(k => st.totals(k));
  const logged = tots.filter(t => t.count);
  const avg = logged.length ? logged.reduce((a, t) => a + t.kcal, 0) / logged.length : 0;
  const avgP = logged.length ? logged.reduce((a, t) => a + t.protein, 0) / logged.length : 0;
  let streak = 0, k = st.totals(dayKey()).count ? dayKey() : addDays(dayKey(), -1);
  while (st.totals(k).count && streak < 3650) { streak++; k = addDays(k, -1); }
  const W = D.weights;
  const first = W[0]?.kg ?? p.weight, now = W.at(-1)?.kg ?? p.weight;
  const toGo = p.goalWeight ? now - p.goalWeight : 0;
  return `<div class="stagger">
    <h1 class="h-screen">Progress</h1>
    <section class="card">
      <div class="row between" style="align-items:flex-start">
        <div><div class="tiny" style="font-weight:700;letter-spacing:.08em;text-transform:uppercase">Weight</div>
          <div style="font-family:var(--display);font-size:40px;font-weight:800;letter-spacing:-.04em;line-height:1.05" class="num">${wShow(now, p)}<span class="muted" style="font-size:18px;font-weight:600"> ${wUnit(p)}</span></div>
          <div class="sub num">${W.length > 1 ? `<span class="${now - first <= 0 ? 't-green' : 't-pink'}">${now - first <= 0 ? '↓' : '↑'} ${Math.abs(wShow(now - first, p)).toFixed(1)} ${wUnit(p)}</span> since you started` : 'Log weekly to see your trend'}</div>
        </div>
        <button class="btn blue sm" data-act="weight">${icon('scale', 18)} Log</button>
      </div>
      <div style="margin-top:16px">${weightChart(W, p)}</div>
      ${p.goalWeight ? `<div class="sub" style="margin-top:10px">${Math.abs(toGo) < 0.3 ? 'You\'re at your goal weight. Brilliant.' : `<b class="num">${Math.abs(wShow(toGo, p)).toFixed(1)} ${wUnit(p)}</b> to your goal of ${wShow(p.goalWeight, p)} ${wUnit(p)}`}</div>` : ''}
    </section>
    <div class="h-sec">Last 7 days</div>
    <section class="card">${weekBars(days, tots, pl.kcal, p)}</section>
    <div class="stat-grid" style="margin-top:12px">
      <div class="card stat"><div class="v num">${fmt(energy(avg, p))}</div><div class="l">Avg ${eUnit(p)} / day</div></div>
      <div class="card stat" style="margin:0"><div class="v num t-green">${streak}<span style="font-size:16px"> day${streak === 1 ? '' : 's'}</span></div><div class="l">Logging streak</div></div>
      <div class="card stat" style="margin:0"><div class="v num t-blue">${Math.round(avgP)}g</div><div class="l">Avg protein</div></div>
      <div class="card stat" style="margin:0"><div class="v num">${st.bmi({ ...p, weight: now }).toFixed(1)}</div><div class="l">BMI</div></div>
    </div>
    <div class="h-sec">This month</div>
    <section class="card">${calendar(pl.kcal)}</section>
  </div>`;
}

function weightChart(W, p) {
  if (W.length < 2) return `<div class="note" style="background:rgba(47,140,255,.07);border-color:rgba(47,140,255,.2)">Your weight line appears after two weigh-ins.</div>`;
  const pts = W.slice(-30), w = 320, h = 130, pad = 8;
  const vals = pts.map(x => x.kg).concat(p.goalWeight ? [p.goalWeight] : []);
  const lo = Math.min(...vals) - 0.5, hi = Math.max(...vals) + 0.5;
  const X = (i) => pad + (i / (pts.length - 1)) * (w - pad * 2), Y = (v) => pad + (1 - (v - lo) / (hi - lo)) * (h - pad * 2);
  const xy = pts.map((x, i) => [X(i), Y(x.kg)]);
  let len = 0; for (let i = 1; i < xy.length; i++) len += Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]);
  const d = xy.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
  const last = xy.at(-1);
  return `<svg class="chart" viewBox="0 0 ${w} ${h + 18}">
    <defs><linearGradient id="wa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8cff" stop-opacity=".28"/><stop offset="1" stop-color="#2f8cff" stop-opacity="0"/></linearGradient></defs>
    ${p.goalWeight ? `<line x1="0" x2="${w}" y1="${Y(p.goalWeight)}" y2="${Y(p.goalWeight)}" stroke="#2eef8a" stroke-dasharray="4 5" stroke-width="1.5" opacity=".7"/><text x="${w}" y="${Y(p.goalWeight) - 6}" text-anchor="end" style="fill:#86ffbe">goal</text>` : ''}
    <path d="${d} L${last[0]} ${h} L${xy[0][0]} ${h}Z" fill="url(#wa)" style="animation:fade 1.2s .4s both"/>
    <path class="line" d="${d}" stroke="#5fb3ff" style="--len:${Math.ceil(len)}"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="5" fill="#07080d" stroke="#5fb3ff" stroke-width="3" style="animation:fade .4s 1.3s both"/>
    <text x="${pad}" y="${h + 16}">${shortDate(pts[0].date)}</text><text x="${w - pad}" y="${h + 16}" text-anchor="end">${shortDate(pts.at(-1).date)}</text>
  </svg>`;
}
const shortDate = (k) => new Date(k + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function weekBars(days, tots, goal, p) {
  const w = 320, h = 140, bw = 28, gap = (w - bw * 7) / 6;
  const max = Math.max(goal * 1.3, ...tots.map(t => t.kcal));
  const Y = (v) => h - (v / max) * h;
  return `<svg class="chart" viewBox="0 0 ${w} ${h + 22}">
    <line x1="0" x2="${w}" y1="${Y(goal)}" y2="${Y(goal)}" stroke="#a8afc3" stroke-dasharray="3 5" opacity=".5"/>
    ${tots.map((t, i) => {
      const x = i * (bw + gap), v = t.kcal, r = v / goal;
      const col = !v ? '#1b2030' : r > 1.1 ? '#ff3d8b' : r < 0.85 ? '#2f8cff' : '#2eef8a';
      const bh = Math.max(6, h - Y(v));
      return `<rect class="barr" x="${x}" y="${h - bh}" width="${bw}" height="${bh}" rx="9" fill="${col}" style="animation-delay:${i * 60}ms"/>
        <text x="${x + bw / 2}" y="${h + 17}" text-anchor="middle" ${days[i] === dayKey() ? 'style="fill:#f2f4fa"' : ''}>${new Date(days[i] + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}</text>`;
    }).join('')}
  </svg>
  <div class="legend"><span><i style="background:#2eef8a"></i>On target</span><span><i style="background:#2f8cff"></i>Under</span><span><i style="background:#ff3d8b"></i>Over</span></div>`;
}

function calendar(goal) {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const first = new Date(y, m, 1), daysIn = new Date(y, m + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  let cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<div class="dow">${d}</div>`).join('');
  cells += '<div></div>'.repeat(offset);
  for (let i = 1; i <= daysIn; i++) {
    const k = dayKey(new Date(y, m, i)), t = st.totals(k), r = t.kcal / goal;
    const cls = !t.count ? '' : r > 1.1 ? 'over' : r < 0.85 ? 'under' : 'ok';
    cells += `<div class="day ${cls} ${k === dayKey() ? 'today' : ''}" style="animation-delay:${i * 12}ms">${i}</div>`;
  }
  return `<div class="row between" style="margin-bottom:12px"><b>${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b></div><div class="cal">${cells}</div>`;
}

// ============================================================ FOODS
function foods(p) {
  const D = st.data();
  const row = (f, i, src) => `<button class="lrow" data-act="pick-food" data-src="${src}" data-i="${i}">
    <div class="grow"><div class="n">${esc(f.name)}</div><div class="d">${esc(f.serving || '')}${f.grams ? ' · ' + f.grams + ' g' : ''}</div></div>
    <div class="k num" style="font-weight:700">${fmt(energy(f.kcal, p))}</div></button>`;
  return `<div class="stagger">
    <h1 class="h-screen">Foods</h1>
    <button class="input row" style="color:var(--ink-3);gap:10px" data-act="search">${icon('search', 20)} Search foods & products</button>
    <div class="three" style="margin-top:12px">
      <button class="add-tile" style="min-height:96px" data-act="barcode"><div class="ic" style="background:rgba(47,140,255,.14);color:var(--blue-hi)">${icon('barcode')}</div><b>Scan</b></button>
      <button class="add-tile" style="min-height:96px" data-act="create-food"><div class="ic" style="background:rgba(46,239,138,.12);color:var(--green)">${icon('pen')}</div><b>Create</b></button>
      <button class="add-tile" style="min-height:96px" data-act="quick"><div class="ic" style="background:rgba(255,61,139,.13);color:var(--pink-hi)">${icon('bolt')}</div><b>Quick add</b></button>
    </div>
    <div class="h-sec">My foods <b>${D.custom.length || ''}</b></div>
    ${D.custom.length ? `<div class="list">${D.custom.map((f, i) => row(f, i, 'custom')).join('')}</div>` : `<div class="card sub">Foods you create or save show up here — your go-to breakfast, granny's stew, that protein shake.</div>`}
    <div class="h-sec">Recent</div>
    ${D.recents.length ? `<div class="list">${D.recents.slice(0, 15).map((f, i) => row(f, i, 'recent')).join('')}</div>` : `<div class="card sub">Everything you log lands here so you can add it again in one tap.</div>`}
  </div>`;
}

// ============================================================ ME
function me(p) {
  const pl = st.plan(p), s = st.settings(), all = st.profiles();
  const seg = (act, val, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${val === v ? 'on' : ''}" data-act="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const li = (act, ic, n, d, extra = '') => `<button class="lrow" data-act="${act}" ${extra}><div class="icon-btn" style="border:0">${icon(ic, 20)}</div><div class="grow"><div class="n">${n}</div>${d ? `<div class="d">${d}</div>` : ''}</div>${icon('right', 18)}</button>`;
  return `<div class="stagger">
    <h1 class="h-screen">Me</h1>
    <section class="card">
      <div class="row">${avatar(p, 'lg')}<div class="grow"><div style="font-family:var(--display);font-size:24px;font-weight:700;letter-spacing:-.02em">${esc(p.name)}</div>
        <div class="sub">${p.age} yrs · ${p.units === 'imperial' ? ftIn(p.height) : p.height + ' cm'} · ${wShow(p.weight, p)} ${wUnit(p)}</div></div>
        <button class="icon-btn" data-act="edit-profile" aria-label="Edit profile">${icon('pen', 19)}</button></div>
      <div class="three" style="margin-top:16px;text-align:center">
        <div><div class="num" style="font-family:var(--display);font-size:22px;font-weight:800">${fmt(energy(pl.kcal, p))}</div><div class="tiny">daily ${eUnit(p)}</div></div>
        <div><div class="num" style="font-family:var(--display);font-size:22px;font-weight:800">${fmt(energy(pl.tdee, p))}</div><div class="tiny">you burn / day</div></div>
        <div><div class="num" style="font-family:var(--display);font-size:22px;font-weight:800">${st.bmi(p).toFixed(1)}</div><div class="tiny">BMI</div></div>
      </div>
    </section>
    <div class="h-sec">Goals</div>
    <div class="list">
      ${li('goal-kcal', 'target', 'Daily calories', p.customKcal ? `Custom · ${fmt(energy(p.customKcal, p))} ${eUnit(p)}` : `Automatic · ${fmt(energy(pl.auto, p))} ${eUnit(p)}`)}
      ${li('diet', 'bowl', 'Eating style & macros', p.customMacros ? `Custom · C${p.customMacros.c} P${p.customMacros.p} F${p.customMacros.f}` : (DIETS[p.diet] || DIETS.balanced).t)}
      ${li('edit-profile', 'scale', 'Body & weight goal', `${{ lose: 'Lose', maintain: 'Maintain', gain: 'Gain' }[p.goal]}${p.goal !== 'maintain' ? ' ' + wShow(p.pace || .5, p) + ' ' + wUnit(p) + ' / week' : ' weight'}`)}
    </div>
    <div class="h-sec">Units</div>
    <section class="card" style="display:grid;gap:10px">
      ${seg('units', p.units || 'metric', [['metric', 'kg · cm'], ['imperial', 'lb · ft']])}
      ${seg('energy', p.energy || 'kcal', [['kcal', 'Calories'], ['kj', 'Kilojoules']])}
    </section>
    <div class="h-sec">Photo AI</div>
    <div class="list">${li('ai-key', 'key', s.aiKey ? 'Connected' : 'Set up photo recognition', s.aiKey ? 'Gemini key saved on this phone' : 'Free — takes about two minutes')}</div>
    <div class="h-sec">Family on this phone</div>
    <div class="list">
      ${all.map(x => `<button class="lrow" data-act="use-profile" data-id="${x.id}">${avatar(x)}<div class="grow"><div class="n">${esc(x.name)}</div><div class="d">${x.id === p.id ? 'Using now' : 'Tap to switch'}</div></div>${x.id === p.id ? `<span class="badge green">ACTIVE</span>` : icon('right', 18)}</button>`).join('')}
      <button class="lrow" data-act="new-profile"><div class="icon-btn" style="border:0">${icon('plus', 20)}</div><div class="grow"><div class="n">Add a family member</div><div class="d">Each person gets their own diary and goals</div></div></button>
      ${window.Capacitor ? '' : `<button class="lrow" data-act="share"><div class="icon-btn" style="border:0">${icon('family', 20)}</div><div class="grow"><div class="n">Share the app</div><div class="d">Send the download link to family on their own phones</div></div>${icon('right', 18)}</button>`}
    </div>
    <div class="h-sec">Your data</div>
    <div class="list">
      ${li('export', 'download', 'Back up everything', 'Save a file you can restore later')}
      ${li('import', 'upload', 'Restore from backup', '')}
    </div>
    <button class="btn danger" style="margin-top:14px" data-act="delete-profile">${icon('trash', 18)} Delete ${esc(p.name)}'s profile</button>
    <p class="tiny" style="text-align:center;margin:26px 0 0">GivUsFree · free forever · your data never leaves this phone<br>Estimates are a guide, not medical advice.</p>
  </div>`;
}
const ftIn = (cm) => { const i = Math.round(cm / 2.54); return `${Math.floor(i / 12)}′${i % 12}″`; };

// ============================================================ ONBOARDING
function onboarding() {
  const o = S.ob || (S.ob = { name: '', color: 'blue', sex: '', age: '', height: '', weight: '', goal: 'lose', pace: 0.5, goalWeight: '', activity: 1.375, units: 'metric', energy: 'kcal', diet: 'balanced' });
  const step = S.obStep, total = 6;
  const imp = o.units === 'imperial';
  const dots = step ? `<div class="ob-steps">${Array.from({ length: total }, (_, i) => `<i class="${i < step ? 'on' : ''}"></i>`).join('')}</div>` : '';
  const foot = (ok, label = 'Continue') => `<div class="foot">${step > (st.profiles().length ? 1 : 0) ? `<button class="btn ghost" data-act="ob-back" aria-label="Back">${icon('left')}</button>` : st.profiles().length ? `<button class="btn ghost" data-act="ob-cancel" aria-label="Cancel">${icon('close')}</button>` : ''}<button class="btn ${step === 6 ? 'green' : 'blue'}" data-act="ob-next" ${ok ? '' : 'disabled'}>${label}</button></div>`;
  let body = '';
  if (step === 0) {
    return `<div class="splash screen">
      <div class="orbs"><i class="orb o1"></i><i class="orb o2"></i><i class="orb o3"></i><i class="orb o4"></i></div>
      <h1 class="word"><span>Snap it.</span><span>Know it.</span><span>Live <em>well</em><u>.</u></span></h1>
      <p class="lead sub" style="margin:0 0 28px;font-size:17px">Point your camera at a plate and GivUsFree tells you what's in it. Free for the whole family — no sign-ups, no subscriptions.</p>
      <button class="btn blue" data-act="ob-next">Create my profile</button>
      <button class="btn" style="background:none;color:var(--ink-2);margin-top:6px" data-act="import">Restore a backup</button>
    </div>`;
  }
  if (step === 1) body = `<h1>What should we<br>call you?</h1><p class="lead">Just a first name. It stays on this phone.</p>
    <div class="field"><input class="input" id="ob-name" maxlength="20" placeholder="Your name" value="${esc(o.name)}" autocomplete="off"></div>
    <div class="field"><label>Pick your colour</label><div class="color-pick">${COLORS.map(c => `<button class="av-${c} ${o.color === c ? 'on' : ''}" data-act="ob-color" data-v="${c}" aria-label="${c}"></button>`).join('')}</div></div>
    ${foot(o.name.trim())}`;
  if (step === 2) body = `<h1>A little<br>about you</h1><p class="lead">This sets how many calories your body uses.</p>
    <div class="field"><label>Body</label><div class="seg">${[['female', 'Female'], ['male', 'Male'], ['other', 'Prefer not to say']].map(([v, l]) => `<button class="${o.sex === v ? 'on' : ''}" data-act="ob-set" data-k="sex" data-v="${v}">${l}</button>`).join('')}</div></div>
    <div class="field"><label>Age</label><div class="input-unit"><input class="input num" id="ob-age" type="number" inputmode="numeric" min="10" max="110" value="${o.age}" placeholder="35"><span>years</span></div></div>
    ${foot(o.sex && o.age >= 10 && o.age <= 110)}`;
  if (step === 3) {
    const hIn = o.height ? Math.round(o.height / 2.54) : '';
    body = `<h1>Height &<br>weight</h1><p class="lead">Be honest — nobody else sees this.</p>
    <div class="field"><div class="seg">${[['metric', 'kg · cm'], ['imperial', 'lb · ft']].map(([v, l]) => `<button class="${o.units === v ? 'on' : ''}" data-act="ob-set" data-k="units" data-v="${v}">${l}</button>`).join('')}</div></div>
    ${imp ? `<div class="field"><label>Height</label><div class="two"><div class="input-unit"><input class="input num" id="ob-ft" type="number" inputmode="numeric" value="${hIn ? Math.floor(hIn / 12) : ''}" placeholder="5"><span>ft</span></div><div class="input-unit"><input class="input num" id="ob-in" type="number" inputmode="numeric" value="${hIn ? hIn % 12 : ''}" placeholder="7"><span>in</span></div></div></div>`
        : `<div class="field"><label>Height</label><div class="input-unit"><input class="input num" id="ob-h" type="number" inputmode="decimal" value="${o.height}" placeholder="170"><span>cm</span></div></div>`}
    <div class="field"><label>Weight</label><div class="input-unit"><input class="input num" id="ob-w" type="number" inputmode="decimal" value="${o.weight ? wShow(+o.weight, o) : ''}" placeholder="${imp ? '170' : '75'}"><span>${imp ? 'lb' : 'kg'}</span></div></div>
    ${foot(o.height > 90 && o.weight > 25)}`;
  }
  if (step === 4) body = `<h1>What's the<br>goal?</h1><p class="lead">You can change this any time.</p>
    ${[['lose', 'Lose weight', 'A gentle, steady deficit'], ['maintain', 'Stay where I am', 'Eat well, keep it steady'], ['gain', 'Gain weight', 'Build up, add muscle']].map(([v, t, d]) => `<button class="option ${o.goal === v ? 'on' : ''}" data-act="ob-set" data-k="goal" data-v="${v}"><div><div class="o-t">${t}</div><div class="o-d">${d}</div></div><i class="tick"></i></button>`).join('')}
    ${o.goal !== 'maintain' ? `<div class="field" style="margin-top:12px"><label>How fast? (per week)</label><div class="seg">${[0.25, 0.5, 0.75, 1].map(v => `<button class="${o.pace === v ? 'on' : ''}" data-act="ob-pace" data-v="${v}">${wShow(v, o)} ${imp ? 'lb' : 'kg'}</button>`).join('')}</div></div>
    <div class="field"><label>Goal weight (optional)</label><div class="input-unit"><input class="input num" id="ob-gw" type="number" inputmode="decimal" value="${o.goalWeight ? wShow(+o.goalWeight, o) : ''}" placeholder="${o.weight ? wShow(o.weight * (o.goal === 'lose' ? 0.9 : 1.08), o).toFixed(0) : ''}"><span>${imp ? 'lb' : 'kg'}</span></div></div>` : ''}
    ${foot(true)}`;
  if (step === 5) body = `<h1>How much do<br>you move?</h1><p class="lead">On a normal week. Workouts you log add to your budget.</p>
    ${ACTIVITY.map(a => `<button class="option ${o.activity === a.v ? 'on' : ''}" data-act="ob-act" data-v="${a.v}"><div><div class="o-t">${a.t}</div><div class="o-d">${a.d}</div></div><i class="tick"></i></button>`).join('')}
    ${foot(true)}`;
  if (step === 6) {
    const pl = st.plan(normalize(o));
    body = `<h1>You're set,<br>${esc(o.name)}.</h1><p class="lead">Here's your daily budget. Stay near it and the scale follows.</p>
      <div class="budget-reveal"><div class="big num" data-count="ob" data-val="${pl.kcal}">0</div><div class="sub">calories a day</div></div>
      <div class="three" style="text-align:center">
        <div class="card" style="padding:14px"><div class="num t-blue" style="font-weight:800;font-size:20px">${pl.protein}g</div><div class="tiny">protein</div></div>
        <div class="card" style="padding:14px;margin:0"><div class="num t-green" style="font-weight:800;font-size:20px">${pl.carbs}g</div><div class="tiny">carbs</div></div>
        <div class="card" style="padding:14px;margin:0"><div class="num t-pink" style="font-weight:800;font-size:20px">${pl.fat}g</div><div class="tiny">fat</div></div>
      </div>
      ${foot(true, "Let's go")}`;
  }
  return `<div class="ob screen">${dots}<div class="stagger" style="display:flex;flex-direction:column;flex:1">${body}</div></div>`;
}
function normalize(o) {
  return { ...o, name: o.name.trim(), age: +o.age, height: +o.height, weight: +o.weight, goalWeight: o.goalWeight ? +o.goalWeight : null, pace: o.goal === 'maintain' ? 0 : o.pace };
}
function readOb() {
  const o = S.ob; if (!o) return;
  const v = (id) => $('#' + id)?.value;
  if ($('#ob-name')) o.name = v('ob-name');
  if ($('#ob-age')) o.age = v('ob-age');
  if ($('#ob-h')) o.height = v('ob-h');
  if ($('#ob-ft')) o.height = String(Math.round(((+v('ob-ft') || 0) * 12 + (+v('ob-in') || 0)) * 2.54));
  if ($('#ob-w')) o.weight = v('ob-w') ? String(wToKg(+v('ob-w'), o)) : '';
  if ($('#ob-gw')) o.goalWeight = v('ob-gw') ? String(wToKg(+v('ob-gw'), o)) : '';
}
// live-validate onboarding inputs without re-rendering (keeps the keyboard open)
document.addEventListener('input', (e) => {
  if (!S.ob || !e.target.id?.startsWith('ob-')) return;
  readOb();
  const o = S.ob, btn = $('[data-act="ob-next"]');
  const ok = { 1: () => o.name.trim(), 2: () => o.sex && o.age >= 10 && o.age <= 110, 3: () => o.height > 90 && o.weight > 25 }[S.obStep];
  if (btn && ok) btn.disabled = !ok();
});

// ============================================================ SHEETS
function addMenu(meal) {
  const y = st.peekDay(addDays(S.date, -1))?.meals[meal] || [];
  openSheet(`<h2 class="sheet-title">Add to ${mealName(meal)}</h2>
    <div class="add-grid">
      <button class="add-tile hero-tile" data-act="snap" data-meal="${meal}"><div class="ic" style="background:var(--pink);color:#fff">${icon('cam')}</div><div><b>Snap a photo</b><span>Or describe it — we'll count it</span></div></button>
      <button class="add-tile" data-act="search" data-meal="${meal}"><div class="ic" style="background:rgba(47,140,255,.14);color:var(--blue-hi)">${icon('search')}</div><div><b>Search</b><span>Foods & products</span></div></button>
      <button class="add-tile" data-act="barcode" data-meal="${meal}"><div class="ic" style="background:rgba(46,239,138,.12);color:var(--green)">${icon('barcode')}</div><div><b>Scan barcode</b><span>Packaged food</span></div></button>
      <button class="add-tile" data-act="quick" data-meal="${meal}"><div class="ic" style="background:rgba(255,61,139,.13);color:var(--pink-hi)">${icon('bolt')}</div><div><b>Quick add</b><span>Just the number</span></div></button>
      <button class="add-tile" data-act="copy-y" data-meal="${meal}" ${y.length ? '' : 'disabled style="opacity:.4"'}><div class="ic" style="background:rgba(255,181,71,.12);color:var(--warn)">${icon('copy')}</div><div><b>Same as yesterday</b><span>${y.length ? y.length + ' item' + (y.length > 1 ? 's' : '') : 'Nothing logged'}</span></div></button>
    </div>`);
}

// ---------- SNAP ----------
function snap(meal = mealFor()) {
  const p = st.activeProfile();
  const s = { meal, img: null, b64: null, thumb: null, desc: '', phase: 'pick', result: null, error: '', base: null };
  let sh, timer;
  const draw = () => {
    const key = st.settings().aiKey;
    if (s.phase === 'pick') {
      sh.innerHTML = `
        <div class="sheet-head"><h2 class="sheet-title">What are you eating?</h2><button class="icon-btn" data-snap="close" aria-label="Close">${icon('close')}</button></div>
        <div class="viewfinder ${s.img ? '' : 'vf-corners'}">${s.img ? `<img src="${s.img}" alt="Your meal">` : `<i></i><div class="vf-empty"><button class="cam" data-snap="camera" aria-label="Take photo">${icon('cam', 34, 1.8)}</button><b>Take a photo of your plate</b><div class="tiny" style="margin-top:4px">Top-down works best, in good light</div><button class="vf-pill" style="margin-top:14px" data-snap="gallery">${icon('gallery', 17)} From gallery</button></div>`}
          ${s.img ? `<div class="vf-actions"><button class="vf-pill" data-snap="camera">${icon('cam', 17)} Retake</button><button class="vf-pill" data-snap="clear">${icon('close', 17)} Remove</button></div>` : ''}
        </div>
        <div class="field" style="margin-top:14px"><label for="snap-desc">Describe it (optional, makes it more accurate)</label>
          <textarea class="textarea" id="snap-desc" placeholder="e.g. grilled chicken, a cup of rice, fried in a tablespoon of oil">${esc(s.desc)}</textarea></div>
        <div class="chips scroll" style="margin-bottom:16px">${MEALS.map(m => `<button class="chip ${s.meal === m.id ? 'on' : ''}" data-snap="meal" data-v="${m.id}">${m.name}</button>`).join('')}</div>
        ${s.error ? `<div class="note warn" style="margin-bottom:14px">${s.error}</div>` : ''}
        ${!key && s.img ? `<div class="note" style="margin-bottom:14px">Photo recognition needs a free AI key (one-time setup). <button class="link" data-snap="setup">Set it up</button> — or describe the food above and I'll estimate it offline.</div>` : ''}
        <button class="btn pink" data-snap="go" ${s.img || s.desc.trim() ? '' : 'disabled'}>${icon('spark', 20)} Count my calories</button>
        <input type="file" accept="image/*" capture="environment" id="snap-cam" hidden>
        <input type="file" accept="image/*" id="snap-gal" hidden>`;
      const ta = $('#snap-desc', sh);
      ta.addEventListener('input', () => { s.desc = ta.value; $('[data-snap="go"]', sh).disabled = !(s.img || s.desc.trim()); });
      for (const id of ['snap-cam', 'snap-gal']) $('#' + id, sh).addEventListener('change', async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        try {
          const img = await loadImage(f);
          s.img = shrink(img, 1024, 0.85); s.b64 = s.img.split(',')[1]; s.thumb = squareThumb(img); s.error = '';
          URL.revokeObjectURL(img.src); draw(); buzz();
        } catch (err) { s.error = err.message; draw(); }
      });
    } else if (s.phase === 'scan') {
      const dots = Array.from({ length: 5 }, (_, i) => `<b style="left:${15 + Math.random() * 70}%;top:${15 + Math.random() * 65}%;animation-delay:${i * 0.35}s"></b>`).join('');
      sh.innerHTML = `<div style="padding-top:40px">
        <div class="viewfinder scanning">${s.img ? `<img src="${s.img}" alt="">` : `<div class="vf-empty" style="max-width:80%"><div style="font-family:var(--display);font-size:22px;font-weight:700">“${esc(s.desc.slice(0, 120))}”</div></div>`}<div class="scan-dots">${s.img ? dots : ''}</div></div>
        <div class="scan-status"><span id="scan-word">Looking closely…</span></div>
        <div class="scan-bar"><i></i></div></div>`;
      const words = s.img ? ['Looking closely…', 'Spotting each food…', 'Sizing up portions…', 'Checking for hidden oils…', 'Counting calories…'] : ['Reading your description…', 'Matching foods…', 'Counting calories…'];
      let i = 0;
      timer = setInterval(() => { const el = $('#scan-word', sh); if (!el) return clearInterval(timer); i = (i + 1) % words.length; el.outerHTML = `<span id="scan-word">${words[i]}</span>`; }, 1500);
    } else {
      clearInterval(timer);
      const r = s.result, tot = sum(r.items);
      sh.innerHTML = `
        <div class="sheet-head"><button class="icon-btn" data-snap="back" aria-label="Back">${icon('left')}</button><span class="badge ${r.confidence === 'high' ? 'green' : r.confidence === 'low' ? 'pink' : 'blue'}">${(r.confidence || 'medium').toUpperCase()} CONFIDENCE</span><button class="icon-btn" data-snap="close" aria-label="Close">${icon('close')}</button></div>
        ${s.img ? `<img src="${s.img}" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:24px;animation:rise .5s var(--ease) both">` : ''}
        <div class="result-title">${esc(r.title)}</div>
        <div class="result-total"><span class="big num" id="res-total">0</span> <span class="unit">${eUnit(p)}</span></div>
        <div class="macro-pills"><span class="mpill num"><i class="c-blue"></i>${Math.round(tot.protein)}g protein</span><span class="mpill num"><i class="c-green"></i>${Math.round(tot.carbs)}g carbs</span><span class="mpill num"><i class="c-pink"></i>${Math.round(tot.fat)}g fat</span></div>
        <div class="card" style="margin-top:14px;padding:4px 16px">${r.items.map((it, i) => `<div class="item-row" style="animation:rise .45s var(--ease) ${0.15 + i * 0.06}s both">
            <div><div class="n">${esc(it.name)}</div><div class="tiny">${esc(it.portion)}</div></div>
            <div class="k num">${fmt(energy(it.kcal, p))}</div>
            <div class="grams"><button data-snap="g" data-i="${i}" data-d="-1" aria-label="Less">${icon('minus', 16)}</button><input class="num" type="number" inputmode="numeric" value="${it.grams}" data-gi="${i}" aria-label="grams"><span class="tiny" style="padding-right:6px">g</span><button data-snap="g" data-i="${i}" data-d="1" aria-label="More">${icon('plus', 16)}</button></div>
            <button class="tiny" data-snap="rm" data-i="${i}" style="justify-self:end;color:var(--pink-hi)">Remove</button>
          </div>`).join('') || '<div class="sub" style="padding:16px 0">No food items left.</div>'}</div>
        ${r.note ? `<div class="note" style="margin-top:12px">${esc(r.note)}</div>` : ''}
        <div class="chips scroll" style="margin:16px -18px">${MEALS.map(m => `<button class="chip ${s.meal === m.id ? 'on' : ''}" data-snap="meal" data-v="${m.id}">${m.name}</button>`).join('')}</div>
        <button class="btn green" data-snap="save" ${r.items.length ? '' : 'disabled'}>${icon('check', 20, 2.4)} Add to ${mealName(s.meal)}</button>
        <p class="tiny" style="text-align:center;margin-top:12px">Adjust grams if a portion looks off — calories update instantly.</p>`;
      countUp($('#res-total', sh), energy(tot.kcal, p), { from: s.lastTotal ?? 0, dur: s.lastTotal == null ? 1200 : 400 });
      s.lastTotal = energy(tot.kcal, p);
      for (const inp of $$('[data-gi]', sh)) inp.addEventListener('change', () => { setGrams(+inp.dataset.gi, +inp.value || 0); draw(); });
    }
  };
  const setGrams = (i, g) => {
    const b = s.base[i], k = b.grams ? g / b.grams : 1;
    s.result.items[i] = { ...b, grams: Math.max(0, Math.round(g)), kcal: Math.round(b.kcal * k), protein: +(b.protein * k).toFixed(1), carbs: +(b.carbs * k).toFixed(1), fat: +(b.fat * k).toFixed(1) };
  };
  const run = async () => {
    const key = st.settings().aiKey;
    if (!key && !s.desc.trim()) { s.error = 'Add a short description, or set up the free photo AI in Me → Photo AI.'; return draw(); }
    s.phase = 'scan'; s.error = ''; draw();
    const t0 = Date.now();
    try {
      let r;
      if (key) r = await analyzeMeal({ key, model: st.settings().aiModel, imageB64: s.b64, description: s.desc });
      else {
        const items = estimateFromText(s.desc, st.data().custom);
        if (!items.length) throw new Error("I couldn't match those foods offline. Try simpler words like \"2 eggs, toast, coffee\", or set up the photo AI.");
        r = { title: items.map(x => x.name.split(',')[0]).slice(0, 3).join(', '), items, confidence: 'medium', note: 'Estimated offline from your description.' };
      }
      if (!r.items.length) throw new Error(r.note || "I couldn't spot any food there. Try another angle or add a description.");
      await new Promise(ok => setTimeout(ok, Math.max(0, 1600 - (Date.now() - t0)))); // let the scan breathe
      s.result = r; s.base = r.items.map(x => ({ ...x })); s.lastTotal = null; s.phase = 'result'; buzz(14); draw();
    } catch (err) { clearInterval(timer); s.phase = 'pick'; s.error = esc(err.message); draw(); }
  };
  sh = openSheet('', { full: true, onClose: () => clearInterval(timer) });
  sh.addEventListener('click', (e) => {
    const b = e.target.closest('[data-snap]'); if (!b) return;
    const a = b.dataset.snap;
    if (a === 'close') closeSheet();
    else if (a === 'camera') $('#snap-cam', sh).click();
    else if (a === 'gallery') $('#snap-gal', sh).click();
    else if (a === 'clear') { s.img = s.b64 = s.thumb = null; draw(); }
    else if (a === 'meal') { s.meal = b.dataset.v; draw(); }
    else if (a === 'setup') aiKeySheet();
    else if (a === 'go') run();
    else if (a === 'back') { s.phase = 'pick'; draw(); }
    else if (a === 'g') { const i = +b.dataset.i, g = s.result.items[i].grams; setGrams(i, Math.max(0, g + (+b.dataset.d) * Math.max(5, Math.round(s.base[i].grams * 0.1)))); draw(); buzz(4); }
    else if (a === 'rm') { const i = +b.dataset.i; s.result.items.splice(i, 1); s.base.splice(i, 1); draw(); }
    else if (a === 'save') {
      const r = s.result, tot = sum(r.items);
      st.addEntry(S.date, s.meal, { name: r.items.length === 1 ? r.items[0].name : r.title, portion: r.items.length === 1 ? r.items[0].portion : r.items.map(x => x.name).join(', '), ...tot, img: s.thumb, items: r.items });
      const rect = b.getBoundingClientRect();
      closeAllSheets(); S.tab = 'today'; render(); burst(rect.left + rect.width / 2, rect.top); toast(`Added to ${mealName(s.meal)}`);
    }
  });
  draw();
}
const sum = (items) => items.reduce((a, x) => ({ kcal: a.kcal + x.kcal, protein: +(a.protein + x.protein).toFixed(1), carbs: +(a.carbs + x.carbs).toFixed(1), fat: +(a.fat + x.fat).toFixed(1), grams: a.grams + (x.grams || 0) }), { kcal: 0, protein: 0, carbs: 0, fat: 0, grams: 0 });

// ---------- SEARCH ----------
function search(meal) {
  const p = st.activeProfile(); let ctrl, tmr, results = [];
  const sh = openSheet(`<div class="sheet-head"><h2 class="sheet-title">Find food</h2><button class="icon-btn" data-x="close" aria-label="Close">${icon('close')}</button></div>
    <div class="input-unit"><input class="input" id="q" placeholder="Try “banana” or “peanut butter”" autocomplete="off" enterkeyhint="search" style="padding-left:46px"><span style="left:16px;right:auto">${icon('search', 20)}</span></div>
    <div id="res" style="margin-top:14px"></div>`, { full: true });
  const q = $('#q', sh), res = $('#res', sh);
  const row = (f, i) => `<button class="lrow" data-x="pick" data-i="${i}"><div class="grow"><div class="n">${esc(f.name)}</div><div class="d">${esc(f.serving)}${f.grams ? ' · ' + f.grams + ' g' : ''}${f.src === 'off' ? ' · product' : ''}</div></div><div class="num" style="font-weight:700">${fmt(energy(f.kcal, p))}</div></button>`;
  const show = (local, remote, loading) => {
    results = [...local, ...remote];
    const v = q.value.trim();
    if (!v) {
      const rec = st.data().recents.slice(0, 12).map(r => ({ ...r, serving: r.serving || '1 serving' }));
      results = rec.length ? rec : FOODS.slice(0, 12);
      res.innerHTML = `<div class="h-sec" style="margin-top:4px">${rec.length ? 'Recent' : 'Popular'}</div><div class="list">${results.map(row).join('')}</div>`;
      return;
    }
    res.innerHTML = (local.length ? `<div class="list">${local.map(row).join('')}</div>` : '') +
      (remote.length ? `<div class="h-sec">Products</div><div class="list">${remote.map((f, i) => row(f, i + local.length)).join('')}</div>` : '') +
      (loading ? `<div class="h-sec">Products</div><div class="skeleton"></div><div class="skeleton"></div>` : '') +
      (!local.length && !remote.length && !loading ? `<div class="card sub" style="text-align:center">Nothing found. <button class="link" data-x="create">Create “${esc(v)}”</button></div>` : '');
  };
  q.addEventListener('input', () => {
    const v = q.value.trim(), local = searchLocal(v, st.data().custom);
    clearTimeout(tmr); ctrl?.abort();
    show(local, [], v.length >= 3 && navigator.onLine);
    if (v.length < 3 || !navigator.onLine) return;
    tmr = setTimeout(async () => {
      ctrl = new AbortController();
      try { const r = await searchProducts(v, ctrl.signal); if (q.value.trim() === v) show(local, r, false); }
      catch (e) { if (e.name !== 'AbortError') show(local, [], false); }
    }, 450);
  });
  sh.addEventListener('click', (e) => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'close') closeSheet();
    else if (b.dataset.x === 'pick') portion(results[+b.dataset.i], meal);
    else if (b.dataset.x === 'create') createFood(q.value.trim());
  });
  show([], [], false);
  setTimeout(() => q.focus(), 350);
}

// ---------- PORTION ----------
function portion(f, meal = mealFor(), opts = {}) {
  const p = st.activeProfile();
  const s = { mult: opts.mult || 1, meal };
  const custom = st.data().custom;
  const saved = custom.some(c => c.name === f.name);
  const sh = openSheet('');
  const draw = () => {
    const v = scaleFood(f, s.mult, `${+s.mult.toFixed(2)} × ${f.serving}`);
    sh.innerHTML = `<div class="grabber"></div>
      <div class="row between" style="align-items:flex-start"><div><h2 class="sheet-title" style="margin-bottom:4px">${esc(f.name)}</h2><div class="sub">${esc(f.serving)}${f.grams ? ' · ' + f.grams + ' g' : ''}</div></div>
      ${opts.edit ? '' : `<button class="icon-btn" data-x="fav" aria-label="Save to my foods" style="color:${saved ? 'var(--warn)' : 'inherit'}">${icon('star', 20)}</button>`}</div>
      <div class="result-total" style="margin:18px 0 6px"><span class="big num" style="font-size:60px">${fmt(energy(v.kcal, p))}</span> <span class="unit">${eUnit(p)}</span></div>
      <div class="macro-pills"><span class="mpill num"><i class="c-blue"></i>${v.protein}g P</span><span class="mpill num"><i class="c-green"></i>${v.carbs}g C</span><span class="mpill num"><i class="c-pink"></i>${v.fat}g F</span></div>
      <div class="row" style="justify-content:center;gap:16px;margin:18px 0">
        <button class="icon-btn" data-x="m" data-d="-0.25" aria-label="Less">${icon('minus')}</button>
        <div style="text-align:center;min-width:110px"><div class="num" style="font-family:var(--display);font-size:30px;font-weight:800">${+s.mult.toFixed(2)}</div><div class="tiny">servings</div></div>
        <button class="icon-btn" data-x="m" data-d="0.25" aria-label="More">${icon('plus')}</button>
      </div>
      <div class="chips" style="justify-content:center;margin-bottom:12px">${[0.5, 1, 1.5, 2].map(x => `<button class="chip ${s.mult === x ? 'on' : ''}" data-x="set" data-v="${x}">${x === 0.5 ? '½' : x}×</button>`).join('')}</div>
      ${opts.edit ? '' : `<div class="chips scroll" style="margin-bottom:16px">${MEALS.map(m => `<button class="chip ${s.meal === m.id ? 'on' : ''}" data-x="meal" data-v="${m.id}">${m.name}</button>`).join('')}</div>`}
      <button class="btn blue" data-x="add">${opts.edit ? 'Save' : 'Add to ' + mealName(s.meal)}</button>`;
  };
  sh.addEventListener('click', (e) => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    const x = b.dataset.x;
    if (x === 'm') { s.mult = Math.max(0.25, s.mult + +b.dataset.d); buzz(4); draw(); }
    else if (x === 'set') { s.mult = +b.dataset.v; draw(); }
    else if (x === 'meal') { s.meal = b.dataset.v; draw(); }
    else if (x === 'fav') {
      const D = st.data();
      if (D.custom.some(c => c.name === f.name)) D.custom = D.custom.filter(c => c.name !== f.name);
      else D.custom.unshift({ id: st.uid(), name: f.name, serving: f.serving, grams: f.grams, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat });
      st.persist(); b.style.color = D.custom.some(c => c.name === f.name) ? 'var(--warn)' : 'inherit'; buzz(); toast(D.custom.some(c => c.name === f.name) ? 'Saved to My foods' : 'Removed from My foods', 'star');
    } else if (x === 'add') {
      const v = scaleFood(f, s.mult, `${+s.mult.toFixed(2)} × ${f.serving}`);
      if (opts.edit) { opts.onSave(v, s.mult); closeAllSheets(); render(); return; }
      st.addEntry(S.date, s.meal, v);
      const r = b.getBoundingClientRect();
      closeAllSheets(); if (S.tab !== 'today') S.tab = 'today'; render(); burst(r.left + r.width / 2, r.top); toast(`${f.name} added`);
    }
  });
  draw();
}

// ---------- ENTRY DETAIL ----------
function entrySheet(meal, id) {
  const p = st.activeProfile(), e = st.day(S.date).meals[meal].find(x => x.id === id); if (!e) return;
  const sh = openSheet(`
    ${e.img ? `<img src="${e.img}" alt="" style="width:88px;height:88px;border-radius:24px;object-fit:cover;margin:0 auto 14px">` : ''}
    <h2 class="sheet-title" style="text-align:center;margin-bottom:4px">${esc(e.name)}</h2>
    <div class="sub" style="text-align:center">${esc(e.portion || '')} · ${mealName(meal)}</div>
    <div class="result-total" style="margin-top:14px"><span class="big num" style="font-size:56px">${fmt(energy(e.kcal, p))}</span> <span class="unit">${eUnit(p)}</span></div>
    <div class="macro-pills"><span class="mpill num"><i class="c-blue"></i>${Math.round(e.protein)}g P</span><span class="mpill num"><i class="c-green"></i>${Math.round(e.carbs)}g C</span><span class="mpill num"><i class="c-pink"></i>${Math.round(e.fat)}g F</span></div>
    ${e.items?.length > 1 ? `<div class="list" style="margin-top:12px">${e.items.map(it => `<div class="lrow"><div class="grow"><div class="n">${esc(it.name)}</div><div class="d">${esc(it.portion)} · ${it.grams} g</div></div><div class="num">${fmt(energy(it.kcal, p))}</div></div>`).join('')}</div>` : ''}
    <div class="btn-row" style="margin-top:18px">
      <button class="btn danger" data-x="del">${icon('trash', 18)} Delete</button>
      <button class="btn ghost" data-x="edit">${icon('pen', 18)} Portion</button>
    </div>
    <button class="btn ghost" style="margin-top:10px" data-x="again">${icon('copy', 18)} Log again today</button>`);
  sh.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'del') { st.removeEntry(S.date, meal, id); closeSheet(); render(); toast('Removed', 'trash'); }
    else if (b.dataset.x === 'again') { const { id: _, t, ...rest } = e; st.addEntry(dayKey(), meal, rest); closeSheet(); render(); toast('Logged again'); }
    else if (b.dataset.x === 'edit') {
      const base = { name: e.name, serving: e.portion || '1 serving', grams: e.grams || 0, kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat };
      portion(base, meal, { edit: true, onSave: (v, mult) => { Object.assign(e, { kcal: v.kcal, protein: v.protein, carbs: v.carbs, fat: v.fat, grams: v.grams, portion: mult === 1 ? e.portion : `${+mult.toFixed(2)} × ${base.serving}` }); st.persist(); } });
    }
  });
}

// ---------- QUICK ADD / CREATE ----------
function quickAdd(meal = mealFor()) {
  const p = st.activeProfile(); let m = meal;
  const sh = openSheet(`<h2 class="sheet-title">Quick add</h2>
    <div class="field"><label>What was it?</label><input class="input" id="qa-n" placeholder="Snack" maxlength="40"></div>
    <div class="field"><label>Energy</label><div class="input-unit"><input class="input num" id="qa-k" type="number" inputmode="numeric" placeholder="250"><span>${eUnit(p)}</span></div></div>
    <div class="three">${['Protein', 'Carbs', 'Fat'].map(x => `<div class="field"><label>${x}</label><div class="input-unit"><input class="input num" id="qa-${x[0]}" type="number" inputmode="decimal" placeholder="0"><span>g</span></div></div>`).join('')}</div>
    <div class="chips scroll" style="margin-bottom:16px">${MEALS.map(x => `<button class="chip ${m === x.id ? 'on' : ''}" data-x="meal" data-v="${x.id}">${x.name}</button>`).join('')}</div>
    <button class="btn blue" data-x="add">Add</button>`);
  sh.addEventListener('click', (e) => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'meal') { m = b.dataset.v; $$('[data-x="meal"]', sh).forEach(c => c.classList.toggle('on', c.dataset.v === m)); }
    if (b.dataset.x === 'add') {
      let k = +$('#qa-k', sh).value; if (!k) return toast('Enter the calories', 'bolt');
      if (p.energy === 'kj') k = k / st.KJ;
      st.addEntry(S.date, m, { name: $('#qa-n', sh).value.trim() || 'Quick add', portion: 'quick add', kcal: Math.round(k), protein: +$('#qa-P', sh).value || 0, carbs: +$('#qa-C', sh).value || 0, fat: +$('#qa-F', sh).value || 0 });
      closeAllSheets(); S.tab = 'today'; render(); toast(`Added to ${mealName(m)}`);
    }
  });
}

function createFood(name = '') {
  const p = st.activeProfile();
  const sh = openSheet(`<h2 class="sheet-title">Create a food</h2>
    <div class="field"><label>Name</label><input class="input" id="cf-n" value="${esc(name)}" placeholder="Mom's chicken curry" maxlength="50"></div>
    <div class="two"><div class="field"><label>Serving</label><input class="input" id="cf-s" placeholder="1 bowl"></div><div class="field"><label>Weight</label><div class="input-unit"><input class="input num" id="cf-g" type="number" inputmode="numeric" placeholder="250"><span>g</span></div></div></div>
    <div class="field"><label>Energy per serving</label><div class="input-unit"><input class="input num" id="cf-k" type="number" inputmode="numeric" placeholder="420"><span>${eUnit(p)}</span></div></div>
    <div class="three">${['Protein', 'Carbs', 'Fat'].map(x => `<div class="field"><label>${x}</label><div class="input-unit"><input class="input num" id="cf-${x[0]}" type="number" inputmode="decimal" placeholder="0"><span>g</span></div></div>`).join('')}</div>
    <button class="btn green" data-x="save">Save food</button>`);
  sh.addEventListener('click', (e) => {
    if (!e.target.closest('[data-x="save"]')) return;
    const v = (id) => $('#' + id, sh).value.trim();
    let k = +v('cf-k'); if (!v('cf-n') || !k) return toast('Name and calories please', 'pen');
    if (p.energy === 'kj') k = k / st.KJ;
    const D = st.data();
    D.custom.unshift({ id: st.uid(), name: v('cf-n'), serving: v('cf-s') || '1 serving', grams: +v('cf-g') || 0, kcal: Math.round(k), protein: +v('cf-P') || 0, carbs: +v('cf-C') || 0, fat: +v('cf-F') || 0 });
    st.persist(); closeAllSheets(); S.tab = 'foods'; render(); toast('Saved to My foods', 'star');
  });
}

// ---------- BARCODE ----------
async function barcode(meal = mealFor()) {
  let stream, raf, controls, done = false;
  const stop = () => { done = true; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); controls?.stop(); };
  const sh = openSheet(`<div class="sheet-head"><h2 class="sheet-title">Scan a barcode</h2><button class="icon-btn" data-x="close" aria-label="Close">${icon('close')}</button></div>
    <div class="scan-frame"><video class="scan-video" playsinline muted autoplay></video></div>
    <p class="sub" id="bc-msg" style="text-align:center">Hold the barcode inside the frame.</p>
    <div class="row" style="gap:8px"><input class="input num" id="bc-code" inputmode="numeric" placeholder="Or type the numbers"><button class="btn blue sm" style="height:54px" data-x="go">Find</button></div>`, { full: true, onClose: stop });
  const video = $('video', sh), msg = $('#bc-msg', sh);
  const found = async (code) => {
    if (done) return; stop(); buzz(20);
    msg.innerHTML = `<span class="spin" style="display:inline-block;vertical-align:-3px"></span> Looking up ${esc(code)}…`;
    try {
      const f = await lookupBarcode(code);
      if (!f) { msg.innerHTML = `Not in the database yet. <button class="link" data-x="create">Create it</button>`; return; }
      closeSheet(); portion(f, meal);
    } catch { msg.textContent = 'You need internet to look up barcodes.'; }
  };
  sh.addEventListener('click', (e) => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'close') closeSheet();
    if (b.dataset.x === 'go') { const c = $('#bc-code', sh).value.replace(/\D/g, ''); if (c.length >= 6) { done = false; found(c); } }
    if (b.dataset.x === 'create') { closeSheet(); createFood(); }
  });
  try {
    if ('BarcodeDetector' in window) {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream; await video.play();
      const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      const tick = async () => { if (done) return; try { const r = await det.detect(video); if (r[0]) return found(r[0].rawValue); } catch {} raf = requestAnimationFrame(tick); };
      tick();
    } else {
      const { BrowserMultiFormatReader } = await import('https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm');
      if (done) return;
      controls = await new BrowserMultiFormatReader().decodeFromVideoDevice(undefined, video, (r) => { if (r) found(r.getText()); });
    }
  } catch { msg.textContent = 'Camera not available — type the barcode numbers below.'; }
}

// ---------- EXERCISE / WEIGHT ----------
function exerciseSheet() {
  const p = st.activeProfile(); const s = { i: 0, min: 30 };
  const sh = openSheet('');
  const draw = () => {
    const k = st.burn(EXERCISES[s.i][1], p.weight, s.min);
    sh.innerHTML = `<div class="grabber"></div><h2 class="sheet-title">Log movement</h2>
      <div class="chips" style="margin-bottom:18px">${EXERCISES.map(([n], i) => `<button class="chip ${s.i === i ? 'on' : ''}" data-x="i" data-v="${i}">${n}</button>`).join('')}</div>
      <div class="row" style="justify-content:center;gap:16px">
        <button class="icon-btn" data-x="m" data-d="-5" aria-label="Less">${icon('minus')}</button>
        <div style="text-align:center;min-width:120px"><div class="num" style="font-family:var(--display);font-size:40px;font-weight:800;letter-spacing:-.03em">${s.min}</div><div class="tiny">minutes</div></div>
        <button class="icon-btn" data-x="m" data-d="5" aria-label="More">${icon('plus')}</button>
      </div>
      <p class="sub" style="text-align:center;margin:16px 0">≈ <b class="t-green num">${fmt(energy(k, p))} ${eUnit(p)}</b> burned, added to today's budget</p>
      <button class="btn green" data-x="add">Log it</button>`;
  };
  sh.addEventListener('click', (e) => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'i') s.i = +b.dataset.v;
    if (b.dataset.x === 'm') s.min = Math.max(5, s.min + +b.dataset.d);
    if (b.dataset.x === 'add') {
      st.day(S.date).exercise.push({ id: st.uid(), name: EXERCISES[s.i][0], min: s.min, kcal: st.burn(EXERCISES[s.i][1], p.weight, s.min) });
      st.persist(); closeSheet(); render(); toast('Nice work'); return;
    }
    draw();
  });
  draw();
}

function weightSheet() {
  const p = st.activeProfile();
  const sh = openSheet(`<h2 class="sheet-title">Today's weight</h2>
    <div class="input-unit"><input class="input num" id="wt" type="number" inputmode="decimal" step="0.1" value="${wShow(p.weight, p)}" style="font-size:28px;height:68px;font-weight:700;text-align:center"><span>${wUnit(p)}</span></div>
    <p class="tiny" style="text-align:center;margin:10px 0 18px">Weigh in at the same time of day for a fair trend.</p>
    <button class="btn blue" data-x="save">Save</button>`);
  setTimeout(() => $('#wt', sh).select(), 350);
  sh.addEventListener('click', (e) => {
    if (!e.target.closest('[data-x="save"]')) return;
    const v = +$('#wt', sh).value; if (!v) return;
    const kg = wToKg(v, p); st.logWeight(kg);
    closeSheet(); render(); toast('Weight saved', 'scale');
    if (p.goalWeight && Math.abs(kg - p.goalWeight) < 0.3) burst(innerWidth / 2, innerHeight / 3, 40);
  });
}

// ---------- PROFILE / SETTINGS SHEETS ----------
function switchSheet() {
  const p = st.activeProfile();
  const sh = openSheet(`<h2 class="sheet-title">Who's logging?</h2><div class="list">
    ${st.profiles().map(x => `<button class="lrow" data-x="use" data-id="${x.id}">${avatar(x)}<div class="grow"><div class="n">${esc(x.name)}</div><div class="d num">${fmt(energy(st.plan(x).kcal, x))} ${eUnit(x)} goal</div></div>${x.id === p.id ? icon('check', 20, 2.4) : ''}</button>`).join('')}
    <button class="lrow" data-x="new"><div class="icon-btn" style="border:0">${icon('plus', 20)}</div><div class="grow"><div class="n">Add a family member</div></div></button></div>`);
  sh.addEventListener('click', (e) => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    closeAllSheets();
    if (b.dataset.x === 'use') useProfile(b.dataset.id); else newProfile();
  });
}
function useProfile(id) { st.setActive(id); S.prev = {}; S.prevNum = {}; S.date = dayKey(); render(true); toast(`Hi ${st.activeProfile().name}`, 'user'); }
function newProfile() { S.ob = null; S.obStep = 1; onboarding(); render(true); }

function editProfile() {
  const p = st.activeProfile(), imp = p.units === 'imperial';
  const sh = openSheet(`<h2 class="sheet-title">Edit profile</h2>
    <div class="field"><label>Name</label><input class="input" id="ep-name" value="${esc(p.name)}" maxlength="20"></div>
    <div class="field"><label>Colour</label><div class="color-pick">${COLORS.map(c => `<button class="av-${c} ${p.color === c ? 'on' : ''}" data-x="color" data-v="${c}" aria-label="${c}"></button>`).join('')}</div></div>
    <div class="two">
      <div class="field"><label>Age</label><input class="input num" id="ep-age" type="number" inputmode="numeric" value="${p.age}"></div>
      <div class="field"><label>Height (cm)</label><input class="input num" id="ep-h" type="number" inputmode="decimal" value="${p.height}"></div>
      <div class="field"><label>Weight (${wUnit(p)})</label><input class="input num" id="ep-w" type="number" inputmode="decimal" value="${wShow(p.weight, p)}"></div>
      <div class="field"><label>Goal weight (${wUnit(p)})</label><input class="input num" id="ep-gw" type="number" inputmode="decimal" value="${p.goalWeight ? wShow(p.goalWeight, p) : ''}"></div>
    </div>
    <div class="field"><label>Goal</label><div class="seg">${[['lose', 'Lose'], ['maintain', 'Maintain'], ['gain', 'Gain']].map(([v, l]) => `<button class="${p.goal === v ? 'on' : ''}" data-x="goal" data-v="${v}">${l}</button>`).join('')}</div></div>
    <div class="field"><label>Pace per week</label><div class="seg">${[0.25, 0.5, 0.75, 1].map(v => `<button class="${(p.pace || .5) === v ? 'on' : ''}" data-x="pace" data-v="${v}">${wShow(v, p)} ${wUnit(p)}</button>`).join('')}</div></div>
    <div class="field"><label>Activity</label><div class="seg">${ACTIVITY.map((a, i) => `<button class="${p.activity === a.v ? 'on' : ''}" data-x="act" data-v="${a.v}">${['Low', 'Light', 'Active', 'Very'][i]}</button>`).join('')}</div></div>
    <button class="btn blue" data-x="save">Save</button>`);
  const draft = { ...p };
  sh.addEventListener('click', (e) => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    const x = b.dataset.x;
    if (['color', 'goal', 'pace', 'act'].includes(x)) {
      const key = { color: 'color', goal: 'goal', pace: 'pace', act: 'activity' }[x];
      draft[key] = x === 'pace' || x === 'act' ? +b.dataset.v : b.dataset.v;
      $$(`[data-x="${x}"]`, sh).forEach(c => c.classList.toggle('on', c === b));
      return;
    }
    if (x === 'save') {
      const v = (id) => $('#' + id, sh).value;
      Object.assign(draft, { name: v('ep-name').trim() || p.name, age: +v('ep-age') || p.age, height: +v('ep-h') || p.height, goalWeight: v('ep-gw') ? wToKg(+v('ep-gw'), p) : null });
      const w = wToKg(+v('ep-w'), p);
      st.saveProfile(draft);
      if (w && Math.abs(w - p.weight) > 0.05) st.logWeight(w);
      closeSheet(); render(); toast('Profile updated');
    }
  });
}

function kcalSheet() {
  const p = st.activeProfile(), pl = st.plan(p);
  const sh = openSheet(`<h2 class="sheet-title">Daily calories</h2>
    <p class="sub" style="margin-top:-6px">We suggest <b class="num">${fmt(energy(pl.auto, p))} ${eUnit(p)}</b> based on your body, activity and goal. Set your own if a dietitian gave you a number.</p>
    <div class="input-unit"><input class="input num" id="ck" type="number" inputmode="numeric" placeholder="${energy(pl.auto, p)}" value="${p.customKcal ? energy(p.customKcal, p) : ''}"><span>${eUnit(p)}</span></div>
    <div class="btn-row" style="margin-top:16px"><button class="btn ghost" data-x="auto">Use automatic</button><button class="btn blue" data-x="save">Save</button></div>`);
  sh.addEventListener('click', (e) => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    let v = +$('#ck', sh).value; if (p.energy === 'kj') v = v / st.KJ;
    p.customKcal = b.dataset.x === 'auto' || !v ? null : Math.round(Math.max(800, v));
    st.saveProfile(p); closeSheet(); render(); toast('Goal updated', 'target');
  });
}

function dietSheet() {
  const p = st.activeProfile(); let sel = p.customMacros ? 'custom' : (p.diet || 'balanced');
  const cm = p.customMacros || { ...DIETS.balanced };
  const sh = openSheet('');
  const draw = () => {
    sh.innerHTML = `<div class="grabber"></div><h2 class="sheet-title">Eating style</h2>
      ${Object.entries(DIETS).map(([k, d]) => `<button class="option ${sel === k ? 'on' : ''}" data-x="pick" data-v="${k}"><div><div class="o-t">${d.t}</div><div class="o-d">${d.d} · C${d.c} / P${d.p} / F${d.f}</div></div><i class="tick"></i></button>`).join('')}
      <button class="option ${sel === 'custom' ? 'on' : ''}" data-x="pick" data-v="custom"><div><div class="o-t">My own split</div><div class="o-d">Set exact percentages</div></div><i class="tick"></i></button>
      ${sel === 'custom' ? `<div class="three">${[['c', 'Carbs'], ['p', 'Protein'], ['f', 'Fat']].map(([k, l]) => `<div class="field"><label>${l}</label><div class="input-unit"><input class="input num" data-m="${k}" type="number" inputmode="numeric" value="${cm[k]}"><span>%</span></div></div>`).join('')}</div><p class="tiny" id="msum" style="margin-top:-4px">Must add up to 100%.</p>` : ''}
      <button class="btn blue" data-x="save" style="margin-top:6px">Save</button>`;
    for (const i of $$('[data-m]', sh)) i.addEventListener('input', () => { cm[i.dataset.m] = +i.value || 0; $('#msum', sh).textContent = `Total ${cm.c + cm.p + cm.f}% — must add up to 100%.`; });
  };
  sh.addEventListener('click', (e) => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'pick') { sel = b.dataset.v; draw(); return; }
    if (sel === 'custom') {
      if (cm.c + cm.p + cm.f !== 100) return toast('Percentages must total 100', 'target');
      p.customMacros = { c: cm.c, p: cm.p, f: cm.f };
    } else { p.customMacros = null; p.diet = sel; }
    st.saveProfile(p); closeSheet(); render(); toast('Macros updated', 'bowl');
  });
  draw();
}

function aiKeySheet() {
  const s = st.settings();
  const sh = openSheet(`<h2 class="sheet-title">Photo recognition</h2>
    <p class="sub" style="margin-top:-6px">GivUsFree uses Google's Gemini AI to read your food photos. It's free for personal use — you just need your own key. One person can create it and paste it on every family phone.</p>
    <div class="list" style="margin:14px 0">
      <div class="lrow"><span class="badge blue">1</span><div class="grow">Open <a class="link" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a></div></div>
      <div class="lrow"><span class="badge blue">2</span><div class="grow">Sign in with any Google account and tap <b>Create API key</b></div></div>
      <div class="lrow"><span class="badge blue">3</span><div class="grow">Copy the key and paste it below</div></div>
    </div>
    <div class="field"><input class="input" id="key" placeholder="AIza…" value="${esc(s.aiKey)}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
    <p class="tiny" style="margin:-4px 2px 16px">The key is stored only on this phone and sent only to Google when you analyse a photo. Without a key you can still describe meals in words.</p>
    <div class="btn-row">${s.aiKey ? '<button class="btn danger" data-x="rm">Remove</button>' : ''}<button class="btn blue" data-x="save">Save & test</button></div>`);
  sh.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-x]'); if (!b) return;
    if (b.dataset.x === 'rm') { st.saveSettings({ aiKey: '', aiModel: '' }); closeSheet(); render(); toast('Key removed', 'key'); return; }
    const key = $('#key', sh).value.trim(); if (!key) return;
    b.innerHTML = '<span class="spin"></span> Testing…'; b.disabled = true;
    try {
      const r = await analyzeMeal({ key, description: '1 medium apple' });
      st.saveSettings({ aiKey: key, aiModel: r.model });
      closeSheet(); render(); toast('Photo AI is ready', 'spark');
    } catch (err) { b.disabled = false; b.textContent = 'Save & test'; toast(err.message.slice(0, 70), 'close'); }
  });
}

// ---------- backup ----------
async function doExport() {
  const blob = new Blob([JSON.stringify(st.exportAll())], { type: 'application/json' });
  const name = `givusfree-backup-${dayKey()}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: 'GivUsFree backup' }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Backup saved', 'download');
}
function doImport() {
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json,.json';
  i.onchange = async () => {
    try { st.importAll(JSON.parse(await i.files[0].text())); S.ob = null; S.obStep = 0; S.tab = 'today'; render(true); toast('Backup restored', 'upload'); }
    catch (e) { toast(e.message || 'That file could not be read', 'close'); }
  };
  i.click();
}

// ============================================================ ACTIONS
const A = {
  tab: (b) => { if (S.tab === b.dataset.tab) return; S.tab = b.dataset.tab; buzz(5); render(true); },
  date: (b) => { const d = +b.dataset.d; S.date = d ? addDays(S.date, d) : dayKey(); buzz(4); render(); },
  add: (b) => addMenu(b.dataset.meal),
  snap: (b) => { closeAllSheets(); snap(b.dataset.meal); },
  search: (b) => { closeAllSheets(); search(b.dataset.meal || mealFor()); },
  barcode: (b) => { closeAllSheets(); barcode(b.dataset.meal); },
  quick: (b) => { closeAllSheets(); quickAdd(b.dataset.meal); },
  'create-food': () => createFood(),
  'copy-y': (b) => {
    const m = b.dataset.meal, y = st.peekDay(addDays(S.date, -1))?.meals[m] || [];
    for (const e of y) { const { id, t, ...rest } = e; st.addEntry(S.date, m, rest); }
    closeAllSheets(); render(); toast(`Copied ${y.length} item${y.length > 1 ? 's' : ''}`, 'copy');
  },
  'pick-food': (b) => { const D = st.data(); const f = (b.dataset.src === 'custom' ? D.custom : D.recents)[+b.dataset.i]; portion({ ...f, serving: f.serving || '1 serving' }); },
  entry: (b) => entrySheet(b.dataset.meal, b.dataset.id),
  water: (b) => {
    const d = st.day(S.date), i = +b.dataset.i, cur = Math.round(d.water / 250);
    d.water = (i + 1 === cur ? i : i + 1) * 250; st.persist(); buzz(6); render();
    const pl = st.plan(st.activeProfile());
    if (d.water >= pl.water && cur * 250 < pl.water) { const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 10); toast('Water goal reached', 'drop'); }
  },
  exercise: () => exerciseSheet(),
  'del-ex': (b) => {
    if (!confirm('Remove this activity?')) return;
    const d = st.day(S.date); d.exercise = d.exercise.filter(x => x.id !== b.dataset.id); st.persist(); render();
  },
  weight: () => weightSheet(),
  switch: () => switchSheet(),
  'use-profile': (b) => useProfile(b.dataset.id),
  'new-profile': () => newProfile(),
  'edit-profile': () => editProfile(),
  'goal-kcal': () => kcalSheet(),
  diet: () => dietSheet(),
  'ai-key': () => aiKeySheet(),
  units: (b) => { const p = st.activeProfile(); p.units = b.dataset.v; st.saveProfile(p); render(); },
  energy: (b) => { const p = st.activeProfile(); p.energy = b.dataset.v; st.saveProfile(p); S.prevNum = {}; render(); },
  share: async () => {
    const url = new URL('download.html', location.href).href;
    try { if (navigator.share) return await navigator.share({ title: 'GivUsFree', text: 'Snap your food, know your calories — free.', url }); } catch (e) { if (e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); toast('Link copied', 'copy'); } catch { prompt('Copy this link', url); }
  },
  export: () => doExport(),
  import: () => doImport(),
  'delete-profile': () => {
    const p = st.activeProfile();
    if (!confirm(`Delete ${p.name}'s profile and diary from this phone? This can't be undone.`)) return;
    st.deleteProfile(p.id); S.tab = 'today'; S.ob = null; S.obStep = 0; S.prev = {}; S.prevNum = {}; render(true);
  },
  // onboarding
  'ob-next': () => {
    readOb();
    if (S.obStep === 6) {
      const o = normalize(S.ob);
      const prof = { id: st.uid(), created: Date.now(), ...o };
      st.saveProfile(prof); st.setActive(prof.id); st.logWeight(prof.weight);
      S.ob = null; S.obStep = 0; S.tab = 'today'; S.prev = {}; S.prevNum = {};
      render(true); setTimeout(() => burst(innerWidth / 2, innerHeight * 0.3, 36), 300);
      return;
    }
    S.obStep++; render();
  },
  'ob-back': () => { readOb(); S.obStep = Math.max(0, S.obStep - 1); render(); },
  'ob-cancel': () => { S.ob = null; S.obStep = 0; render(true); },
  'ob-color': (b) => { readOb(); S.ob.color = b.dataset.v; buzz(4); render(); },
  'ob-set': (b) => { readOb(); S.ob[b.dataset.k] = b.dataset.v; render(); },
  'ob-pace': (b) => { readOb(); S.ob.pace = +b.dataset.v; render(); },
  'ob-act': (b) => { readOb(); S.ob.activity = +b.dataset.v; render(); },
};

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const fn = A[b.dataset.act];
  if (fn) { e.preventDefault(); fn(b); }
});

// ============================================================ boot
if (!st.activeProfile() && st.profiles()[0]) st.setActive(st.profiles()[0].id);
// with no profile, render() shows onboarding from the splash
render(true);
setTimeout(() => $('#boot').classList.add('gone'), 650);

// refresh "today" if the app is left open past midnight
let lastDay = dayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && dayKey() !== lastDay) { if (S.date === lastDay) S.date = dayKey(); lastDay = dayKey(); render(); }
});

if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.Capacitor) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
