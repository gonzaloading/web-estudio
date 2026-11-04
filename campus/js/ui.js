// Iconos y piezas de interfaz compartidas.
import { cat, todasTarjetas } from './data.js';
import { state, hoy, diasEntre } from './store.js';
import * as P from './progreso.js';

const PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  calcheck: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  xcircle: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  bars: '<path d="M5 20v-5M12 20V9M19 20V4"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  play: '<path d="m7 4 13 8-13 8z"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  chevl: '<path d="m15 18-6-6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
  code: '<path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16"/>',
  brackets: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  en: '<rect x="2" y="4" width="20" height="16" rx="4"/><text x="12" y="15.6" font-size="8.5" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui,sans-serif">EN</text>',
  grad: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
};

export const icon = (n, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[n] || ''}</svg>`;

export const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const barra = p => `<div class="barra"><i style="width:${Math.max(0, Math.min(100, p || 0))}%"></i></div>`;
export const prio = p => (p ? `<span class="prio ${p}">${p}</span>` : '');
export const nombreAsig = id => cat.porId[id]?.nombre || id || '';
export const asigIcon = (a, cls = '') => {
  a = a || { color: '#6b766f', tint: '#eceee8', icono: 'book' };
  return `<span class="asig-ic ${cls}" style="--c:${a.color};--t:${a.tint}">${icon(a.icono)}</span>`;
};
export const opcionesAsig = (sel = '') =>
  cat.asignaturas.map(a => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('');
export const fmtNota = n => (n == null ? '—' : Number(n).toLocaleString('es-ES', { maximumFractionDigits: 2 }));
export const notaCls = n => (n >= 5 ? 'ok' : 'ko');

// ---- fechas legibles ----
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function fechaCorta(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-').map(Number);
  return `${d} ${MES[m - 1]}.${y !== new Date().getFullYear() ? ' ' + y : ''}`;
}
export function fechaRel(f) {
  const n = diasEntre(f, hoy());
  return n === 0 ? `Hoy, ${fechaCorta(f)}` : n === 1 ? `Ayer, ${fechaCorta(f)}` : fechaCorta(f);
}
export function diasTxt(f) {
  const n = diasEntre(hoy(), f);
  return n === 0 ? 'hoy' : n === 1 ? 'mañana' : n === -1 ? 'ayer' : n < 0 ? `hace ${-n} días` : `en ${n} días`;
}
export function fechaLarga() {
  const s = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return s[0].toUpperCase() + s.slice(1);
}

// ---- componentes ----
export const kpi = (ic, lbl, val, pie = '', cls = '') =>
  `<div class="card kpi"><span class="k-ic ${cls}">${icon(ic)}</span><div><div class="lbl">${lbl}</div><div class="val">${val}</div>${pie}</div></div>`;

export function tarjetaAsig(a, detalle = false) {
  const pct = P.pctAsig(a);
  let meta = '';
  if (detalle) {
    const m = P.mediaNotas(a.id), ex = P.proximosExamenes(1, a.id)[0], tr = P.trabajosPendientes(1, a.id)[0];
    meta = `<div class="meta">${a.temas.length} temas · ${todasTarjetas(a.id).length} tarjetas${m.n ? ` · media ${fmtNota(m.media)}` : ''}${ex ? ` · examen ${diasTxt(ex.fecha)}` : ''}${tr ? ` · entrega ${diasTxt(tr.fecha)}` : ''}</div>`;
  }
  return `<a class="card asig" href="#/asignatura/${a.id}">
    <div class="asig-top">${asigIcon(a)}<b>${esc(a.nombre)}</b></div>
    <div class="asig-pr">${barra(pct)}<span>${pct}%</span></div>${meta}
    <div class="ver">${a.temas.length ? 'Ver temas' : 'Sin temas todavía'} ${icon('chev')}</div></a>`;
}

export function filaTema(t, conAsig = false) {
  const cs = t.cards, leido = !!state.leidos[t.key];
  const dom = cs.length ? Math.round(cs.filter(c => P.dominada(c.id)).length / cs.length * 100) : null;
  const a = cat.porId[t.asig];
  return `<a class="tema-r" href="#/asignatura/${t.asig}/${t.id}">
    ${conAsig ? asigIcon(a, 'peq') : ''}
    <span class="num ${leido ? 'ok' : ''}">${leido ? icon('check') : t.n}</span>
    <div class="tt"><b>${esc(t.titulo)}</b><small>${conAsig ? esc(a.nombre) + ' · ' : ''}${cs.length} tarjetas${dom !== null ? ` · ${dom}% dominado` : ''}${t.actualizado ? ` · act. ${fechaCorta(t.actualizado)}` : ''}</small></div>
    ${prio(t.prioridad)}${icon('chev')}</a>`;
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 2400);
}
export const refrescar = () => dispatchEvent(new Event('refrescar'));
export const datosForm = f => Object.fromEntries(new FormData(f));
