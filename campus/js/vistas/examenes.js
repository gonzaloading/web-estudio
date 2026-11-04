import { cat } from '../data.js';
import { state, guardar, hoy, iso, sumarDias, diasEntre, uid } from '../store.js';
import * as P from '../progreso.js';
import { icon, esc, asigIcon, nombreAsig, fechaCorta, diasTxt, opcionesAsig, fmtNota, notaCls, datosForm, toast, refrescar } from '../ui.js';

export default function examenes(el, r) {
  const mes = /^\d{4}-\d{2}$/.test(r.q.get('mes') || '') ? r.q.get('mes') : hoy().slice(0, 7);
  const [y, m] = mes.split('-').map(Number);
  const primero = new Date(y, m - 1, 1);
  const ini = sumarDias(iso(primero), -((primero.getDay() + 6) % 7));
  let dias = Array.from({ length: 42 }, (_, k) => sumarDias(ini, k));
  if (dias[35].slice(0, 7) !== mes) dias = dias.slice(0, 35);
  const porDia = {};
  for (const e of state.examenes) (porDia[e.fecha] ||= []).push(e);
  const prevM = iso(new Date(y, m - 2, 1)).slice(0, 7), nextM = iso(new Date(y, m, 1)).slice(0, 7);
  const t0 = primero.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }), titulo = t0[0].toUpperCase() + t0.slice(1);
  const prox = P.proximosExamenes();
  const pasados = state.examenes.filter(e => e.fecha < hoy()).sort((a, b) => b.fecha.localeCompare(a.fecha));

  const item = (e, pasado) => {
    const nota = state.notas.find(n => n.examen === e.id);
    return `<div class="it">${asigIcon(cat.porId[e.asig], 'peq')}
      <div class="tt"><b>${esc(e.titulo)}</b><small>${esc(nombreAsig(e.asig))} · ${fechaCorta(e.fecha)}${e.hora ? ' · ' + e.hora : ''}${e.temas ? ' · ' + esc(e.temas) : ''}</small></div>
      ${pasado
        ? (nota ? `<span class="nota-v ${notaCls(nota.nota)}">${fmtNota(nota.nota)}</span>` : `<a class="btn peq lima" href="#/notas?examen=${e.id}">Poner nota</a>`)
        : `<span class="cuenta ${diasEntre(hoy(), e.fecha) <= 7 ? 'urg' : ''}">${diasTxt(e.fecha)}</span>`}
      <button class="icon-btn" data-del="${e.id}" title="Borrar">${icon('trash')}</button></div>`;
  };

  el.innerHTML = `
  <header class="cab"><h1>Calendario de exámenes</h1>
    <p>${prox.length ? `Tienes ${prox.length} examen${prox.length > 1 ? 'es' : ''} por delante. El más cercano: <b>${esc(prox[0].titulo)}</b> (${esc(nombreAsig(prox[0].asig))}) ${diasTxt(prox[0].fecha)}.`
      : 'Apunta tus exámenes: verás la cuenta atrás y "Continuar estudiando" priorizará esas asignaturas.'}</p></header>
  <div class="dos-col">
    <section class="card pad">
      <div class="cal-h"><a class="icon-btn" href="#/examenes?mes=${prevM}" title="Mes anterior">${icon('chevl')}</a>
        <h3>${titulo}</h3><a class="icon-btn" href="#/examenes?mes=${nextM}" title="Mes siguiente">${icon('chev')}</a></div>
      <div class="cal">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<div class="dn">${d}</div>`).join('')}
        ${dias.map(f => `<div class="d ${f.slice(0, 7) !== mes ? 'fuera' : ''} ${f === hoy() ? 'hoy' : ''}"><span class="num">${+f.slice(8)}</span>
          ${(porDia[f] || []).map(e => { const a = cat.porId[e.asig] || {}; return `<span class="ev" style="--c:${a.color};--t:${a.tint}" title="${esc(nombreAsig(e.asig))}: ${esc(e.titulo)}">${e.hora ? e.hora + ' ' : ''}${esc(e.titulo)}</span>`; }).join('')}
        </div>`).join('')}
      </div>
    </section>
    <div class="col">
      <section class="card pad"><h3 class="titulo-sec">Añadir examen</h3>
        <form class="form" id="f-ex">
          <label>Asignatura<select name="asig" required>${opcionesAsig()}</select></label>
          <label>Título<input name="titulo" required placeholder="Ej.: Examen T1–T3"></label>
          <label>Fecha<input type="date" name="fecha" required value="${hoy()}"></label>
          <label>Hora<input type="time" name="hora"></label>
          <label class="ancho">Temas que entran<input name="temas" placeholder="Ej.: Temas 1, 2 y 3"></label>
          <div><button class="btn osc">${icon('plus')} Guardar examen</button></div>
        </form></section>
      <section class="card pad mini-lista"><h3 class="titulo-sec">Próximos</h3>${prox.length ? prox.map(e => item(e)).join('') : '<p class="vacio">Sin exámenes próximos.</p>'}</section>
    </div>
  </div>
  ${pasados.length ? `<section class="card pad mt mini-lista"><h3 class="titulo-sec">Ya realizados</h3>${pasados.map(e => item(e, true)).join('')}</section>` : ''}`;

  el.onclick = e => {
    const b = e.target.closest('[data-del]');
    if (b && confirm('¿Borrar este examen?')) { state.examenes = state.examenes.filter(x => x.id !== b.dataset.del); guardar(); refrescar(); }
  };
  el.onsubmit = e => {
    e.preventDefault();
    const d = datosForm(e.target);
    const ex = { id: uid(), asig: d.asig, titulo: d.titulo.trim(), fecha: d.fecha, hora: d.hora, temas: d.temas.trim() };
    state.examenes.push(ex);
    P.anotar({ tipo: 'examen', asig: ex.asig, texto: `${ex.titulo} (${fechaCorta(ex.fecha)})` });
    guardar(); toast('Examen guardado');
    const destino = `#/examenes?mes=${ex.fecha.slice(0, 7)}`;
    if (location.hash !== destino) location.hash = destino; else refrescar();
  };
}
