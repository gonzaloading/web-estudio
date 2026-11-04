// Apartado Test: hacer tests (de todo, de una asignatura, de un tema, de falladas…) y ver la evolución.
import { cat, todosTemas, todasPreguntas, todosEjercicios } from '../data.js';
import { state } from '../store.js';
import * as P from '../progreso.js';
import { inline } from '../md.js';
import { htmlPregunta, corregir, barajar, htmlEstadoEjercicio, clicEjercicio, cambioEjercicio } from '../quiz.js';
import { icon, esc, barra, kpi, asigIcon, nombreAsig, fechaCorta, notaCls, refrescar } from '../ui.js';

const MODOS = { '': '', fallos: ' · solo falladas', nuevas: ' · solo nuevas', repaso: ' · repaso de falladas' };
let run = null; // test en curso (se conserva si se vuelve a pintar la vista)

export default function test(el, r) {
  if (r.args[0] === 'hacer') return hacer(el, r);
  run = null;
  panel(el);
}

const ambitoTxt = (asig, tema) => tema && cat.temas[tema] ? `${nombreAsig(cat.temas[tema].asig)} · Tema ${cat.temas[tema].n}. ${cat.temas[tema].titulo}`
  : asig ? nombreAsig(asig) : 'Todas las asignaturas';

// ---------- Panel ----------
function panel(el) {
  const todas = todasPreguntas(), g = P.resumenPreguntas(todas), fall = P.falladas();
  const temas = todosTemas().filter(t => t.preguntas.length);
  const asigs = cat.asignaturas.filter(a => a.temas.some(t => t.preguntas.length));
  const ejs = todosEjercicios();

  const filaTema = t => {
    const res = P.resumenPreguntas(t.preguntas);
    return `<div class="it">${asigIcon(cat.porId[t.asig], 'peq')}
      <div class="tt"><b>T${t.n}. ${esc(t.titulo)}</b>
        <small>${esc(nombreAsig(t.asig))} · ${res.resp}/${res.total} hechas · ${res.bien} acertadas la última vez${res.pct !== null ? ` · <strong>${res.pct}%</strong> de aciertos` : ''}</small>
        <div class="tt-barra">${barra(res.total ? res.bien / res.total * 100 : 0)}</div></div>
      <a class="btn peq lima" href="#/test/hacer?tema=${encodeURIComponent(t.key)}">Test</a></div>`;
  };
  const intento = x => {
    const pct = Math.round(x.ok / x.total * 100);
    return `<div class="it"><span class="nota-v ${notaCls(pct / 10)}">${pct}%</span>
      <div class="tt"><b>${esc(ambitoTxt(x.asig, x.tema))}</b><small>${fechaCorta(x.fecha)} · ${x.ok}/${x.total} aciertos${MODOS[x.modo] || ''}</small></div></div>`;
  };

  el.innerHTML = `
  <header class="cab"><h1>Test</h1>
    <p>Tu forma principal de estudiar. Cada apartado de la teoría acaba con su test; aquí haces tests completos y ves cómo evolucionas.</p></header>
  <section class="kpis">
    ${kpi('quiz', 'Aciertos', g.pct !== null ? g.pct + '%' : '—', g.pct !== null ? barra(g.pct) : '<span class="tenue">Aún sin respuestas</span>')}
    ${kpi('check', 'Preguntas hechas', `${g.resp} <small>de ${g.total}</small>`, barra(g.total ? g.resp / g.total * 100 : 0))}
    ${kpi('target', 'Acertadas la última vez', `${g.bien} <small>de ${g.total}</small>`, barra(g.total ? g.bien / g.total * 100 : 0))}
    ${kpi('xcircle', 'Falladas por repasar', fall.length, fall.length ? `<a class="link" href="#/test/hacer?modo=fallos&n=0">Repasarlas ${icon('chev')}</a>` : '<span class="tenue">Ninguna</span>')}
  </section>
  <div class="dos-col">
    <div class="col">
      <section class="card pad"><div class="panel-h">${icon('bars')}<div><h3>Evolución de aciertos</h3><p>% de aciertos de cada día que hiciste test (últimos 14 días con actividad)</p></div></div>${grafica()}</section>
      <section class="card pad mini-lista"><h3 class="titulo-sec">Por tema</h3>${temas.length ? temas.map(filaTema).join('') : '<p class="vacio">Todavía no hay temas con test.</p>'}</section>
      ${ejs.length ? `<section class="card pad mini-lista"><h3 class="titulo-sec">Ejercicios prácticos</h3>
        <p class="tenue peq">Hazlos en IntelliJ y pulsa «Copiar para Claude Code» para que te los corrija.</p>
        ${ejs.map(ej => `<div class="it ej-it">${asigIcon(cat.porId[ej.asig], 'peq')}<div class="tt"><b>${inline(ej.titulo)}</b>
          <small>${esc(nombreAsig(ej.asig))} · ${esc(ej.temaTitulo)} · <a class="link" href="#/asignatura/${ej.tema}">ver enunciado</a></small>
          <div class="ej-acc">${htmlEstadoEjercicio(ej)}</div></div></div>`).join('')}</section>` : ''}
    </div>
    <div class="col">
      <section class="card pad"><h3 class="titulo-sec">Nuevo test</h3>
        <form class="form" id="f-test">
          <label class="ancho">Asignatura<select name="asig"><option value="">Todas</option>${asigs.map(a => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('')}</select></label>
          <label class="ancho">Tema<select name="tema"><option value="">Todos los temas</option>${temas.map(t => `<option value="${t.key}" data-asig="${t.asig}">T${t.n}. ${esc(t.titulo)}</option>`).join('')}</select></label>
          <label>Preguntas<select name="n"><option>10</option><option selected>20</option><option>30</option><option value="0">Todas</option></select></label>
          <label>Tipo<select name="modo"><option value="">Mezcla inteligente</option><option value="fallos">Solo falladas</option><option value="nuevas">Solo nuevas</option></select></label>
          <div class="ancho"><button class="btn osc">${icon('play')} Empezar test</button></div>
        </form>
        <p class="tenue peq">«Mezcla inteligente» pone primero lo que fallaste y lo que nunca has hecho.</p></section>
      <section class="card pad mini-lista"><h3 class="titulo-sec">Últimos tests</h3>
        ${state.tests.length ? state.tests.slice(0, 8).map(intento).join('') : '<p class="vacio">Todavía no has hecho ningún test completo.</p>'}</section>
    </div>
  </div>`;

  const f = el.querySelector('#f-test');
  const filtrarTemas = () => {
    [...f.tema.options].forEach(o => { o.hidden = !!o.value && !!f.asig.value && o.dataset.asig !== f.asig.value; });
    if (f.tema.selectedOptions[0]?.hidden) f.tema.value = '';
  };
  el.onchange = e => {
    if (cambioEjercicio(e)) return;
    if (e.target.name === 'asig') filtrarTemas();
    if (e.target.name === 'tema' && f.tema.value) f.asig.value = f.tema.selectedOptions[0].dataset.asig;
  };
  el.onsubmit = e => {
    e.preventDefault();
    const p = new URLSearchParams();
    for (const k of ['asig', 'tema', 'n', 'modo']) if (f[k].value !== '') p.set(k, f[k].value);
    location.hash = '#/test/hacer?' + p;
  };
  el.onclick = e => { clicEjercicio(e); };
  // Tooltip de la gráfica
  const tip = el.querySelector('.graf-tip');
  const mostrar = e => {
    const h = e.target.closest?.('[data-tip]');
    el.querySelectorAll('.g-bar.on').forEach(b => b.classList.remove('on'));
    if (!tip) return;
    if (!h) { tip.hidden = true; return; }
    const g0 = el.querySelector('.graf').getBoundingClientRect(), hr = h.getBoundingClientRect();
    h.previousElementSibling?.classList.add('on');
    tip.innerHTML = h.dataset.tip; tip.hidden = false;
    tip.style.left = `${hr.left + hr.width / 2 - g0.left}px`;
    tip.style.top = `${+h.dataset.y * g0.height / 200 - 8}px`;
  };
  el.onmouseover = mostrar; el.onfocusin = mostrar;
}

/** Columnas: % de aciertos de cada día con test. */
function grafica() {
  const dias = Object.entries(state.testDias).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  if (!dias.length) return '<p class="vacio">Cuando hagas tests, aquí verás tu % de aciertos día a día.</p>';
  const W = 600, H = 200, pl = 38, pr = 10, pt = 18, pb = 26, cw = (W - pl - pr) / dias.length, bw = Math.min(24, cw * 0.62);
  const y = v => pt + (H - pt - pb) * (1 - v / 100), y0 = y(0);
  const corto = f => new Date(f + 'T12:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
  let svg = [50, 100, 0].map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="${v ? '#ebe8de' : '#cfcabb'}" stroke-width="1"/>
    <text x="${pl - 8}" y="${y(v) + 4}" class="g-eje" text-anchor="end">${v}%</text>`).join('');
  dias.forEach(([f, d], i) => {
    const pct = Math.round(d.ok / d.n * 100), x = pl + cw * i + (cw - bw) / 2, yt = y(pct), rr = Math.min(4, y0 - yt);
    svg += `<path class="g-bar" d="M${x},${y0} V${yt + rr} Q${x},${yt} ${x + rr},${yt} H${x + bw - rr} Q${x + bw},${yt} ${x + bw},${yt + rr} V${y0} Z"/>`;
    svg += `<rect x="${pl + cw * i}" y="${pt}" width="${cw}" height="${y0 - pt}" fill="transparent" tabindex="0" data-y="${yt}"
      data-tip="<b>${corto(f)}</b> · ${d.ok}/${d.n} aciertos (${pct}%)" aria-label="${corto(f)}: ${pct}% de aciertos, ${d.ok} de ${d.n}"/>`;
    if (dias.length <= 7 || i % 2 === dias.length % 2 || i === dias.length - 1) svg += `<text x="${pl + cw * i + cw / 2}" y="${H - 8}" class="g-eje" text-anchor="middle">${corto(f)}</text>`;
    if (i === dias.length - 1) svg += `<text x="${x + bw / 2}" y="${yt - 6}" class="g-val" text-anchor="middle">${pct}%</text>`;
  });
  return `<div class="graf"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Porcentaje de aciertos en test por día">${svg}</svg><div class="graf-tip" hidden></div></div>
    <details class="graf-tabla"><summary>Ver como tabla</summary><table class="lista"><thead><tr><th>Día</th><th>Aciertos</th><th>%</th></tr></thead>
    <tbody>${dias.slice().reverse().map(([f, d]) => `<tr><td>${fechaCorta(f)}</td><td>${d.ok}/${d.n}</td><td>${Math.round(d.ok / d.n * 100)}%</td></tr>`).join('')}</tbody></table></details>`;
}

// ---------- Hacer un test ----------
function hacer(el, r) {
  const clave = location.hash;
  if (!run || run.clave !== clave) {
    const tema = r.q.get('tema') || '', asig = r.q.get('asig') || (tema ? tema.split('/')[0] : '');
    const modo = r.q.get('modo') || '', n = r.q.has('n') ? +r.q.get('n') : tema ? 0 : 10;
    run = { clave, asig, tema, modo, n, qs: P.prepararTest({ asig, tema, modo, n }), i: 0, ok: 0, falladas: [], hecha: false };
  }
  const cab = () => `<div class="crumb"><a href="#/test">Test</a> / ${esc(ambitoTxt(run.asig, run.tema))}${MODOS[run.modo] || ''}</div>`;

  if (!run.qs.length) {
    el.innerHTML = `${cab()}<div class="card pad vacio-grande">${icon('quiz')}<h3>${run.modo === 'fallos' ? 'No tienes preguntas falladas 🎉' : 'No hay preguntas para este test'}</h3>
      <p>${run.modo === 'nuevas' ? 'Ya has respondido todas las preguntas de aquí.' : 'Prueba con otro tema o asignatura.'}</p><p><a class="btn lima mt" href="#/test">Volver a Test</a></p></div>`;
    return;
  }

  const pintar = () => {
    if (run.i >= run.qs.length) return final();
    const q = run.qs[run.i];
    run.hecha = false;
    el.innerHTML = `${cab()}
    <div class="run">
      <div class="run-h"><span>Pregunta <b>${run.i + 1}</b> de ${run.qs.length}</span><span class="tenue">${run.ok} acierto${run.ok === 1 ? '' : 's'}</span></div>
      ${barra(run.i / run.qs.length * 100)}
      <section class="card pad run-q">
        <small class="tenue">${esc(nombreAsig(q.asig))} · ${esc(q.temaTitulo)}</small>
        ${htmlPregunta(q)}
        <div class="run-acc"><button class="btn osc" data-sig hidden>${run.i + 1 < run.qs.length ? 'Siguiente' : 'Ver resultado'} ${icon('chev')}</button></div>
        <p class="tenue peq atajo">Atajos: teclas 1–4 (o A–D) para responder · Enter para seguir</p>
      </section>
      <p><a class="link" href="#/test">${icon('chevl')} Salir del test</a></p>
    </div>`;
  };

  const final = () => {
    const total = run.qs.length, pct = Math.round(run.ok / total * 100);
    if (!run.guardado) { P.guardarTest({ asig: run.asig, tema: run.tema, modo: run.modo, ok: run.ok, total }); run.guardado = true; }
    const msg = pct >= 90 ? '¡Excelente! Lo dominas.' : pct >= 70 ? 'Muy bien. Repasa las que fallaste y a por el 100 %.' : pct >= 50 ? 'Aprobado justo: repasa las falladas.' : 'Toca repasar la teoría antes de repetir.';
    el.innerHTML = `${cab()}
    <section class="card pad run-fin">
      <div class="fin-nota ${notaCls(pct / 10)}">${pct}%</div>
      <h2>${run.ok} de ${total} aciertos</h2><p>${msg}</p>
      <div class="acc">
        ${run.falladas.length ? `<button class="btn lima" data-repetir>${icon('refresh')} Repetir las ${run.falladas.length} falladas</button>` : ''}
        <button class="btn borde" data-otro>Otro test igual</button>
        <a class="btn borde" href="#/test">Volver a Test</a>
      </div>
    </section>
    ${run.falladas.length ? `<section class="card pad mt mini-lista"><h3 class="titulo-sec">Repasa lo que fallaste</h3>
      ${run.falladas.map(q => `<div class="rev"><b>${inline(q.q)}</b><div class="resp">✓ ${inline(q.ops.find(o => o.ok)?.t || '')}</div>
        ${q.exp ? `<p class="tenue">${inline(q.exp)}</p>` : ''}<a class="link" href="#/asignatura/${q.tema}">Ver la teoría ${icon('chev')}</a></div>`).join('')}</section>` : ''}`;
  };

  el.onclick = e => {
    const op = e.target.closest('.op');
    if (op) {
      const res = corregir(op);
      if (!res) return;
      if (res.ok) run.ok++; else run.falladas.push(res.q);
      run.hecha = true;
      const sig = el.querySelector('[data-sig]'); sig.hidden = false; sig.focus({ preventScroll: true });
      return;
    }
    if (e.target.closest('[data-sig]')) { run.i++; pintar(); scrollTo(0, 0); return; }
    if (e.target.closest('[data-repetir]')) {
      run = { ...run, modo: 'repaso', qs: barajar(run.falladas), i: 0, ok: 0, falladas: [], guardado: false };
      pintar(); scrollTo(0, 0); return;
    }
    if (e.target.closest('[data-otro]')) { run = null; refrescar(); }
  };
  pintar();
}

// Atajos de teclado del test en curso
addEventListener('keydown', e => {
  if (!location.hash.startsWith('#/test/hacer') || !run || e.metaKey || e.ctrlKey || e.target.closest?.('input,select,textarea')) return;
  const n = '1234abcd'.indexOf(e.key.toLowerCase());
  if (n >= 0 && !run.hecha) { document.querySelectorAll('.run .op')[n % 4]?.click(); return; }
  if (e.key === 'Enter' && run.hecha && !e.target.closest?.('button')) document.querySelector('[data-sig]')?.click();
});
