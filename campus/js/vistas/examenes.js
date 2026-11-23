// Exámenes y trabajos: calendario, cuenta atrás y entregas.
import { cat } from '../data.js';
import { state, guardar, hoy, iso, sumarDias, diasEntre, uid } from '../store.js';
import * as P from '../progreso.js';
import { icon, esc, asigIcon, nombreAsig, fechaCorta, diasTxt, opcionesAsig, fmtNota, notaCls, datosForm, toast, refrescar } from '../ui.js';
import { anadirApple, urlGoogle } from '../calendario.js';

const orden = (a, b) => (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || ''));
let diaSel = null; // día elegido en el calendario (se conserva al volver a pintar la vista)
let editando = null; // { id, clase } del examen o trabajo que se está editando en el formulario

export default function examenes(el, r) {
  if (!el.querySelector('#f-ag')) editando = null; // al llegar desde otra página se empieza sin editar nada
  const ed = editando && state[editando.clase === 'trabajo' ? 'trabajos' : 'examenes'].find(x => x.id === editando.id);
  if (!ed) editando = null;
  const mes = /^\d{4}-\d{2}$/.test(r.q.get('mes') || '') ? r.q.get('mes') : hoy().slice(0, 7);
  const tipo = ed ? editando.clase : r.q.get('tipo') === 'trabajo' ? 'trabajo' : 'examen';
  if (!diaSel || diaSel.slice(0, 7) !== mes) diaSel = mes === hoy().slice(0, 7) ? hoy() : null;
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
    return `<div class="it ag">${asigIcon(cat.porId[e.asig], 'peq')}
      <div class="tt"><span class="chip-tipo ${e.clase}">${tr ? 'Trabajo' : 'Examen'}</span><b>${esc(e.titulo)}</b>
        <small>${esc(nombreAsig(e.asig))} · ${tr ? 'entrega ' : ''}${fechaCorta(e.fecha)}${e.hora ? ' · ' + e.hora : ''}${!tr && e.temas ? ' · ' + esc(e.temas) : ''}${tr && e.entregado ? ' · entregado el ' + fechaCorta(e.entregado) : ''}</small>
        ${tr && e.desc ? `<p class="desc">${esc(e.desc)}</p>` : ''}</div>
      ${der}
      ${tr ? `<button class="icon-btn ${e.entregado ? '' : 'entregar'}" data-entregar="${e.id}" title="${e.entregado ? 'Volver a pendiente' : 'Marcar como entregado'}">${icon(e.entregado ? 'refresh' : 'check')}</button>` : ''}
      ${hecho ? '' : `<details class="cal-menu"><summary class="icon-btn" title="Añadir al calendario" aria-label="Añadir al calendario">${icon('calplus')}</summary>
        <div class="cal-pop"><small>Añadir al calendario</small>
          <button type="button" data-cal-apple="${e.id}" data-clase="${e.clase}">${icon('calendar')} Calendario de Apple</button>
          <a href="${esc(urlGoogle(e))}" target="_blank" rel="noopener" data-cal-google>${icon('calendar')} Google Calendar</a></div></details>`}
      <button class="icon-btn" data-editar="${e.id}" data-clase="${e.clase}" title="Editar">${icon('edit')}</button>
      <button class="icon-btn" data-del="${e.id}" data-clase="${e.clase}" title="Borrar">${icon('trash')}</button></div>`;
  };

  const resumen = [
    proxEx[0] ? `Próximo examen: <b>${esc(proxEx[0].titulo)}</b> (${esc(nombreAsig(proxEx[0].asig))}) ${diasTxt(proxEx[0].fecha)}.` : '',
    proxTr[0] ? `${proxTr.length} trabajo${proxTr.length > 1 ? 's' : ''} por entregar; el siguiente, <b>${esc(proxTr[0].titulo)}</b>, ${proxTr[0].fecha < hoy() ? 'venció ' : ''}${diasTxt(proxTr[0].fecha)}.` : '',
  ].filter(Boolean).join(' ') || 'Apunta tus exámenes y los trabajos que tienes que entregar: verás la cuenta atrás de cada uno.';

  el.innerHTML = `
  <header class="cab"><h1>Exámenes y trabajos</h1><p>${resumen}</p></header>
  <div class="dos-col">
    <div class="col">
    <section class="card pad">
      <div class="cal-h"><a class="icon-btn" href="#/examenes?mes=${prevM}" title="Mes anterior">${icon('chevl')}</a>
        <h3>${titulo}</h3><a class="icon-btn" href="#/examenes?mes=${nextM}" title="Mes siguiente">${icon('chev')}</a></div>
      <div class="cal">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<div class="dn">${d}</div>`).join('')}
        ${dias.map(f => `<div class="d ${f.slice(0, 7) !== mes ? 'fuera' : ''} ${f === hoy() ? 'hoy' : ''} ${f === diaSel ? 'sel' : ''}" data-dia="${f}" role="button" tabindex="0" aria-label="${fechaCorta(f)}${porDia[f] ? ` · ${porDia[f].length} cosa${porDia[f].length > 1 ? 's' : ''}` : ''}"><span class="num">${+f.slice(8)}</span>
          ${(porDia[f] || []).map(e => {
            const a = cat.porId[e.asig] || {}, tr = e.clase === 'trabajo';
            return `<span class="ev ${tr ? 'trab' : ''} ${e.entregado ? 'hecho' : ''}" style="--c:${a.color};--t:${a.tint}" title="${tr ? 'Entrega' : 'Examen'} · ${esc(nombreAsig(e.asig))}: ${esc(e.titulo)}${e.hora ? ' · ' + e.hora : ''}">${icon(a.icono || 'book')}<span class="ev-t">${esc(e.titulo)}</span></span>`;
          }).join('')}
        </div>`).join('')}
      </div>
      <div class="cal-ley"><span><i class="sw ex"></i>Examen</span><span><i class="sw tr"></i>Entrega de trabajo</span><span><i class="sw tr hecho"></i>Entregado</span></div>
    </section>
    ${hechos.length ? `<section class="card pad mini-lista lista-ag"><h3 class="titulo-sec">Realizados y entregados</h3>${hechos.map(e => item(e, true)).join('')}</section>` : ''}
    </div>
    <div class="col">
      <section class="card pad" id="dia-panel"></section>
      <section class="card pad ${ed ? 'editando' : ''}"><h3 class="titulo-sec">${ed ? `Editar ${tipo === 'trabajo' ? 'trabajo' : 'examen'}` : 'Añadir'}</h3>
        <form class="form" id="f-ag" data-tipo="${tipo}">
          ${ed ? '' : `<div class="seg ancho">
            <label><input type="radio" name="tipo" value="examen" ${tipo === 'examen' ? 'checked' : ''}>Examen</label>
            <label><input type="radio" name="tipo" value="trabajo" ${tipo === 'trabajo' ? 'checked' : ''}>Trabajo</label>
          </div>`}
          <label>Asignatura<select name="asig" required>${opcionesAsig(ed?.asig)}</select></label>
          <label>Título<input name="titulo" required value="${esc(ed?.titulo || '')}" placeholder="${tipo === 'trabajo' ? 'Ej.: Práctica 2' : 'Ej.: Examen T1–T3'}"></label>
          <label class="ancho solo-tr">Descripción<textarea name="desc" rows="3" placeholder="Qué hay que entregar, formato, dónde se sube…">${esc(ed?.desc || '')}</textarea></label>
          <label><span class="solo-ex">Fecha</span><span class="solo-tr">Fecha de entrega</span><input type="date" name="fecha" required value="${ed?.fecha || diaSel || hoy()}"></label>
          <label><span class="solo-ex">Hora</span><span class="solo-tr">Hora límite</span><input type="time" name="hora" value="${ed?.hora || ''}"></label>
          <label class="ancho solo-ex">Temas que entran<input name="temas" value="${esc(ed?.temas || '')}" placeholder="Ej.: Temas 1, 2 y 3"></label>
          <div class="form-acc">${ed
            ? `<button class="btn osc">${icon('check')} Guardar cambios</button><button type="button" class="btn borde" data-cancelar>Cancelar</button>`
            : `<button class="btn osc">${icon('plus')} <span class="solo-ex">Guardar examen</span><span class="solo-tr">Guardar trabajo</span></button>`}</div>
        </form></section>
      <section class="card pad mini-lista lista-ag"><h3 class="titulo-sec">Próximos</h3>${prox.length ? prox.map(e => item(e)).join('') : '<p class="vacio">Nada pendiente.</p>'}
        ${prox.length > 1 ? `<button class="btn peq borde mt-s" type="button" data-cal-todos>${icon('calplus')} Añadir todos al calendario de Apple</button>` : ''}</section>
    </div>
  </div>`;

  // Panel con lo que hay el día elegido; se repinta sin recargar la vista.
  const pintarDia = () => {
    el.querySelectorAll('.cal .d.sel').forEach(d => d.classList.remove('sel'));
    const panel = el.querySelector('#dia-panel');
    if (!diaSel) { panel.innerHTML = '<h3 class="titulo-sec">Elige un día</h3><p class="vacio">Pulsa un día del calendario para ver lo que tienes ese día.</p>'; return; }
    el.querySelector(`.cal .d[data-dia="${diaSel}"]`)?.classList.add('sel');
    const lista = porDia[diaSel] || [];
    const f0 = new Date(diaSel + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    panel.innerHTML = `<div class="dia-h"><h3 class="titulo-sec">${f0[0].toUpperCase() + f0.slice(1)}</h3><span class="tenue">${diasTxt(diaSel)}</span></div>
      <div class="mini-lista lista-ag">${lista.length ? lista.map(e => item(e, e.clase === 'trabajo' ? !!e.entregado : e.fecha < hoy())).join('') : '<p class="vacio">Nada programado este día.</p>'}</div>
      <button class="btn peq borde" type="button" data-anadir>${icon('plus')} Añadir en este día</button>`;
    const form = el.querySelector('#f-ag');
    if (form && !editando) form.fecha.value = diaSel;
  };
  pintarDia();

  el.onkeydown = e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.cal .d[data-dia]')) { e.preventDefault(); e.target.click(); }
    if (e.key === 'Escape') el.querySelectorAll('details.cal-menu[open]').forEach(d => (d.open = false));
  };
  // Añadir al calendario de Apple (.ics); avisa de qué hacer según el dispositivo
  const alCalendario = (items, nombre) => {
    const r = anadirApple(items, nombre);
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (r === 'safari') toast('Se abre Safari: pulsa «Añadir a Calendario»');
    else if (!ios) toast(items.length > 1 ? 'Descargado: abre el archivo .ics para añadirlos a tu calendario' : 'Descargado: abre el archivo .ics para añadirlo a tu calendario');
  };
  el.onchange = e => {
    if (e.target.name !== 'tipo') return;
    const f = e.target.form;
    f.dataset.tipo = e.target.value;
    f.titulo.placeholder = e.target.value === 'trabajo' ? 'Ej.: Práctica 2' : 'Ej.: Examen T1–T3';
  };
  el.onclick = e => {
    // Menú «Añadir al calendario»: se cierra al pulsar fuera o al elegir una opción
    el.querySelectorAll('details.cal-menu[open]').forEach(d => { if (!d.contains(e.target) || e.target.closest('.cal-pop a, .cal-pop button')) d.open = false; });
    const ap = e.target.closest('[data-cal-apple]');
    if (ap) {
      const x = state[ap.dataset.clase === 'trabajo' ? 'trabajos' : 'examenes'].find(z => z.id === ap.dataset.calApple);
      if (x) alCalendario([{ ...x, clase: ap.dataset.clase }], x.titulo);
      return;
    }
    if (e.target.closest('[data-cal-todos]')) { alCalendario(prox, 'examenes-y-trabajos'); return; }
    if (e.target.closest('[data-cal-google]')) return;
    const dd = e.target.closest('.cal .d[data-dia]');
    if (dd) {
      diaSel = dd.dataset.dia;
      if (diaSel.slice(0, 7) !== mes) { location.hash = `#/examenes?mes=${diaSel.slice(0, 7)}`; return; }
      pintarDia();
      if (matchMedia('(max-width: 1100px)').matches) el.querySelector('#dia-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const edb = e.target.closest('[data-editar]');
    if (edb) {
      editando = { id: edb.dataset.editar, clase: edb.dataset.clase };
      refrescar();
      const form = el.querySelector('#f-ag');
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.titulo.focus({ preventScroll: true });
      return;
    }
    if (e.target.closest('[data-cancelar]')) { editando = null; refrescar(); return; }
    if (e.target.closest('[data-anadir]')) {
      if (editando) { editando = null; refrescar(); }
      const form = el.querySelector('#f-ag');
      form.fecha.value = diaSel;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.titulo.focus({ preventScroll: true });
      return;
    }
    const b = e.target.closest('[data-del]');
    if (b) {
      const tr = b.dataset.clase === 'trabajo', k = tr ? 'trabajos' : 'examenes';
      if (confirm(`¿Borrar este ${tr ? 'trabajo' : 'examen'}?`)) {
        state[k] = state[k].filter(x => x.id !== b.dataset.del);
        if (editando?.id === b.dataset.del) editando = null;
        guardar(); refrescar();
      }
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
    if (ed) {
      // Editar: se cambian los datos y se conservan el id, la entrega y las notas ya puestas
      Object.assign(ed, { asig: d.asig, titulo: d.titulo.trim(), fecha: d.fecha, hora: d.hora });
      if (editando.clase === 'trabajo') ed.desc = (d.desc || '').trim(); else ed.temas = (d.temas || '').trim();
      state.notas.filter(n => n.examen === ed.id).forEach(n => (n.asig = ed.asig));
      toast(editando.clase === 'trabajo' ? 'Trabajo actualizado' : 'Examen actualizado');
      d.tipo = editando.clase;
      editando = null;
    } else if (d.tipo === 'trabajo') {
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
    diaSel = d.fecha;
    const destino = `#/examenes?mes=${d.fecha.slice(0, 7)}&tipo=${d.tipo}`;
    if (location.hash !== destino) location.hash = destino; else refrescar();
  };
}
