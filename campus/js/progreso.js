// Cálculo de progreso, repaso espaciado, fallos e historial.
import { cat, todasTarjetas, todosTemas } from './data.js';
import { state, guardar, hoy, sumarDias, diasEntre, marcarDia, uid } from './store.js';

export const INTERVALOS = [0, 1, 3, 7, 15, 30, 60]; // días hasta el siguiente repaso según la "caja"
const PESO = { alta: 3, media: 2, baja: 1 };

export const dominada = id => (state.tarjetas[id]?.caja || 0) >= 2; // acertada al menos 2 veces seguidas

export function pctAsig(a) {
  if (!a?.temas.length) return 0;
  const leidos = a.temas.filter(t => state.leidos[t.key]).length / a.temas.length;
  const cards = todasTarjetas(a.id);
  if (!cards.length) return Math.round(leidos * 100);
  const dom = cards.filter(c => dominada(c.id)).length / cards.length;
  return Math.round((leidos + dom) * 50);
}

export function global() {
  const temas = todosTemas(), cards = todasTarjetas();
  return {
    teoria: temas.length ? Math.round(temas.filter(t => state.leidos[t.key]).length / temas.length * 100) : 0,
    dominio: cards.length ? Math.round(cards.filter(c => dominada(c.id)).length / cards.length * 100) : 0,
  };
}

/** Una tarjeta toca hoy si su fecha de repaso ya llegó, o si es nueva y su tema ya está estudiado. */
export function pendiente(c) {
  const s = state.tarjetas[c.id];
  return s ? s.due <= hoy() : !!state.leidos[c.tema];
}
export const pendientesHoy = asig => todasTarjetas(asig).filter(pendiente);

export function prevision(n, asig) {
  const cards = todasTarjetas(asig), h = hoy();
  return Array.from({ length: n }, (_, k) => {
    const f = sumarDias(h, k);
    return { fecha: f, n: k === 0 ? cards.filter(pendiente).length : cards.filter(c => state.tarjetas[c.id]?.due === f).length };
  });
}

export function colaRepaso(modo, asig) {
  if (modo === 'fallos') {
    const porId = new Map(todasTarjetas().map(c => [c.id, c]));
    return state.fallos.filter(f => f.estado === 'pendiente' && (!asig || f.asig === asig))
      .map(f => (f.cardId && porId.get(f.cardId)) ||
        { id: 'm-' + f.id, manual: f.id, q: f.pregunta, a: f.respuesta || '—', asig: f.asig, temaTitulo: '' });
  }
  if (modo === 'practicar') {
    let cards = todasTarjetas(asig);
    const estudiadas = cards.filter(c => state.leidos[c.tema]);
    if (estudiadas.length >= 5) cards = estudiadas;
    return cards
      .map(c => ({ c, s: (state.tarjetas[c.id]?.caja || 0) * 2 - (PESO[cat.temas[c.tema]?.prioridad] || 2) + Math.random() * 3 }))
      .sort((x, y) => x.s - y.s).slice(0, 10).map(x => x.c);
  }
  return pendientesHoy(asig).sort((x, y) => (state.tarjetas[x.id]?.due || '9').localeCompare(state.tarjetas[y.id]?.due || '9'));
}

function registrarRepaso(asig, r, delta) {
  const h = hoy();
  let e = state.historial.find(e => e.fecha === h && e.tipo === 'repaso' && e.asig === asig);
  if (!e) { e = { id: uid(), fecha: h, tipo: 'repaso', asig, bien: 0, dude: 0, falle: 0, delta: 0 }; state.historial.unshift(e); }
  e[r]++; e.delta += delta; e.ts = Date.now();
  marcarDia();
}

/** r = 'bien' | 'dude' | 'falle' */
export function calificar(card, r) {
  if (card.manual) {
    const f = state.fallos.find(f => f.id === card.manual);
    if (f && r === 'bien') { f.estado = 'recuperado'; f.recuperado = hoy(); }
    if (f && r === 'falle') f.veces++;
    registrarRepaso(card.asig, r, 0); guardar(); return;
  }
  const a = cat.porId[card.asig], antes = pctAsig(a);
  const s = state.tarjetas[card.id] || { caja: 0, veces: 0, fallos: 0 };
  if (r === 'bien') { s.caja = Math.min(s.caja + 1, 6); s.due = sumarDias(hoy(), INTERVALOS[s.caja]); }
  else if (r === 'dude') { s.caja = Math.max(1, s.caja); s.due = sumarDias(hoy(), Math.max(1, Math.floor(INTERVALOS[s.caja] / 2))); }
  else { s.caja = 0; s.fallos++; s.due = sumarDias(hoy(), 1); }
  s.veces++; s.ultima = r; s.fecha = hoy();
  state.tarjetas[card.id] = s;

  const f = state.fallos.find(f => f.cardId === card.id);
  if (r === 'falle') {
    if (f) { f.estado = 'pendiente'; f.veces++; f.fecha = hoy(); }
    else state.fallos.unshift({ id: uid(), cardId: card.id, asig: card.asig, tema: card.tema, pregunta: card.q, respuesta: card.a, fecha: hoy(), veces: 1, estado: 'pendiente' });
  } else if (r === 'bien' && f?.estado === 'pendiente') { f.estado = 'recuperado'; f.recuperado = hoy(); }

  registrarRepaso(card.asig, r, pctAsig(a) - antes);
  guardar();
}

export function marcarLeido(t, si) {
  const a = cat.porId[t.asig], antes = pctAsig(a);
  if (si) state.leidos[t.key] = hoy(); else delete state.leidos[t.key];
  state.historial = state.historial.filter(e => !(e.tipo === 'lectura' && e.tema === t.key && e.fecha === hoy()));
  if (si) {
    state.historial.unshift({ id: uid(), ts: Date.now(), fecha: hoy(), tipo: 'lectura', asig: t.asig, tema: t.key, titulo: t.titulo, delta: pctAsig(a) - antes });
    marcarDia();
  }
  guardar();
}

/** Apunta en el historial algo que no cuenta para la racha (notas, exámenes, fallos manuales). */
export const anotar = e => state.historial.unshift({ id: uid(), ts: Date.now(), fecha: hoy(), delta: 0, ...e });

export function resumenDias(n = 9999) {
  const mapa = new Map();
  for (const e of state.historial) { if (!mapa.has(e.fecha)) mapa.set(e.fecha, []); mapa.get(e.fecha).push(e); }
  return [...mapa.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, n).map(([fecha, items]) => ({
    fecha,
    items: items.sort((x, y) => (y.ts || 0) - (x.ts || 0)),
    asigs: [...new Set(items.map(i => i.asig))],
    delta: items.reduce((s, i) => s + (i.delta || 0), 0),
  }));
}

export const proximosExamenes = (n = 99, asig) => state.examenes
  .filter(e => e.fecha >= hoy() && (!asig || e.asig === asig))
  .sort((a, b) => (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || ''))).slice(0, n);

export function mediaNotas(asig) {
  const ns = state.notas.filter(n => n.asig === asig);
  if (!ns.length) return { media: null, n: 0 };
  const ponderada = ns.every(n => +n.peso > 0);
  const media = ponderada
    ? ns.reduce((s, n) => s + n.nota * n.peso, 0) / ns.reduce((s, n) => s + +n.peso, 0)
    : ns.reduce((s, n) => s + n.nota, 0) / ns.length;
  return { media, n: ns.length, ponderada };
}

/** Tema recomendado para "Continuar estudiando": prioridad + cercanía de examen. */
export function siguienteTema() {
  const u = state.ultimoTema && cat.temas[state.ultimoTema];
  if (u && !state.leidos[u.key]) return u;
  const exs = proximosExamenes();
  let mejor = null, max = -Infinity;
  for (const t of todosTemas()) {
    if (state.leidos[t.key]) continue;
    let s = PESO[t.prioridad] || 2;
    const ex = exs.find(e => e.asig === t.asig);
    if (ex) { const d = diasEntre(hoy(), ex.fecha); if (d <= 30) s += (30 - d) / 6; }
    s -= t.n * 0.01;
    if (s > max) { max = s; mejor = t; }
  }
  return mejor;
}
