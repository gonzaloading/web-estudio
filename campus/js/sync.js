// Sincronización del progreso entre dispositivos (Mac, iPhone…) con un gist privado de GitHub.
// Cada dispositivo guarda su progreso en localStorage como siempre; este módulo lo une con el del gist:
//  - Al abrir la app, al volver a ella y tras cada cambio (agrupando cambios seguidos).
//  - La unión es "a tres bandas": compara cada dato con la última versión sincronizada (la base) para saber
//    qué ha cambiado en este dispositivo y qué en el otro, así no se pierde nada aunque se estudie sin conexión.
//  - Los mapas (leidos, tarjetas…) se unen entrada a entrada y las listas por su `id` (por eso toda lista
//    del progreso debe tener `id` en cada elemento).
import { state, guardarLocal, completarEstado } from './store.js';

const CFG_KEY = 'gonzaloading-sync';        // { token, gist, ultima } solo en este dispositivo
const BASE_KEY = 'gonzaloading-sync-base';  // copia de lo último sincronizado
const ARCHIVO = 'mi-campus-progreso.json';
// Para probar en local se puede apuntar a un servidor falso (solo en 127.0.0.1 / localhost)
const API = (/^(127\.0\.0\.1|localhost)$/.test(location.hostname) && localStorage.getItem('gonzaloading-sync-api')) || 'https://api.github.com';
export const URL_CLAVE = 'https://github.com/settings/tokens/new?scopes=gist&description=Mi%20campus%20(sincronizar)';

let cfg = null;
try { cfg = JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); } catch { /* sin configurar */ }
if (!cfg?.token || !cfg?.gist) cfg = null;
const guardarCfg = () => localStorage.setItem(CFG_KEY, JSON.stringify(cfg));

// ---- estado visible (menú lateral y Ajustes) ----
const est = { fase: cfg ? 'ok' : 'off', error: '' };
export const conectado = () => !!cfg;
export function textoEstado() {
  if (!cfg) return 'Tu progreso se guarda en este dispositivo.';
  if (est.fase === 'sincronizando') return 'Sincronizando…';
  if (est.fase === 'sinred') return 'Sin conexión: se sincronizará al volver.';
  if (est.fase === 'error') return 'No se pudo sincronizar.';
  if (!cfg.ultima) return 'Sincronización activada.';
  const d = new Date(cfg.ultima), hoyMismo = d.toDateString() === new Date().toDateString();
  const h = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `Sincronizado ${hoyMismo ? 'a las ' + h : 'el ' + d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ', ' + h}.`;
}
export const errorSync = () => (est.fase === 'error' ? est.error : '');
function ponerFase(f, error = '') {
  est.fase = f; est.error = error;
  document.querySelectorAll('[data-sync-estado]').forEach(n => {
    n.textContent = textoEstado();
    n.title = error;
    n.classList.toggle('sync-mal', f === 'error');
  });
  document.querySelectorAll('[data-sync-error]').forEach(n => (n.textContent = error));
}

// ---- GitHub ----
async function gh(ruta, opts = {}) {
  let res;
  try {
    res = await fetch(API + ruta, {
      ...opts, cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${cfg.token}`, ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
    });
  } catch { const e = new Error('Sin conexión a internet.'); e.sinRed = true; throw e; }
  if (!res.ok) {
    const e = new Error(res.status === 401 ? 'La clave no es válida o ha caducado. Crea otra y vuelve a conectar.'
      : res.status === 403 || res.status === 429 ? 'GitHub ha rechazado la petición (revisa que la clave tenga el permiso «gist» o espera un poco).'
      : res.status === 404 ? 'No se encuentra el gist de sincronización.' : `GitHub respondió con un error (${res.status}).`);
    e.status = res.status; throw e;
  }
  return res.json();
}
async function buscarGist() {
  for (let p = 1; p <= 5; p++) {
    const l = await gh(`/gists?per_page=100&page=${p}`);
    const g = l.find(x => x.files && x.files[ARCHIVO]);
    if (g) return g.id;
    if (l.length < 100) break;
  }
  return null;
}
const crearGist = async contenido => (await gh('/gists', {
  method: 'POST',
  body: JSON.stringify({ description: 'Mi campus · progreso sincronizado (no borrar)', public: false, files: { [ARCHIVO]: { content: contenido } } }),
})).id;
async function leerRemoto() {
  const f = (await gh(`/gists/${cfg.gist}`)).files?.[ARCHIVO];
  if (!f) return null;
  const txt = f.truncated ? await (await fetch(f.raw_url, { cache: 'no-store' })).text() : f.content;
  return JSON.parse(txt);
}
// Si la app se cierra a mitad de envío no se pierde nada: lo pendiente se sube en la siguiente sincronización
const escribirRemoto = datos => gh(`/gists/${cfg.gist}`, { method: 'PATCH', body: JSON.stringify({ files: { [ARCHIVO]: { content: JSON.stringify(datos) } } }) });

// ---- unión a tres bandas ----
const esObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
const conId = a => Array.isArray(a) && a.every(x => esObj(x) && 'id' in x);
// JSON con las claves ordenadas, para comparar sin que importe el orden
const canon = x => JSON.stringify(x, (k, v) => (esObj(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : v));
const igual = (a, b) => a === b || canon(a) === canon(b);

// Si los dos dispositivos cambiaron lo mismo: el más reciente (ts, ultima, fecha) o el número más alto; si no, el de aquí.
function elegir(l, r) {
  if (l === undefined) return r;
  if (r === undefined) return l;
  if (typeof l === 'number' && typeof r === 'number') return Math.max(l, r);
  const m = x => (esObj(x) ? x.ts ?? x.ultima ?? x.fecha ?? x.n : undefined);
  const ml = m(l), mr = m(r);
  return mr !== undefined && (ml === undefined || mr > ml) ? r : l;
}
function valor3(b, l, r, nivel) {
  if (igual(l, r)) return l;
  if (igual(l, b)) return r; // solo cambió en el otro dispositivo (o se borró allí)
  if (igual(r, b)) return l; // solo cambió aquí
  if (nivel > 0 && esObj(l) && esObj(r)) return mapa3(esObj(b) ? b : {}, l, r, nivel - 1);
  if (nivel > 0 && conId(l) && conId(r)) return lista3(conId(b) ? b : [], l, r);
  return elegir(l, r);
}
function mapa3(b, l, r, nivel) {
  const out = {};
  for (const k of new Set([...Object.keys(r), ...Object.keys(l)])) {
    const v = valor3(b[k], l[k], r[k], nivel);
    if (v !== undefined) out[k] = v;
  }
  return out;
}
function lista3(b, l, r) {
  const porId = a => new Map(a.map(x => [x.id, x]));
  const B = porId(b), L = porId(l), R = porId(r), out = [];
  for (const x of l) { const v = valor3(B.get(x.id), x, R.get(x.id), 0); if (v !== undefined) out.push(v); }
  // lo nuevo del otro dispositivo, en la misma posición que allí (el historial va de nuevo a viejo)
  r.forEach((x, i) => {
    if (L.has(x.id)) return;
    const v = valor3(B.get(x.id), undefined, x, 0);
    if (v !== undefined) out.splice(Math.min(i, out.length), 0, v);
  });
  return out;
}
export const fusionar = (base, local, remoto) => mapa3(base || {}, local, remoto, 1);

// ---- sincronizar ----
const leerBase = () => { try { return JSON.parse(localStorage.getItem(BASE_KEY) || 'null'); } catch { return null; } };
function aplicar(nuevo) {
  let cambio = false;
  for (const k of Object.keys(state)) if (!(k in nuevo)) { delete state[k]; cambio = true; }
  for (const [k, v] of Object.entries(nuevo)) if (!igual(state[k], v)) { state[k] = v; cambio = true; }
  completarEstado();
  if (cambio) guardarLocal();
  return cambio;
}
// Repinta la vista si llegó progreso del otro dispositivo, salvo en mitad de un test o un repaso, o escribiendo
function avisarCambios() {
  const r = location.hash;
  if (/^#\/(test\/hacer|repaso)/.test(r) || document.activeElement?.matches?.('input, textarea, select')) return;
  dispatchEvent(new Event('refrescar'));
}

let enCurso = null, otraVez = false;
export function sincronizar() {
  if (!cfg) return Promise.resolve();
  if (enCurso) { otraVez = true; return enCurso; }
  ponerFase('sincronizando');
  enCurso = (async () => {
    try {
      do {
        otraVez = false;
        let remoto;
        try { remoto = await leerRemoto(); }
        catch (e) { if (e.status !== 404) throw e; cfg.gist = (await buscarGist()) || (await crearGist(JSON.stringify(state))); guardarCfg(); remoto = await leerRemoto(); }
        const unido = remoto ? fusionar(leerBase(), JSON.parse(JSON.stringify(state)), remoto) : JSON.parse(JSON.stringify(state));
        const cambioAqui = aplicar(unido);
        if (!remoto || !igual(unido, remoto)) await escribirRemoto(unido);
        localStorage.setItem(BASE_KEY, JSON.stringify(unido));
        if (cambioAqui) avisarCambios();
      } while (otraVez);
      cfg.ultima = Date.now(); guardarCfg();
      ponerFase('ok');
    } catch (e) {
      console.warn('Sincronización:', e);
      ponerFase(e.sinRed ? 'sinred' : 'error', e.message);
    } finally { enCurso = null; }
  })();
  return enCurso;
}

// Envía los cambios como mucho cada 15 s (GitHub limita cuántas veces se puede guardar por hora)
let tPend = null;
function programar(ms) {
  if (!cfg) return;
  if (ms === 0 || !tPend) { clearTimeout(tPend); tPend = setTimeout(() => { tPend = null; sincronizar(); }, ms); }
}

export async function conectar(token) {
  const prev = cfg;
  cfg = { token: token.trim() };
  try {
    cfg.gist = (await buscarGist()) || (await crearGist(JSON.stringify(state)));
    localStorage.removeItem(BASE_KEY); // primera vez en este dispositivo: se une todo lo de aquí con lo del gist
    guardarCfg();
    await sincronizar();
    if (est.fase !== 'ok') throw new Error(est.error || 'No se pudo sincronizar.');
  } catch (e) {
    cfg = prev;
    if (prev) guardarCfg(); else { localStorage.removeItem(CFG_KEY); localStorage.removeItem(BASE_KEY); }
    ponerFase(prev ? 'ok' : 'off');
    throw e;
  }
}
export function desconectar() {
  cfg = null; clearTimeout(tPend); tPend = null;
  localStorage.removeItem(CFG_KEY); localStorage.removeItem(BASE_KEY);
  ponerFase('off');
}
export const claveActual = () => cfg?.token || '';

let ultimaVuelta = 0;
export function iniciarSync() {
  addEventListener('progreso-guardado', () => programar(15000));
  const alVolver = () => { if (Date.now() - ultimaVuelta > 20000) { ultimaVuelta = Date.now(); programar(0); } };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') alVolver();
    else if (tPend) { clearTimeout(tPend); tPend = null; sincronizar(); } // se va de la app: envía ya lo pendiente
  });
  addEventListener('focus', alVolver);
  addEventListener('online', () => programar(0));
  setInterval(() => { if (document.visibilityState === 'visible') programar(0); }, 5 * 60000);
  ponerFase(est.fase);
  programar(0);
}
