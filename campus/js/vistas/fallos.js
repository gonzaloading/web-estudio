import { cat } from '../data.js';
import { state, guardar, hoy, uid } from '../store.js';
import * as P from '../progreso.js';
import { inline } from '../md.js';
import { icon, esc, asigIcon, nombreAsig, fechaCorta, opcionesAsig, datosForm, toast, refrescar } from '../ui.js';

export default function fallos(el, r) {
  const ver = r.q.get('ver') === 'recuperado' ? 'recuperado' : 'pendiente';
  const pend = state.fallos.filter(f => f.estado === 'pendiente');
  const rec = state.fallos.filter(f => f.estado === 'recuperado');
  const lista = ver === 'pendiente' ? pend : rec;

  const item = f => {
    const t = f.tema && cat.temas[f.tema];
    return `<div class="fallo">${asigIcon(cat.porId[f.asig], 'peq')}
      <div class="tt">
        <small>${esc(nombreAsig(f.asig))}${t ? ' · ' + esc(t.titulo) : ''} · ${fechaCorta(f.fecha)}${f.veces > 1 ? ` · fallado ${f.veces} veces` : ''}${f.recuperado ? ` · recuperado ${fechaCorta(f.recuperado)}` : ''}</small>
        <b>${inline(f.pregunta)}</b>
        ${f.respuesta ? `<div class="resp">✓ ${inline(f.respuesta)}</div>` : ''}
      </div>
      <div class="acc">
        ${t ? `<a class="btn peq borde" href="#/asignatura/${t.asig}/${t.id}">Ver tema</a>` : ''}
        ${f.estado === 'pendiente'
          ? `<button class="btn peq" data-rec="${f.id}">${icon('check')} Ya lo sé</button>`
          : `<button class="btn peq borde" data-pend="${f.id}">Volver a pendiente</button>`}
        <button class="icon-btn" data-del="${f.id}" title="Borrar">${icon('trash')}</button>
      </div></div>`;
  };

  el.innerHTML = `
  <header class="cab"><h1>Mis fallos</h1>
    <p>Cada vez que marcas <b>Fallé</b> en una tarjeta se guarda aquí. Cuando la aciertes, pasa a recuperados.</p></header>
  <div class="sec-h">
    <div class="tabs"><a href="#/fallos" class="${ver === 'pendiente' ? 'on' : ''}">Pendientes (${pend.length})</a>
      <a href="#/fallos?ver=recuperado" class="${ver === 'recuperado' ? 'on' : ''}">Recuperados (${rec.length})</a></div>
    ${pend.length ? `<a class="btn lima" href="#/repaso?modo=fallos">${icon('refresh')} Repasar fallos</a>` : ''}
  </div>
  <div class="card">${lista.length ? lista.map(item).join('')
    : `<p class="vacio pad">${ver === 'pendiente' ? 'No tienes fallos pendientes. 🎉' : 'Todavía no has recuperado ningún fallo.'}</p>`}</div>

  <details class="card pad mt"><summary><b>${icon('plus')} Apuntar un fallo a mano</b> <span class="tenue">(de un examen, un ejercicio…)</span></summary>
    <form class="form mt" id="f-fallo">
      <label>Asignatura<select name="asig" required>${opcionesAsig()}</select></label>
      <label class="ancho">¿Qué fallaste?<input name="pregunta" required placeholder="Ej.: Usé HAVING sin función de agregado"></label>
      <label class="ancho">Lo correcto es…<input name="respuesta" placeholder="Ej.: Esa condición va en el WHERE"></label>
      <div><button class="btn osc">Guardar fallo</button></div>
    </form>
  </details>`;

  el.onclick = e => {
    const b = e.target.closest('button[data-rec],button[data-pend],button[data-del]');
    if (!b) return;
    const f = state.fallos.find(x => x.id === (b.dataset.rec || b.dataset.pend || b.dataset.del));
    if (!f) return;
    if (b.dataset.rec) { f.estado = 'recuperado'; f.recuperado = hoy(); }
    else if (b.dataset.pend) { f.estado = 'pendiente'; delete f.recuperado; }
    else if (confirm('¿Borrar este fallo del historial?')) state.fallos = state.fallos.filter(x => x !== f);
    guardar(); refrescar();
  };
  el.onsubmit = e => {
    e.preventDefault();
    const d = datosForm(e.target);
    state.fallos.unshift({ id: uid(), asig: d.asig, pregunta: d.pregunta.trim(), respuesta: d.respuesta.trim(), fecha: hoy(), veces: 1, estado: 'pendiente' });
    P.anotar({ tipo: 'fallo', asig: d.asig, texto: d.pregunta.trim() });
    guardar(); toast('Fallo apuntado: entrará en "Revisar fallos"'); refrescar();
  };
}
