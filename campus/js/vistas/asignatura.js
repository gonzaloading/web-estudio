import { cat, todasTarjetas, gruposDe } from '../data.js';
import { state, guardar } from '../store.js';
import * as P from '../progreso.js';
import { icon, barra, esc, asigIcon, prio, fechaCorta, diasTxt, fmtNota, filaTema, toast, refrescar } from '../ui.js';
import { montarRecall, ordenRepaso } from '../recall.js';
import { montarSegmento, pintarEjercicios, clicEjercicio, cambioEjercicio } from '../quiz.js';

export default function asignatura(el, r) {
  const a = cat.porId[r.args[0]];
  if (!a) { el.innerHTML = '<div class="card pad">Esa asignatura no existe. <a class="link" href="#/asignaturas">Ver asignaturas</a></div>'; return; }
  if (r.args[1]) return vistaTema(el, a, r.args[1]);

  const pct = P.pctAsig(a), cards = todasTarjetas(a.id), preg = a.temas.flatMap(t => t.preguntas);
  const dom = cards.filter(c => P.dominada(c.id)).length;
  const leidos = a.temas.filter(t => state.leidos[t.key]).length;
  const ex = P.proximosExamenes(1, a.id)[0], m = P.mediaNotas(a.id), tr = P.trabajosPendientes(1, a.id)[0];
  const due = P.pendientesHoy(a.id).length;

  el.innerHTML = `
  <div class="crumb"><a href="#/">Inicio</a> / <a href="#/asignaturas">Asignaturas</a> / ${esc(a.nombre)}</div>
  <section class="card asig-cab">
    ${asigIcon(a)}
    <div class="asig-cab-t">
      <h1>${esc(a.nombre)}</h1>
      <div class="stats">
        <span><b>${pct}%</b> de teoría vista</span>
        <span><b>${leidos}/${a.temas.length}</b> temas completos</span>
        ${preg.length ? `<span>Test <b>${P.aciertoTest(preg) ?? '—'}${P.aciertoTest(preg) !== null ? '%' : ''}</b> aciertos</span>` : ''}
        <span><b>${dom}/${cards.length}</b> tarjetas dominadas</span>
        ${m.n ? `<span>Nota media <b>${fmtNota(m.media)}</b></span>` : ''}
        ${ex ? `<span>${esc(ex.titulo)} <b>${diasTxt(ex.fecha)}</b></span>` : ''}
        ${tr ? `<span>Entrega «${esc(tr.titulo)}» <b>${diasTxt(tr.fecha)}</b></span>` : ''}
      </div>
      <div class="asig-pr">${barra(pct)}<span>${pct}%</span></div>
    </div>
    <div class="acc">
      ${preg.length ? `<a class="btn lima" href="#/test/hacer?asig=${a.id}&n=20">${icon('quiz')} Test de la asignatura</a>` : ''}
      <a class="btn ${preg.length ? 'borde' : 'lima'}" href="#/repaso?modo=recordar&asig=${a.id}">${icon('refresh')} Repasar (${due})</a>
      <a class="btn borde" href="#/repaso?modo=practicar&asig=${a.id}">Practicar</a>
    </div>
  </section>
  ${a.temas.length
    ? gruposDe(a).map(g => `<section class="grupo"><h2>${esc(g.nombre)}</h2><div class="card temas-l">${g.temas.map(t => filaTema(t)).join('')}</div></section>`).join('')
    : `<div class="card pad vacio-grande">${icon('book')}<h3>Aún no hay temas</h3>
        <p>Sube tus apuntes y pide que se añadan en <code>contenido/${a.id}/</code> (las instrucciones están en <code>AGENTS.md</code>).</p></div>`}`;
}

function vistaTema(el, a, temaId) {
  const t = cat.temas[`${a.id}/${temaId}`];
  if (!t) { el.innerHTML = `<div class="card pad">Ese tema no existe. <a class="link" href="#/asignatura/${a.id}">Volver a ${esc(a.nombre)}</a></div>`; return; }
  if (state.ultimoTema !== t.key) { state.ultimoTema = t.key; guardar(); }

  const idx = a.temas.indexOf(t), prev = a.temas[idx - 1], next = a.temas[idx + 1];
  const leido = !!state.leidos[t.key];
  const dom = t.cards.length ? Math.round(t.cards.filter(c => P.dominada(c.id)).length / t.cards.length * 100) : 0;
  const misFallos = state.fallos.filter(f => f.tema === t.key && f.estado === 'pendiente');
  const segPorAncla = Object.fromEntries(t.segs.filter(s => s.ancla).map(s => [s.ancla, s]));

  const marcaTema = x => { const p = P.pctTema(x); return p === 100 ? icon('check') : p > 0 ? `<span class="mini-pct">${p}%</span>` : prio(x.prioridad); };
  const navHtml = () => a.temas.map(x => `<a href="#/asignatura/${a.id}/${x.id}" class="${x === t ? 'on' : ''}"><span>${x.n}. ${esc(x.titulo)}</span>${marcaTema(x)}</a>`).join('');
  const tocHtml = () => t.toc.length ? `<small>En este tema</small>${t.toc.map(s => {
    const sg = segPorAncla[s.id];
    return `<a data-ir="${s.id}" class="n${s.lvl} ${sg ? 'seg-ini' : ''}">${esc(s.t)}${sg && P.segVisto(t, sg) ? icon('check') : ''}</a>`;
  }).join('')}` : '';
  const progHtml = () => {
    const pct = P.pctTema(t), vistos = t.segs.filter(s => P.segVisto(t, s)).length, res = P.resumenPreguntas(t.preguntas);
    return `<div class="tp-fila"><span class="tp-lbl">Teoría vista</span>${barra(pct)}<b>${pct}%</b></div>
      <div class="tp-det"><span>${vistos}/${t.segs.length} apartados vistos</span>
        ${res.total ? `<span>Test: ${res.resp}/${res.total} preguntas hechas${res.pct !== null ? ` · <b>${res.pct}%</b> aciertos` : ''}</span>` : ''}
        ${t.ejercicios.length ? `<span>Ejercicios: ${t.ejercicios.filter(e => state.ejercicios[e.id]?.estado === 'correcto').length}/${t.ejercicios.length} correctos</span>` : ''}
        ${res.total ? `<a class="btn peq lima" href="#/test/hacer?tema=${encodeURIComponent(t.key)}">${icon('quiz')} Test del tema</a>` : ''}</div>`;
  };
  const actualizar = () => {
    el.querySelector('#tema-prog').innerHTML = progHtml();
    el.querySelector('#tema-toc').innerHTML = tocHtml();
    el.querySelector('#tema-navl').innerHTML = navHtml();
    const todo = P.pctTema(t) === 100, bt = el.querySelector('[data-leido]');
    bt.className = `btn ${todo ? 'osc' : 'lima'}`; bt.innerHTML = todo ? icon('check') + ' Todo visto' : 'Marcar todo como visto';
  };

  el.innerHTML = `
  <div class="tema-layout">
    <aside class="card tema-nav">
      <h4>${asigIcon(a, 'peq')} <a href="#/asignatura/${a.id}">${esc(a.nombre)}</a><button type="button" class="icon-btn panel-x" data-vista="indice" title="Ocultar índice">${icon('x')}</button></h4>
      <div id="tema-navl">${navHtml()}</div>
      <div class="toc" id="tema-toc">${tocHtml()}</div>
    </aside>

    <article>
      <div class="crumb-fila"><div class="crumb"><a href="#/">Inicio</a> / <a href="#/asignatura/${a.id}">${esc(a.nombre)}</a> / Tema ${t.n}</div>
        <div class="vista-bar" aria-label="Paneles">
          <button type="button" class="vb vb-indice" data-vista="indice" title="Mostrar u ocultar el índice">${icon('list')}<span>Índice</span></button>
          <button type="button" class="vb vb-recall" data-vista="recall" title="Mostrar u ocultar el active recall">${icon('refresh')}<span>Repaso</span></button>
          <button type="button" class="vb vb-enfoque" data-vista="enfoque" title="Ocultar todo para leer con más espacio">${icon('expand')}<span>Concentración</span></button>
        </div></div>
      <h1 class="tema-tit">Tema ${t.n} · ${esc(t.titulo)}</h1>
      <div class="chips">
        ${t.prioridad ? `<span class="prio ${t.prioridad}">Prioridad ${t.prioridad}</span>` : ''}
        ${t.fuente ? `<span class="chip">📄 ${esc(t.fuente)}</span>` : ''}
        ${t.actualizado ? `<span class="chip">Actualizado ${fechaCorta(t.actualizado)}</span>` : ''}
        <span class="chip">${t.cards.length} tarjetas · ${dom}% dominado</span>
      </div>
      <div class="card tema-prog" id="tema-prog">${progHtml()}</div>
      ${misFallos.length ? `<div class="aviso"><b>⚠️ Tus fallos en este tema (${misFallos.length})</b>
        <ul>${misFallos.map(f => `<li>${esc(f.pregunta)} → <b>${esc(f.respuesta)}</b></li>`).join('')}</ul></div>` : ''}
      <div class="prose">${t.html || '<p class="vacio">Este tema aún no tiene contenido.</p>'}</div>
      <div class="tema-pie">
        ${prev ? `<a class="btn borde" href="#/asignatura/${a.id}/${prev.id}">${icon('chevl')} Anterior</a>` : '<span></span>'}
        <button class="btn ${leido ? 'osc' : 'lima'}" data-leido>${leido ? icon('check') + ' Todo visto' : 'Marcar todo como visto'}</button>
        ${next ? `<a class="btn borde" href="#/asignatura/${a.id}/${next.id}">Siguiente ${icon('chev')}</a>` : '<span></span>'}
      </div>
    </article>

    <aside class="recall-col"><div class="card recall" id="recall"></div></aside>
  </div>`;

  t.segs.forEach(s => montarSegmento(el.querySelector(`.quiz[data-seg="${s.id}"]`), t, s, actualizar));
  pintarEjercicios(el);

  montarRecall(el.querySelector('#recall'), ordenRepaso(t.cards), {
    cab: `<h4>${icon('refresh')} Active recall<button type="button" class="icon-btn panel-x" data-vista="recall" title="Ocultar active recall">${icon('x')}</button></h4><p class="tenue peq">Intenta responder antes de mirar.</p>`,
    vacio: 'Este tema aún no tiene tarjetas de repaso.',
  });

  el.onclick = e => {
    const ir = e.target.closest('[data-ir]');
    if (ir) { document.getElementById(ir.dataset.ir)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const cp = e.target.closest('.copiar');
    if (cp) {
      navigator.clipboard?.writeText(cp.closest('.code').querySelector('code').innerText);
      cp.textContent = '¡Copiado!'; setTimeout(() => (cp.textContent = 'Copiar'), 1500); return;
    }
    if (clicEjercicio(e)) return;
    if (e.target.closest('[data-leido]')) {
      const todo = P.pctTema(t) === 100;
      if (todo && !confirm('¿Marcar el tema como no visto? Se borra el progreso de sus apartados.')) return;
      P.marcarLeido(t, !todo);
      toast(todo ? 'Tema marcado como pendiente' : '¡Tema visto! Sus tarjetas entran en tu repaso.');
      refrescar();
    }
  };
  el.onchange = e => { cambioEjercicio(e); };
}
