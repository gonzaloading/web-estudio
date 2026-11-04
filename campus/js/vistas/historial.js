import { cat } from '../data.js';
import { state, hoy, sumarDias, racha, mejorRacha } from '../store.js';
import * as P from '../progreso.js';
import { icon, esc, nombreAsig, fechaRel, fmtNota, kpi } from '../ui.js';

const SEMANAS = 18;

function entrada(e) {
  let ic = 'book', txt;
  switch (e.tipo) {
    case 'lectura': txt = `Has estudiado <b>${esc(e.titulo)}</b>`; break;
    case 'repaso': {
      ic = 'refresh';
      const n = e.bien + e.dude + e.falle;
      txt = `Repaso de <b>${n}</b> tarjeta${n === 1 ? '' : 's'} · ✅ ${e.bien} · 🤔 ${e.dude} · ❌ ${e.falle}`; break;
    }
    case 'nota': ic = 'grad'; txt = `Nota de <b>${esc(e.texto)}</b>: ${fmtNota(e.nota)}`; break;
    case 'examen': ic = 'calcheck'; txt = `Examen apuntado: <b>${esc(e.texto)}</b>`; break;
    case 'trabajo': ic = 'list'; txt = `Trabajo apuntado: <b>${esc(e.texto)}</b>`; break;
    case 'entrega': ic = 'check'; txt = `Trabajo entregado: <b>${esc(e.texto)}</b>`; break;
    case 'fallo': ic = 'xcircle'; txt = `Fallo apuntado: ${esc(e.texto)}`; break;
    default: txt = esc(e.texto || e.tipo);
  }
  return `<div class="hist-item">${icon(ic)}<div><small>${esc(nombreAsig(e.asig))}</small><span class="h-txt">${txt}</span></div>
    ${e.delta > 0 ? `<span class="delta">+${e.delta}%</span>` : ''}</div>`;
}

export default function historial(el) {
  const dias = P.resumenDias();
  const repasadas = Object.values(state.tarjetas).reduce((s, t) => s + (t.veces || 0), 0);

  const h = hoy(), dow = (new Date().getDay() + 6) % 7; // 0 = lunes
  const ini = sumarDias(h, -dow - (SEMANAS - 1) * 7);
  const nivel = n => (!n ? '' : n < 3 ? 'l1' : n < 10 ? 'l2' : n < 25 ? 'l3' : 'l4');
  let celdas = '';
  for (let k = 0; k < SEMANAS * 7; k++) {
    const f = sumarDias(ini, k), n = state.dias[f] || 0;
    celdas += `<i class="${f > h ? 'fut' : nivel(n)}" title="${f}: ${n} actividades"></i>`;
  }

  el.innerHTML = `
  <header class="cab"><h1>Historial</h1><p>Tus avances y cada sesión de estudio.</p></header>
  <section class="kpis">
    ${kpi('calendar', 'Días estudiados', Object.keys(state.dias).length)}
    ${kpi('flame', 'Racha actual', racha(), '', 'fuego')}
    ${kpi('award', 'Mejor racha', mejorRacha())}
    ${kpi('refresh', 'Tarjetas repasadas', repasadas)}
  </section>
  <section class="card pad"><h3 class="titulo-sec">Actividad de las últimas ${SEMANAS} semanas</h3>
    <div class="heat">${celdas}</div>
    <div class="heat-ley"><span>menos</span><i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>más</span></div>
  </section>
  ${dias.length ? dias.map(d => `<section class="dia"><h3>${fechaRel(d.fecha)} ${d.delta > 0 ? `<span class="delta">+${d.delta}%</span>` : ''}</h3>
      <div class="card">${d.items.map(entrada).join('')}</div></section>`).join('')
    : '<p class="vacio mt">Aún no hay actividad. Estudia un tema o haz un repaso y aparecerá aquí.</p>'}`;
}
