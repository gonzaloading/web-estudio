// Cálculo de progreso, repaso espaciado, fallos e historial.
import { cat, todasTarjetas, todosTemas, todasPreguntas } from './data.js';
import { state, guardar, hoy, sumarDias, diasEntre, marcarDia, uid } from './store.js';

export const INTERVALOS = [0, 1, 3, 7, 15, 30, 60]; // días hasta el siguiente repaso según la "caja"
const PESO = { alta: 3, media: 2, baja: 1 };

export const dominada = id => (state.tarjetas[id]?.caja || 0) >= 2; // acertada al menos 2 veces seguidas

// ---------- Teoría vista: cada tema se divide en segmentos; uno está visto al terminar su test ----------
export const segKey = (t, s) => `${t.key}#${s.id}`;
export const segVisto = (t, s) => !!state.leidos[t.key] || !!state.segmentos[segKey(t, s)];
function vistos(temas) {
  let v = 0, n = 0;
  for (const t of temas) { n += t.segs.length; v += t.segs.filter(s => segVisto(t, s)).length; }
  return { v, n };
}
/** % de teoría vista de un tema */
export const pctTema = t => { const { v, n } = vistos([t]); return n ? Math.round(v / n * 100) : 0; };
/** % de teoría vista de una asignatura (o de todo si no se indica) */
export const pctTeoria = asig => { const { v, n } = vistos(todosTemas(asig)); return n ? Math.round(v / n * 100) : 0; };
export const pctAsig = a => pctTeoria(a.id);

export function global() {
  const cards = todasTarjetas();
  return {
    teoria: pctTeoria(),
    dominio: cards.length ? Math.round(cards.filter(c => dominada(c.id)).length / cards.length * 100) : 0,
    test: aciertoTest(),
  };
}

// ---------- Test ----------
/** % de aciertos de todas las respuestas (de una lista de preguntas, o de todas) */
export function aciertoTest(qs) {
  let n = 0, ok = 0;
  const lista = qs ? qs.map(q => state.preguntas[q.id]).filter(Boolean) : Object.values(state.preguntas);
  for (const s of lista) { n += s.n; ok += s.ok; }
  return n ? Math.round(ok / n * 100) : null;
}
/** Resumen de un grupo de preguntas: cuántas hay, cuántas has respondido y cuántas acertaste la última vez */
export function resumenPreguntas(qs) {
  let resp = 0, bien = 0;
  for (const q of qs) { const s = state.preguntas[q.id]; if (s) { resp++; if (s.ultima === 'ok') bien++; } }
  return { total: qs.length, resp, bien, pct: aciertoTest(qs) };
}
export const falladas = (asig, tema) => todasPreguntas(asig, tema).filter(q => state.preguntas[q.id]?.ultima === 'ko');

/** Preguntas para un test: primero las falladas y las nuevas, luego el resto; al final se barajan. */
export function prepararTest({ asig, tema, modo, n }) {
  let qs = todasPreguntas(asig, tema);
  if (modo === 'fallos') qs = qs.filter(q => state.preguntas[q.id]?.ultima === 'ko');
  if (modo === 'nuevas') qs = qs.filter(q => !state.preguntas[q.id]);
  const peso = q => { const s = state.preguntas[q.id]; return (!s ? 1 : s.ultima === 'ko' ? 0 : 2 + s.ok / s.n) + Math.random() * 1.2; };
  return qs.map(q => ({ q, p: peso(q) })).sort((a, b) => a.p - b.p).slice(0, n > 0 ? n : qs.length)
    .map(x => x.q).sort(() => Math.random() - 0.5);
}

/** Registra una respuesta de test (en un segmento o en un test completo). */
export function responder(q, ok) {
  const h = hoy();
  const s = state.preguntas[q.id] || { n: 0, ok: 0 };
  s.n++; if (ok) s.ok++; s.ultima = ok ? 'ok' : 'ko'; s.fecha = h;
  state.preguntas[q.id] = s;
  const d = (state.testDias[h] ||= { n: 0, ok: 0 }); d.n++; if (ok) d.ok++;

  const f = state.fallos.find(f => f.preguntaId === q.id);
  if (!ok) {
    if (f) { f.estado = 'pendiente'; f.veces++; f.fecha = h; delete f.recuperado; }
    else state.fallos.unshift({ id: uid(), preguntaId: q.id, asig: q.asig, tema: q.tema, pregunta: q.q, respuesta: q.ops.find(o => o.ok)?.t || '', fecha: h, veces: 1, estado: 'pendiente' });
  } else if (f?.estado === 'pendiente') { f.estado = 'recuperado'; f.recuperado = h; }

  let e = state.historial.find(e => e.fecha === h && e.tipo === 'test' && e.asig === q.asig);
  if (!e) { e = { id: uid(), fecha: h, tipo: 'test', asig: q.asig, ok: 0, n: 0, delta: 0 }; state.historial.unshift(e); }
  e.n++; if (ok) e.ok++; e.ts = Date.now();
  marcarDia(); guardar();
}

/** Marca un segmento como visto (al terminar su test, o a mano si no tiene test). */
export function verSegmento(t, s, ok = 0, total = 0, si = true) {
  const antes = pctTeoria(t.asig);
  if (si) state.segmentos[segKey(t, s)] = { fecha: hoy(), ok, total };
  else { delete state.segmentos[segKey(t, s)]; delete state.leidos[t.key]; }
  if (si && !state.leidos[t.key] && t.segs.every(x => state.segmentos[segKey(t, x)])) {
    state.leidos[t.key] = hoy();
    state.historial.unshift({ id: uid(), ts: Date.now(), fecha: hoy(), tipo: 'lectura', asig: t.asig, tema: t.key, titulo: t.titulo, delta: 0 });
  }
  const e = state.historial.find(e => e.fecha === hoy() && e.tipo === 'test' && e.asig === t.asig);
  if (e) e.delta = (e.delta || 0) + pctTeoria(t.asig) - antes;
  marcarDia(); guardar();
}

export function guardarTest(datos) {
  state.tests.unshift({ id: uid(), ts: Date.now(), fecha: hoy(), ...datos });
  state.tests = state.tests.slice(0, 300);
  guardar();
}

export function estadoEjercicio(ej, estado) {
  if (estado) state.ejercicios[ej.id] = { estado, fecha: hoy() }; else delete state.ejercicios[ej.id];
  if (estado) { anotar({ tipo: 'ejercicio', asig: ej.asig, texto: ej.titulo, estado }); marcarDia(); }
  guardar();
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
  if (!si) t.segs.forEach(s => delete state.segmentos[segKey(t, s)]);
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

/** Trabajos sin entregar (también los que ya han vencido), ordenados por fecha de entrega. */
export const trabajosPendientes = (n = 99, asig) => state.trabajos
  .filter(t => !t.entregado && (!asig || t.asig === asig))
  .sort((a, b) => (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || ''))).slice(0, n);

/** Exámenes próximos y trabajos pendientes juntos, por fecha. Cada elemento lleva clase: 'examen' | 'trabajo'. */
export const agenda = (n = 99, asig) => [
  ...proximosExamenes(99, asig).map(e => ({ ...e, clase: 'examen' })),
  ...trabajosPendientes(99, asig).map(t => ({ ...t, clase: 'trabajo' })),
].sort((a, b) => (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || ''))).slice(0, n);

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
