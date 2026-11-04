import { cat, todasTarjetas, gruposDe } from '../data.js';
import { state, guardar } from '../store.js';
import * as P from '../progreso.js';
import { icon, barra, esc, asigIcon, prio, fechaCorta, diasTxt, fmtNota, filaTema, toast, refrescar } from '../ui.js';
import { montarRecall, ordenRepaso } from '../recall.js';

export default function asignatura(el, r) {
  const a = cat.porId[r.args[0]];
  if (!a) { el.innerHTML = '<div class="card pad">Esa asignatura no existe. <a class="link" href="#/asignaturas">Ver asignaturas</a></div>'; return; }
  if (r.args[1]) return vistaTema(el, a, r.args[1]);

  const pct = P.pctAsig(a), cards = todasTarjetas(a.id);
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
        <span><b>${leidos}/${a.temas.length}</b> temas estudiados</span>
        <span><b>${dom}/${cards.length}</b> tarjetas dominadas</span>
        ${m.n ? `<span>Nota media <b>${fmtNota(m.media)}</b></span>` : ''}
        ${ex ? `<span>${esc(ex.titulo)} <b>${diasTxt(ex.fecha)}</b></span>` : ''}
        ${tr ? `<span>Entrega «${esc(tr.titulo)}» <b>${diasTxt(tr.fecha)}</b></span>` : ''}
      </div>
      <div class="asig-pr">${barra(pct)}<span>${pct}%</span></div>
    </div>
    <div class="acc">
      <a class="btn lima" href="#/repaso?modo=recordar&asig=${a.id}">${icon('refresh')} Repasar (${due})</a>
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

  el.innerHTML = `
  <div class="tema-layout">
    <aside class="card tema-nav">
      <h4>${asigIcon(a, 'peq')} <a href="#/asignatura/${a.id}">${esc(a.nombre)}</a></h4>
      ${a.temas.map(x => `<a href="#/asignatura/${a.id}/${x.id}" class="${x === t ? 'on' : ''}"><span>${x.n}. ${esc(x.titulo)}</span>${state.leidos[x.key] ? icon('check') : prio(x.prioridad)}</a>`).join('')}
      ${t.toc.length ? `<div class="toc"><small>En este tema</small>${t.toc.map(s => `<a data-ir="${s.id}" class="n${s.lvl}">${esc(s.t)}</a>`).join('')}</div>` : ''}
    </aside>

    <article>
      <div class="crumb"><a href="#/">Inicio</a> / <a href="#/asignatura/${a.id}">${esc(a.nombre)}</a> / Tema ${t.n}</div>
      <h1 class="tema-tit">Tema ${t.n} · ${esc(t.titulo)}</h1>
      <div class="chips">
        ${t.prioridad ? `<span class="prio ${t.prioridad}">Prioridad ${t.prioridad}</span>` : ''}
        ${t.fuente ? `<span class="chip">📄 ${esc(t.fuente)}</span>` : ''}
        ${t.actualizado ? `<span class="chip">Actualizado ${fechaCorta(t.actualizado)}</span>` : ''}
        <span class="chip">${t.cards.length} tarjetas · ${dom}% dominado</span>
      </div>
      ${misFallos.length ? `<div class="aviso"><b>⚠️ Tus fallos en este tema (${misFallos.length})</b>
        <ul>${misFallos.map(f => `<li>${esc(f.pregunta)} → <b>${esc(f.respuesta)}</b></li>`).join('')}</ul></div>` : ''}
      <div class="prose">${t.html || '<p class="vacio">Este tema aún no tiene contenido.</p>'}</div>
      <div class="tema-pie">
        ${prev ? `<a class="btn borde" href="#/asignatura/${a.id}/${prev.id}">${icon('chevl')} Anterior</a>` : '<span></span>'}
        <button class="btn ${leido ? 'osc' : 'lima'}" data-leido>${leido ? icon('check') + ' Estudiado' : 'Marcar como estudiado'}</button>
        ${next ? `<a class="btn borde" href="#/asignatura/${a.id}/${next.id}">Siguiente ${icon('chev')}</a>` : '<span></span>'}
      </div>
    </article>

    <aside class="recall-col"><div class="card recall" id="recall"></div></aside>
  </div>`;

  montarRecall(el.querySelector('#recall'), ordenRepaso(t.cards), {
    cab: `<h4>${icon('refresh')} Active recall</h4><p class="tenue peq">Intenta responder antes de mirar.</p>`,
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
    if (e.target.closest('[data-leido]')) {
      P.marcarLeido(t, !leido);
      toast(leido ? 'Tema marcado como pendiente' : '¡Tema estudiado! Sus tarjetas entran en tu repaso.');
      refrescar();
    }
  };
}
