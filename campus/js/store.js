// Guardado del progreso en este dispositivo (localStorage) + utilidades de fechas.
export const CLAVE = 'gonzaloading-campus-v1';

const base = () => ({
  v: 1,
  leidos: {},      // "asig/tema" -> fecha en que se marcó como estudiado
  tarjetas: {},    // idTarjeta -> { caja, due, veces, fallos, ultima, fecha }
  fallos: [],      // { id, cardId?, asig, tema?, pregunta, respuesta, fecha, veces, estado }
  historial: [],   // { id, ts, fecha, tipo, asig, delta, ... }
  examenes: [],    // { id, asig, titulo, fecha, hora, temas }
  trabajos: [],    // { id, asig, titulo, desc, fecha (de entrega), hora, entregado (fecha o null) }
  notas: [],       // { id, asig, concepto, tipo, fecha, nota, peso, examen? }
  segmentos: {},   // "asig/tema#segmento" -> { fecha, ok, total } (segmento de teoría visto)
  preguntas: {},   // idPregunta de test -> { n, ok, ultima: 'ok' | 'ko', fecha }
  testDias: {},    // fecha -> { n, ok } (todas las preguntas de test respondidas ese día)
  tests: [],       // tests completos: { id, ts, fecha, asig, tema, modo, ok, total }
  ejercicios: {},  // idEjercicio -> { estado: 'hecho' | 'correcto', fecha }
  dias: {},        // fecha -> nº de actividades (para la racha)
  ultimoTema: null,
});

export const state = base();
try { Object.assign(state, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch { /* datos corruptos: se empieza de cero */ }

export const guardar = () => localStorage.setItem(CLAVE, JSON.stringify(state));
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---- fechas (siempre "AAAA-MM-DD" en hora local) ----
const pad = n => String(n).padStart(2, '0');
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hoy = () => iso(new Date());
const aFecha = f => { const [y, m, d] = f.split('-').map(Number); return new Date(y, m - 1, d); };
export const sumarDias = (f, n) => { const d = aFecha(f); d.setDate(d.getDate() + n); return iso(d); };
export const diasEntre = (a, b) => Math.round((aFecha(b) - aFecha(a)) / 864e5);

// ---- racha ----
export function marcarDia() { const h = hoy(); state.dias[h] = (state.dias[h] || 0) + 1; }
export function racha() {
  let d = hoy(), n = 0;
  if (!state.dias[d]) d = sumarDias(d, -1); // si hoy aún no has estudiado, la racha sigue viva
  while (state.dias[d]) { n++; d = sumarDias(d, -1); }
  return n;
}
export function mejorRacha() {
  let best = 0, cur = 0, prev = null;
  for (const d of Object.keys(state.dias).sort()) {
    cur = prev && sumarDias(prev, 1) === d ? cur + 1 : 1;
    best = Math.max(best, cur); prev = d;
  }
  return best;
}

// ---- copia de seguridad ----
export function exportar() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `gonzaloading-progreso-${hoy()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export function importar(texto) {
  const d = JSON.parse(texto);
  if (!d || typeof d !== 'object' || !d.v) throw new Error('El archivo no es una copia de esta web');
  reiniciar(); Object.assign(state, d); guardar();
}
export function reiniciar() {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, base()); guardar();
}
