// Exámenes y trabajos: calendario, cuenta atrás y entregas.
import { cat } from '../data.js';
import { state, guardar, hoy, iso, sumarDias, diasEntre, uid } from '../store.js';
import * as P from '../progreso.js';
import { icon, esc, asigIcon, nombreAsig, fechaCorta, diasTxt, opcionesAsig, fmtNota, notaCls, datosForm, toast, refrescar } from '../ui.js';

const orden = (a, b) => (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || ''));

export default function examenes(el, r) {
  const mes = /^\d{4}-\d{2}$/.test(r.q.get('mes') || '') ? r.q.get('mes') : hoy().slice(0, 7);
  const tipo = r.q.get('tipo') === 'trabajo' ? 'trabajo' : 'examen';
  const [y, m] = mes.split('-').map(Number);
  const primero = new Date(y, m - 1, 1);
  const ini = sumarDias(iso(primero), -((primero.getDay() + 6) % 7));
  let dias = Array.from({ length: 42 }, (_, k) => sumarDias(ini, k));
  if (dias[35].slice(0, 7) !== mes) dias = dias.slice(0, 35);
  const porDia = {};
  for (const e of state.examenes) (porDia[e.fecha] ||= []).push({ ...e, clase: 'examen' });
  for (const t of state.trabajos) (porDia[t.fecha] ||= []).push({ ...t, clase: 'trabajo' });
  Object.values(porDia).forEach(l => l.sort(orden));
  const prevM = iso(new Date(y, m - 2, 1)).slice(0, 7), nextM = iso(new Date(y, m, 1)).slice(0, 7);
  const t0 = primero.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }), titulo = t0[0].toUpperCase() + t0.slice(1);

  const prox = P.agenda();
  const proxEx = prox.filter(e => e.clase === 'examen'), proxTr = prox.filter(e => e.clase === 'trabajo');
  const hechos = [
    ...state.examenes.filter(e => e.fecha < hoy()).map(e => ({ ...e, clase: 'examen' })),
    ...state.trabajos.filter(t => t.entregado).map(t => ({ ...t, clase: 'trabajo' })),
  ].sort((a, b) => orden(b, a));

  const item = (e, hecho) => {
    const tr = e.clase === 'trabajo', nota = state.notas.find(n => n.examen === e.id);
    const vencido = tr && !e.entregado && e.fecha < hoy();
    const der = hecho
      ? (nota ? `<span class="nota-v ${notaCls(nota.nota)}">${fmtNota(nota.nota)}</span>` : `<a class="btn peq lima" href="#/notas?examen=${e.id}">Poner nota</a>`)
      : `<span class="cuenta ${vencido || diasEntre(hoy(), e.fecha) <= 7 ? 'urg' : ''}">${vencido ? 'Venció ' + diasTxt(e.fecha) : diasTxt(e.fecha)}</span>`;
    return `<div class="it">${asigIcon(cat.porId[e.asig], 'peq')}
      <div class="tt"><span class="chip-tipo ${e.clase}">${tr ? 'Trabajo' : 'Examen'}</span><b>${esc(e.titulo)}</b>
        <small>${esc(nombreAsig(e.asig))} · ${tr ? 'entrega ' : ''}${fechaCorta(e.fecha)}${e.hora ? ' · ' + e.hora : ''}${!tr && e.temas ? ' · ' + esc(e.temas) : ''}${tr && e.entregado ? ' · entregado el ' + fechaCorta(e.entregado) : ''}</small>
        ${tr && e.desc ? `<p class="desc">${esc(e.desc)}</p>` : ''}</div>
      ${der}
      ${tr ? `<button class="icon-btn ${e.entregado ? '' : 'entregar'}" data-entregar="${e.id}" title="${e.entregado ? 'Volver a pendiente' : 'Marcar como entregado'}">${icon(e.entregado ? 'refresh' : 'check')}</button>` : ''}
      <button class="icon-btn" data-del="${e.id}" data-clase="${e.clase}" title="Borrar">${icon('trash')}</button></div>`;
  };

  const resumen = [
    proxEx[0] ? `Próximo examen: <b>${esc(proxEx[0].titulo)}</b> (${esc(nombreAsig(proxEx[0].asig))}) ${diasTxt(proxEx[0].fecha)}.` : '',
    proxTr[0] ? `${proxTr.length} trabajo${proxTr.length > 1 ? 's' : ''} por entregar; el siguiente, <b>${esc(proxTr[0].titulo)}</b>, ${proxTr[0].fecha < hoy() ? 'venció ' : ''}${diasTxt(proxTr[0].fecha)}.` : '',
  ].filter(Boolean).join(' ') || 'Apunta tus exámenes y los trabajos que tienes que entregar: verás la cuenta atrás de cada uno.';

  el.innerHTML = `
  <header class="cab"><h1>Exámenes y trabajos</h1><p>${resumen}</p></header>
  <div class="dos-col">
    <section class="card pad">
      <div class="cal-h"><a class="icon-btn" href="#/examenes?mes=${prevM}" title="Mes anterior">${icon('chevl')}</a>
        <h3>${titulo}</h3><a class="icon-btn" href="#/examenes?mes=${nextM}" title="Mes siguiente">${icon('chev')}</a></div>
      <div class="cal">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<div class="dn">${d}</div>`).join('')}
        ${dias.map(f => `<div class="d ${f.slice(0, 7) !== mes ? 'fuera' : ''} ${f === hoy() ? 'hoy' : ''}"><span class="num">${+f.slice(8)}</span>
          ${(porDia[f] || []).map(e => {
            const a = cat.porId[e.asig] || {}, tr = e.clase === 'trabajo';
            return `<span class="ev ${tr ? 'trab' : ''} ${e.entregado ? 'hecho' : ''}" style="--c:${a.color};--t:${a.tint}" title="${tr ? 'Entrega' : 'Examen'} · ${esc(nombreAsig(e.asig))}: ${esc(e.titulo)}">${e.hora ? e.hora + ' ' : ''}${esc(e.titulo)}</span>`;
          }).join('')}
        </div>`).join('')}
      </div>
      <div class="cal-ley"><span><i class="sw ex"></i>Examen</span><span><i class="sw tr"></i>Entrega de trabajo</span><span><i class="sw tr hecho"></i>Entregado</span></div>
    </section>
    <div class="col">
      <section class="card pad"><h3 class="titulo-sec">Añadir</h3>
        <form class="form" id="f-ag" data-tipo="${tipo}">
          <div class="seg ancho">
            <label><input type="radio" name="tipo" value="examen" ${tipo === 'examen' ? 'checked' : ''}>Examen</label>
            <label><input type="radio" name="tipo" value="trabajo" ${tipo === 'trabajo' ? 'checked' : ''}>Trabajo</label>
          </div>
          <label>Asignatura<select name="asig" required>${opcionesAsig()}</select></label>
          <label>Título<input name="titulo" required placeholder="${tipo === 'trabajo' ? 'Ej.: Práctica 2' : 'Ej.: Examen T1–T3'}"></label>
          <label class="ancho solo-tr">Descripción<textarea name="desc" rows="3" placeholder="Qué hay que entregar, formato, dónde se sube…"></textarea></label>
          <label><span class="solo-ex">Fecha</span><span class="solo-tr">Fecha de entrega</span><input type="date" name="fecha" required value="${hoy()}"></label>
          <label><span class="solo-ex">Hora</span><span class="solo-tr">Hora límite</span><input type="time" name="hora"></label>
          <label class="ancho solo-ex">Temas que entran<input name="temas" placeholder="Ej.: Temas 1, 2 y 3"></label>
          <div><button class="btn osc">${icon('plus')} <span class="solo-ex">Guardar examen</span><span class="solo-tr">Guardar trabajo</span></button></div>
        </form></section>
      <section class="card pad mini-lista"><h3 class="titulo-sec">Próximos</h3>${prox.length ? prox.map(e => item(e)).join('') : '<p class="vacio">Nada pendiente.</p>'}</section>
    </div>
  </div>
  ${hechos.length ? `<section class="card pad mt mini-lista"><h3 class="titulo-sec">Realizados y entregados</h3>${hechos.map(e => item(e, true)).join('')}</section>` : ''}`;

  el.onchange = e => {
    if (e.target.name !== 'tipo') return;
    const f = e.target.form;
    f.dataset.tipo = e.target.value;
    f.titulo.placeholder = e.target.value === 'trabajo' ? 'Ej.: Práctica 2' : 'Ej.: Examen T1–T3';
  };
  el.onclick = e => {
    const b = e.target.closest('[data-del]');
    if (b) {
      const tr = b.dataset.clase === 'trabajo', k = tr ? 'trabajos' : 'examenes';
      if (confirm(`¿Borrar este ${tr ? 'trabajo' : 'examen'}?`)) { state[k] = state[k].filter(x => x.id !== b.dataset.del); guardar(); refrescar(); }
      return;
    }
    const en = e.target.closest('[data-entregar]');
    if (en) {
      const t = state.trabajos.find(x => x.id === en.dataset.entregar);
      if (!t) return;
      t.entregado = t.entregado ? null : hoy();
      if (t.entregado) P.anotar({ tipo: 'entrega', asig: t.asig, texto: t.titulo });
      guardar(); toast(t.entregado ? '¡Trabajo entregado!' : 'Trabajo pendiente otra vez'); refrescar();
    }
  };
  el.onsubmit = e => {
    e.preventDefault();
    const d = datosForm(e.target);
    if (d.tipo === 'trabajo') {
      const t = { id: uid(), asig: d.asig, titulo: d.titulo.trim(), desc: (d.desc || '').trim(), fecha: d.fecha, hora: d.hora, entregado: null };
      state.trabajos.push(t);
      P.anotar({ tipo: 'trabajo', asig: t.asig, texto: `${t.titulo} (entrega ${fechaCorta(t.fecha)})` });
      toast('Trabajo guardado');
    } else {
      const ex = { id: uid(), asig: d.asig, titulo: d.titulo.trim(), fecha: d.fecha, hora: d.hora, temas: (d.temas || '').trim() };
      state.examenes.push(ex);
      P.anotar({ tipo: 'examen', asig: ex.asig, texto: `${ex.titulo} (${fechaCorta(ex.fecha)})` });
      toast('Examen guardado');
    }
    guardar();
    const destino = `#/examenes?mes=${d.fecha.slice(0, 7)}&tipo=${d.tipo}`;
    if (location.hash !== destino) location.hash = destino; else refrescar();
  };
}
