// Preguntas de test («elige la correcta»): en cada segmento de teoría y en el apartado Test.
// También los ejercicios prácticos (programación…) que se corrigen con Claude Code.
import { cat } from './data.js';
import { state } from './store.js';
import { inline } from './md.js';
import * as P from './progreso.js';
import { icon, esc, nombreAsig, toast } from './ui.js';

const LETRAS = 'ABCDEF';
export const barajar = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);

/** HTML de una pregunta con las opciones barajadas. */
export function htmlPregunta(q, num = '') {
  return `<div class="pq" data-q="${q.id}">
    <p class="pq-t">${num ? `<span class="pq-n">${num}</span>` : ''}${inline(q.q)}</p>
    <div class="pq-ops">${barajar(q.ops).map((o, k) => `<button type="button" class="op" data-ok="${o.ok ? 1 : 0}"><span class="op-l">${LETRAS[k]}</span><span class="op-t">${inline(o.t)}</span></button>`).join('')}</div>
    <div class="pq-exp" hidden></div></div>`;
}

/** Corrige la opción pulsada: la colorea, muestra la explicación y guarda la respuesta. */
export function corregir(btn) {
  const caja = btn.closest('.pq');
  if (!caja || caja.classList.contains('hecha')) return null;
  const q = cat.preguntas[caja.dataset.q];
  if (!q) return null;
  const ok = btn.dataset.ok === '1';
  caja.classList.add('hecha', ok ? 'acierto' : 'error');
  caja.querySelectorAll('.op').forEach(b => { b.disabled = true; if (b.dataset.ok === '1') b.classList.add('bien'); });
  if (!ok) btn.classList.add('mal');
  const exp = caja.querySelector('.pq-exp');
  exp.innerHTML = `<b>${ok ? '✓ ¡Correcto!' : '✗ La correcta es: ' + inline(q.ops.find(o => o.ok)?.t || '')}</b>${q.exp ? ' ' + inline(q.exp) : ''}`;
  exp.hidden = false;
  P.responder(q, ok);
  return { q, ok };
}

/** Test al final de un segmento de teoría. alCambiar() se llama cuando cambia el progreso. */
export function montarSegmento(box, t, s, alCambiar) {
  if (!box) return;
  const pintar = (repetir = false) => {
    const visto = P.segVisto(t, s), reg = state.segmentos[P.segKey(t, s)];
    if (!s.preguntas.length) {
      box.className = 'quiz sin-test';
      box.innerHTML = `<button class="btn peq ${visto ? 'osc' : 'lima'}" data-seg-ver>${visto ? icon('check') + ' Apartado visto' : 'Marcar este apartado como visto'}</button>`;
      return;
    }
    if (visto && !repetir) {
      box.className = 'quiz visto';
      box.innerHTML = `<div class="quiz-res">${icon('check')}<span><b>Apartado visto</b>${reg?.total ? ` · test ${reg.ok}/${reg.total}` : ''}</span>
        <button class="btn peq borde" data-seg-repetir>Repetir test</button></div>`;
      return;
    }
    box.className = 'quiz';
    box.innerHTML = `<div class="quiz-h">✍️ <b>Test de este apartado</b><span class="tenue">${s.preguntas.length} pregunta${s.preguntas.length > 1 ? 's' : ''} · al terminarlo cuenta como visto</span></div>
      ${s.preguntas.map((q, i) => htmlPregunta(q, i + 1)).join('')}<div class="quiz-fin" hidden></div>`;
  };
  pintar();
  box.onclick = e => {
    if (e.target.closest('[data-seg-repetir]')) { pintar(true); return; }
    if (e.target.closest('[data-seg-ver]')) { P.verSegmento(t, s, 0, 0, !P.segVisto(t, s)); pintar(); alCambiar?.(); return; }
    const op = e.target.closest('.op');
    if (!op || !corregir(op)) return;
    const hechas = box.querySelectorAll('.pq.hecha').length;
    if (hechas < s.preguntas.length) return;
    const ok = box.querySelectorAll('.pq.acierto').length;
    P.verSegmento(t, s, ok, hechas);
    const fin = box.querySelector('.quiz-fin');
    fin.innerHTML = `<b>${ok}/${hechas} aciertos.</b> ${ok === hechas ? '¡Perfecto! Apartado superado.' : 'Apartado visto; las falladas van a «Mis fallos».'}
      <button class="btn peq borde" data-seg-repetir>Repetir</button>`;
    fin.hidden = false;
    alCambiar?.();
  };
}

// ---------- Ejercicios prácticos ----------
const ESTADOS = [['', 'Pendiente'], ['hecho', 'Hecho, sin corregir'], ['correcto', 'Correcto ✓']];
const plano = s => String(s).replace(/\*\*|==|`/g, '');

export function promptEjercicio(ej) {
  return [
    `Corrige mi ejercicio de ${nombreAsig(ej.asig)} (1.º de DAM).`, '',
    `EJERCICIO: ${plano(ej.titulo)}${ej.nivel ? ` (nivel ${ej.nivel})` : ''}`, plano(ej.enunciado), '',
    ...(ej.ejemplos.length ? ['CASOS DE PRUEBA:', ...ej.ejemplos.map(x => '- ' + x), ''] : []),
    'MI SOLUCIÓN: está en mi proyecto de IntelliJ (te digo el archivo) o la pego aquí debajo.', '',
    'Revísala así:',
    '1. Pruébala (o razona) con los casos de prueba y dime claramente si es CORRECTA o NO.',
    '2. Si falla, explícame qué falla y dame una pista, pero no me des la solución completa.',
    '3. Aunque funcione, dime cómo mejorarla: nombres, legibilidad, eficiencia y buenas prácticas.',
    '4. Termina con una nota del 0 al 10.',
  ].join('\n');
}

function copiar(texto) {
  const mostrar = () => {
    const v = document.createElement('div');
    v.className = 'zoom';
    v.innerHTML = `<div class="card pad copia"><b>Copia este texto y pégalo en Claude Code</b><textarea readonly>${esc(texto)}</textarea><button class="btn osc">Cerrar</button></div>`;
    v.onclick = e => { if (e.target === v || e.target.closest('button')) v.remove(); };
    document.body.append(v);
    v.querySelector('textarea').select();
  };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(texto).then(() => toast('Copiado: pégalo en Claude Code junto a tu solución'), mostrar);
  else mostrar();
}

export const htmlEstadoEjercicio = ej => {
  const st = state.ejercicios[ej.id]?.estado || '';
  return `<button type="button" class="btn peq osc" data-ej-copiar="${ej.id}">📋 Copiar para Claude Code</button>
    <label class="ej-est">Estado <select data-ej-estado="${ej.id}">${ESTADOS.map(([v, n]) => `<option value="${v}" ${v === st ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
};

/** Rellena los botones de los ejercicios que haya dentro de el. */
export function pintarEjercicios(el) {
  el.querySelectorAll('.ej-acc[data-ej]').forEach(b => { const ej = cat.ejercicios[b.dataset.ej]; if (ej) b.innerHTML = htmlEstadoEjercicio(ej); });
}
/** Para llamar desde el onclick de la vista. Devuelve true si el clic era de un ejercicio. */
export function clicEjercicio(e) {
  const b = e.target.closest('[data-ej-copiar]');
  if (b) copiar(promptEjercicio(cat.ejercicios[b.dataset.ejCopiar]));
  return !!b;
}
/** Para llamar desde el onchange de la vista. */
export function cambioEjercicio(e) {
  const s = e.target.closest('[data-ej-estado]');
  if (!s) return false;
  P.estadoEjercicio(cat.ejercicios[s.dataset.ejEstado], s.value);
  toast(s.value === 'correcto' ? '¡Ejercicio superado!' : s.value === 'hecho' ? 'Hecho: ahora pásaselo a Claude Code' : 'Ejercicio pendiente');
  return true;
}
