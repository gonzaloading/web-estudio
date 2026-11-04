import { cat } from '../data.js';
import { state, guardar, hoy, uid } from '../store.js';
import * as P from '../progreso.js';
import { icon, esc, asigIcon, nombreAsig, fechaCorta, opcionesAsig, fmtNota, notaCls, datosForm, toast, refrescar } from '../ui.js';

const TIPOS = ['Examen', 'Práctica', 'Trabajo', 'Actividad', 'Exposición'];

export default function notas(el, r) {
  const ex = state.examenes.find(e => e.id === r.q.get('examen'));
  const lista = [...state.notas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const medias = cat.asignaturas.map(a => ({ a, ...P.mediaNotas(a.id) })).filter(m => m.n);
  const general = medias.length ? medias.reduce((s, m) => s + m.media, 0) / medias.length : null;

  el.innerHTML = `
  <header class="cab"><h1>Registro de notas</h1>
    <p>${general !== null ? `Media general: <b>${fmtNota(general)}</b> · ${state.notas.length} nota${state.notas.length > 1 ? 's' : ''}. Si todas las notas de una asignatura tienen peso, la media es ponderada.`
      : 'Apunta tus notas de exámenes, prácticas y trabajos para ver tus medias.'}</p></header>
  ${medias.length ? `<div class="notas-res">${medias.map(m => `<a class="card nota-card" href="#/asignatura/${m.a.id}">
      <div class="asig-top">${asigIcon(m.a, 'peq')}<b>${esc(m.a.nombre)}</b></div>
      <div class="media ${notaCls(m.media)}">${fmtNota(m.media)}</div>
      <small class="tenue">${m.n} nota${m.n > 1 ? 's' : ''}${m.ponderada ? ' · ponderada' : ''}</small></a>`).join('')}</div>` : ''}
  <div class="dos-col">
    <section class="card">${lista.length ? `<div class="tabla"><table class="lista">
      <thead><tr><th>Fecha</th><th>Asignatura</th><th>Concepto</th><th>Tipo</th><th>Peso</th><th>Nota</th><th></th></tr></thead>
      <tbody>${lista.map(n => `<tr><td>${fechaCorta(n.fecha)}</td><td>${esc(nombreAsig(n.asig))}</td><td>${esc(n.concepto)}</td><td>${esc(n.tipo || '')}</td>
        <td>${n.peso ? n.peso + '%' : '—'}</td><td><span class="nota-v ${notaCls(n.nota)}">${fmtNota(n.nota)}</span></td>
        <td><button class="icon-btn" data-del="${n.id}" title="Borrar">${icon('trash')}</button></td></tr>`).join('')}</tbody></table></div>`
      : '<p class="vacio pad">Todavía no hay notas.</p>'}</section>
    <section class="card pad"><h3 class="titulo-sec">${ex ? 'Nota del examen' : 'Añadir nota'}</h3>
      <form class="form" id="f-nota">
        <input type="hidden" name="examen" value="${ex ? ex.id : ''}">
        <label>Asignatura<select name="asig" required>${opcionesAsig(ex?.asig)}</select></label>
        <label>Concepto<input name="concepto" required value="${esc(ex?.titulo || '')}" placeholder="Ej.: Examen T1"></label>
        <label>Tipo<select name="tipo">${TIPOS.map(t => `<option>${t}</option>`).join('')}</select></label>
        <label>Fecha<input type="date" name="fecha" required value="${ex?.fecha || hoy()}"></label>
        <label>Nota (0–10)<input type="number" name="nota" min="0" max="10" step="0.01" required></label>
        <label>Peso % (opcional)<input type="number" name="peso" min="0" max="100" step="1" placeholder="Ej.: 40"></label>
        <div><button class="btn osc">${icon('plus')} Guardar nota</button></div>
      </form></section>
  </div>`;

  el.onclick = e => {
    const b = e.target.closest('[data-del]');
    if (b && confirm('¿Borrar esta nota?')) { state.notas = state.notas.filter(n => n.id !== b.dataset.del); guardar(); refrescar(); }
  };
  el.onsubmit = e => {
    e.preventDefault();
    const d = datosForm(e.target);
    const n = { id: uid(), asig: d.asig, concepto: d.concepto.trim(), tipo: d.tipo, fecha: d.fecha, nota: parseFloat(d.nota), peso: d.peso ? parseFloat(d.peso) : null, examen: d.examen || null };
    state.notas.push(n);
    P.anotar({ tipo: 'nota', asig: n.asig, texto: n.concepto, nota: n.nota });
    guardar(); toast('Nota guardada');
    if (ex) location.hash = '#/notas'; else refrescar();
  };
}
