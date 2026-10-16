// Small UI toolkit: icons, sheets, toasts, motion helpers.
const P = {
  home: '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  cam: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.6-2.2h5.4L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.6"/>',
  book: '<path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H8.5A3.5 3.5 0 0 1 5 16z"/><path d="M5 16a3.5 3.5 0 0 1 3.5-3.5H19"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.9-3.6 3.9-5.6 7.5-5.6s6.6 2 7.5 5.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  left: '<path d="m14.5 6-6 6 6 6"/>',
  right: '<path d="m9.5 6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  barcode: '<path d="M4 6v12M7 6v12M10.5 6v12M13 6v12M16.5 6v12M20 6v12"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  drop: '<path d="M12 3.5c3.2 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 2.8-6.5 6-10.5z"/>',
  flame: '<path d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-4.5-4-6.5-4.6-10.5-2.6 1.6-3.8 4.2-3.4 7-1.4-.6-2.3-1.8-2.6-3.4C6.4 9.3 5.5 11.7 5.5 14.5A6.5 6.5 0 0 0 12 21z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  bowl: '<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M8 7.5c0-1.5 1-2 1-3.5M12 7.5c0-1.5 1-2 1-3.5M16 7.5c0-1.5 1-2 1-3.5"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  apple: '<path d="M12 7.5c-1.5-1-5-1.2-6.3 1.8-1.3 3 .2 7.5 2.3 9.6 1.3 1.3 2.7 1 4 .4 1.3.6 2.7.9 4-.4 2.1-2.1 3.6-6.6 2.3-9.6C17 6.3 13.5 6.5 12 7.5z"/><path d="M12 7.5c0-2 1-3.5 3-4"/>',
  run: '<circle cx="14.5" cy="4.5" r="1.8"/><path d="m8 21 3-6 3 2.5V21M6 12.5l3-3.5 4 1 2.5 3.5h3M11 15l2-5"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9.5a4 4 0 0 1 6 0L12.6 12"/>',
  star: '<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12.5h8L17 7"/>',
  gallery: '<rect x="4" y="5" width="16" height="14" rx="3"/><circle cx="9.5" cy="10" r="1.6"/><path d="m4.5 17 4.5-4 3.5 3 2.5-2 4.5 3.5"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2.5"/><path d="M16 8V6.5A1.5 1.5 0 0 0 14.5 5h-8A1.5 1.5 0 0 0 5 6.5v8A1.5 1.5 0 0 0 6.5 16H8"/>',
  pen: '<path d="M5 19h3.5L19 8.5 15.5 5 5 15.5z"/>',
  key: '<circle cx="8" cy="15" r="3.5"/><path d="m10.5 12.5 8-8M16 7l2.5 2.5"/>',
  family: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M2.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5M13.5 15c.9-.7 1.9-1 3-1 2.2 0 3.9 1.4 4.5 4"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
  upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/>',
  spark: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
};
export const icon = (name, size = 22, sw = 1.9) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = (n) => Math.round(n).toLocaleString('en-US');
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const buzz = (ms = 8) => { try { navigator.vibrate?.(ms); } catch {} };

// ---------- toast ----------
export function toast(msg, ic = 'check') {
  const root = $('#toast-root');
  root.innerHTML = '';
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = icon(ic, 18, 2.4) + esc(msg);
  root.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 2200);
}

// ---------- sheets ----------
const stack = [];
export function openSheet(html, { full = false, onMount, onClose } = {}) {
  const root = $('#sheet-root');
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const sh = document.createElement('div'); sh.className = 'sheet' + (full ? ' full' : '');
  sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
  sh.innerHTML = (full ? '' : '<div class="grabber"></div>') + html;
  root.append(scrim, sh);
  const entry = { scrim, sh, onClose };
  stack.push(entry);
  scrim.addEventListener('click', () => closeSheet());
  if (!full) dragToClose(sh);
  document.body.style.overflow = 'hidden';
  onMount?.(sh);
  return sh;
}
export function closeSheet() {
  const e = stack.pop(); if (!e) return;
  e.scrim.classList.add('out'); e.sh.classList.add('out');
  setTimeout(() => { e.scrim.remove(); e.sh.remove(); }, 300);
  if (!stack.length) document.body.style.overflow = '';
  e.onClose?.();
}
export const closeAllSheets = () => { while (stack.length) closeSheet(); };
export const sheetOpen = () => stack.length > 0;

function dragToClose(sh) {
  let y0 = null, dy = 0;
  sh.addEventListener('touchstart', (e) => { if (sh.scrollTop > 0) return; y0 = e.touches[0].clientY; dy = 0; sh.style.transition = 'none'; }, { passive: true });
  sh.addEventListener('touchmove', (e) => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); if (dy > 0) sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
  sh.addEventListener('touchend', () => {
    if (y0 == null) return; y0 = null; sh.style.transition = 'transform .3s cubic-bezier(.2,.8,.2,1)';
    if (dy > 110) { sh.style.transform = 'translateY(100%)'; closeSheet(); } else sh.style.transform = '';
  });
}

// ---------- motion ----------
export function countUp(el, to, { from = 0, dur = 900, format = fmt } = {}) {
  if (!el) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === to) { el.textContent = format(to); return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 4);
    el.textContent = format(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function burst(x, y, n = 18) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cols = ['#2f8cff', '#ff3d8b', '#2eef8a', '#f2f4fa'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i'); s.className = 'spark';
    const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
    s.style.cssText = `left:${x}px;top:${y}px;background:${cols[i % 4]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px;--rot:${Math.random() * 540}deg;${i % 3 ? '' : 'border-radius:50%;'}`;
    document.body.append(s); setTimeout(() => s.remove(), 950);
  }
}
