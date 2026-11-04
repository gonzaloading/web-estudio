import { cat, todasTarjetas } from '../data.js';
import { state } from '../store.js';
import * as P from '../progreso.js';
import { icon, esc, nombreAsig, refrescar } from '../ui.js';
import { montarRecall } from '../recall.js';

const TITULOS = { recordar: 'Recordar sin mirar', fallos: 'Revisar fallos', practicar: 'Practicar' };
const diaSemana = f => new Date(f + 'T12:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });

export default function repaso(el, r) {
  const modo = r.q.get('modo'), asig = r.q.get('asig') || '';
  if (!TITULOS[modo]) return portada(el, asig);

  const cards = P.colaRepaso(modo, asig);
  const volver = `#/repaso${asig ? '?asig=' + asig : ''}`;
  el.innerHTML = `
  <div class="sesion">
    <div class="crumb"><a href="${volver}">Plan de repaso</a> / ${TITULOS[modo]}${asig ? ' · ' + esc(nombreAsig(asig)) : ''}</div>
    <h1 class="tema-tit">${TITULOS[modo]}</h1>
    <div id="ses"></div>
  </div>`;

  const vacios = {
    recordar: `<div class="card pad"><b>¡Nada pendiente para hoy! 🎉</b><p>Las tarjetas entran aquí cuando marcas un tema como <b>estudiado</b> y vuelven en los días que toca repasarlas.</p><a class="btn lima" href="#/repaso?modo=practicar${asig ? '&asig=' + asig : ''}">Practicar igualmente</a></div>`,
    fallos: '<div class="card pad"><b>No tienes fallos pendientes. 🎉</b></div>',
    practicar: '<div class="card pad"><b>Todavía no hay tarjetas.</b><p>Se crean desde los temas (líneas <code>?? pregunta || respuesta</code>).</p></div>',
  };
  montarRecall(el.querySelector('#ses'), cards, {
    grande: true, repetir: true, teclado: true,
    vacio: vacios[modo],
    fin: `<a class="btn peq lima" href="${volver}">Volver al plan</a>`,
    otra: refrescar,
  });
}

function portada(el, asig) {
  const q = asig ? `&asig=${asig}` : '';
  const due = P.pendientesHoy(asig).length;
  const fp = state.fallos.filter(f => f.estado === 'pendiente' && (!asig || f.asig === asig)).length;
  const prev = P.prevision(7, asig);
  const hayCards = todasTarjetas(asig).length > 0;
  const modo = (n, m, t, s, cnt) => `<a class="card modo" href="#/repaso?modo=${m}${q}">
    <span class="n">${n}</span><b>${t}</b><p>${s}</p>
    <div class="modo-pie">${cnt != null ? `<span class="cnt-big">${cnt}</span>` : '<span></span>'}<span class="link">Empezar ${icon('chev')}</span></div></a>`;

  el.innerHTML = `
  <header class="cab"><h1>Plan de repaso</h1>
    <p>Active recall + repaso espaciado: intenta recordar la respuesta <b>antes</b> de mirarla. Si aciertas, la tarjeta tarda más en volver (1 → 3 → 7 → 15 → 30 días); si fallas, vuelve mañana.</p></header>
  <div class="tabs">${[['', 'Todas'], ...cat.asignaturas.map(a => [a.id, a.nombre])]
    .map(([id, n]) => `<a href="#/repaso${id ? '?asig=' + id : ''}" class="${asig === id ? 'on' : ''}">${esc(n)}</a>`).join('')}</div>
  <div class="modos">
    ${modo(1, 'recordar', 'Recordar sin mirar', 'Las tarjetas que hoy tocan según tu calendario de repaso.', due)}
    ${modo(2, 'fallos', 'Revisar fallos', 'Las preguntas que fallaste y aún no has recuperado.', fp)}
    ${modo(3, 'practicar', 'Practicar', '10 preguntas mezcladas: primero temas importantes y lo que menos dominas.', null)}
  </div>
  ${!hayCards ? '<p class="vacio">Aún no hay tarjetas en esta asignatura.</p>' : ''}
  <section class="card pad mt"><h3 class="titulo-sec">Próximos 7 días</h3>
    <div class="semana">${prev.map((p, k) => `<div class="${k === 0 ? 'hoy' : ''}"><small>${k === 0 ? 'Hoy' : diaSemana(p.fecha)}</small><b>${p.n}</b><small>tarjetas</small></div>`).join('')}</div>
  </section>`;
}
