// Everything lives on the device. No accounts, no servers.
const K = { profiles: 'guf:profiles', active: 'guf:active', settings: 'guf:settings', data: (id) => 'guf:data:' + id };

const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export const MEALS = [
  { id: 'breakfast', name: 'Breakfast' },
  { id: 'lunch', name: 'Lunch' },
  { id: 'dinner', name: 'Dinner' },
  { id: 'snacks', name: 'Snacks' },
];

export const ACTIVITY = [
  { v: 1.2, t: 'Mostly sitting', d: 'Desk job, little exercise' },
  { v: 1.375, t: 'Lightly active', d: 'On your feet some, or 1–3 workouts a week' },
  { v: 1.55, t: 'Active', d: '3–5 workouts a week' },
  { v: 1.725, t: 'Very active', d: 'Hard training most days' },
];

export const DIETS = {
  balanced: { t: 'Balanced', d: 'A bit of everything', c: 50, p: 20, f: 30 },
  protein: { t: 'High protein', d: 'Keeps you full, protects muscle', c: 40, p: 30, f: 30 },
  lowcarb: { t: 'Low carb', d: 'Fewer starches and sugar', c: 25, p: 35, f: 40 },
  keto: { t: 'Keto', d: 'Very low carb, high fat', c: 5, p: 25, f: 70 },
  lowfat: { t: 'Low fat', d: 'Lean protein, more carbs', c: 60, p: 20, f: 20 },
};

export const EXERCISES = [
  ['Walking', 3.5], ['Brisk walk', 4.3], ['Running', 9.8], ['Cycling', 7.5], ['Swimming', 7],
  ['Gym / weights', 5], ['HIIT', 8], ['Yoga', 2.5], ['Dancing', 5.5], ['Football', 7],
  ['Hiking', 6], ['Housework', 3.3], ['Gardening', 3.8], ['Skipping rope', 11],
];

export const COLORS = ['blue', 'pink', 'green', 'warn', 'ice', 'white'];

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
export const dayKey = (d = new Date()) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
export const addDays = (key, n) => { const d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return dayKey(d); };

// ---------- profiles ----------
export const profiles = () => read(K.profiles, []);
export const activeId = () => read(K.active, null);
export const activeProfile = () => profiles().find(p => p.id === activeId()) || null;
export function saveProfile(p) {
  const list = profiles(); const i = list.findIndex(x => x.id === p.id);
  if (i >= 0) list[i] = p; else list.push(p);
  write(K.profiles, list);
}
export const setActive = (id) => write(K.active, id);
export function deleteProfile(id) {
  write(K.profiles, profiles().filter(p => p.id !== id));
  localStorage.removeItem(K.data(id));
  if (activeId() === id) write(K.active, profiles()[0]?.id || null);
}

// ---------- settings (shared by everyone on this phone) ----------
export const settings = () => ({ aiKey: '', aiModel: '', ...read(K.settings, {}) });
export const saveSettings = (s) => write(K.settings, { ...settings(), ...s });

// ---------- per-profile data ----------
const blank = () => ({ days: {}, weights: [], custom: [], recents: [] });
let cache = null, cacheId = null;
export function data() {
  const id = activeId();
  if (cacheId !== id) { cache = { ...blank(), ...read(K.data(id), {}) }; cacheId = id; }
  return cache;
}
export function persist() {
  if (!write(K.data(cacheId), cache)) {
    // storage full: drop the oldest photo thumbnails and try again
    const keys = Object.keys(cache.days).sort();
    for (const k of keys.slice(0, Math.max(1, keys.length - 30))) for (const m of Object.values(cache.days[k].meals || {})) for (const e of m) delete e.img;
    write(K.data(cacheId), cache);
  }
}
export function day(key) {
  const d = data();
  if (!d.days[key]) d.days[key] = { meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }, water: 0, exercise: [] };
  return d.days[key];
}
export const peekDay = (key) => data().days[key] || null;

export function addEntry(key, meal, entry) {
  const e = { id: uid(), t: Date.now(), ...entry };
  day(key).meals[meal].push(e);
  const d = data();
  d.recents = [{ name: e.name, serving: e.portion, grams: e.grams, kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat }, ...d.recents.filter(r => r.name !== e.name)].slice(0, 40);
  persist();
  return e;
}
export function removeEntry(key, meal, id) {
  const m = day(key).meals; m[meal] = m[meal].filter(e => e.id !== id); persist();
}

export function totals(key) {
  const d = peekDay(key);
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, burned: 0, water: d?.water || 0, count: 0 };
  if (!d) return t;
  for (const list of Object.values(d.meals)) for (const e of list) {
    t.kcal += e.kcal || 0; t.protein += e.protein || 0; t.carbs += e.carbs || 0; t.fat += e.fat || 0; t.count++;
  }
  for (const x of d.exercise || []) t.burned += x.kcal || 0;
  return t;
}

export function logWeight(kg, key = dayKey()) {
  const d = data(); d.weights = d.weights.filter(w => w.date !== key); d.weights.push({ date: key, kg });
  d.weights.sort((a, b) => a.date.localeCompare(b.date)); persist();
  const p = activeProfile(); if (p) { p.weight = kg; saveProfile(p); }
}

// ---------- the maths ----------
export function plan(p) {
  const s = p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78;
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + s;
  const tdee = bmr * (p.activity || 1.375);
  const pace = p.goal === 'maintain' ? 0 : (p.pace || 0.5);
  const delta = (pace * 7700) / 7 * (p.goal === 'lose' ? -1 : p.goal === 'gain' ? 1 : 0);
  const floor = p.sex === 'male' ? 1500 : 1200;
  const auto = Math.max(floor, Math.round((tdee + delta) / 10) * 10);
  const kcal = p.customKcal || auto;
  const diet = DIETS[p.diet] || DIETS.balanced;
  const m = p.customMacros || diet;
  return {
    bmr: Math.round(bmr), tdee: Math.round(tdee), auto, kcal,
    protein: Math.round(kcal * m.p / 100 / 4), carbs: Math.round(kcal * m.c / 100 / 4), fat: Math.round(kcal * m.f / 100 / 9),
    water: Math.max(1500, Math.round(p.weight * 35 / 250) * 250),
    split: m,
  };
}

export const bmi = (p) => p.weight / Math.pow(p.height / 100, 2);
export const burn = (met, kg, minutes) => Math.round(met * kg * minutes / 60);

// ---------- units ----------
export const KJ = 4.184;
export function energy(kcal, p) { return p?.energy === 'kj' ? Math.round(kcal * KJ) : Math.round(kcal); }
export const eUnit = (p) => (p?.energy === 'kj' ? 'kJ' : 'kcal');
export const wShow = (kg, p) => (p?.units === 'imperial' ? +(kg * 2.20462).toFixed(1) : +kg.toFixed(1));
export const wUnit = (p) => (p?.units === 'imperial' ? 'lb' : 'kg');
export const wToKg = (v, p) => (p?.units === 'imperial' ? v / 2.20462 : v);

// ---------- backup ----------
export function exportAll() {
  const out = { app: 'GivUsFree', v: 1, at: new Date().toISOString(), profiles: profiles(), data: {} };
  for (const p of out.profiles) out.data[p.id] = read(K.data(p.id), blank());
  return out;
}
export function importAll(obj) {
  if (obj?.app !== 'GivUsFree') throw new Error('Not a GivUsFree backup');
  const list = profiles();
  for (const p of obj.profiles) { if (!list.find(x => x.id === p.id)) list.push(p); write(K.data(p.id), obj.data[p.id] || blank()); }
  write(K.profiles, list);
  if (!activeId() && list[0]) setActive(list[0].id);
  cacheId = null;
}
