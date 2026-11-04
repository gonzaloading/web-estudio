import { cat } from '../data.js';
import { state, racha, mejorRacha, hoy, diasEntre } from '../store.js';
import * as P from '../progreso.js';
import { icon, barra, prio, esc, nombreAsig, asigIcon, fechaRel, fechaCorta, diasTxt, fechaLarga, tarjetaAsig, fmtNota, notaCls, kpi } from '../ui.js';

const paso = (n, t, s, href, cnt) => `<div class="paso"><span class="n">${n}</span><a href="${href}">
  <div><b>${t}</b><small>${s}</small></div>${cnt ? `<span class="cnt">${cnt}</span>` : ''}${icon('chev')}</a></div>`;

export default function inicio(el) {
  const g = P.global(), due = P.pendientesHoy(), r = racha();
  const fp = state.fallos.filter(f => f.estado === 'pendiente').length;
  const fr = state.fallos.length - fp;
  const sig = P.siguienteTema();
  const exs = P.proximosExamenes(1), trs = P.trabajosPendientes(1), ag = P.agenda(4);
  const notas = [...state.notas].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 3);
  const dias = P.resumenDias(3);

  el.innerHTML = `
  <header class="cab"><h1>Bienvenido de nuevo, Gonzaloading</h1>
    <p>${fechaLarga()}${exs[0] ? ` · Próximo examen: <b>${esc(nombreAsig(exs[0].asig))}</b> ${diasTxt(exs[0].fecha)}` : ''}${trs[0] ? ` · Próxima entrega: <b>${esc(trs[0].titulo)}</b> ${trs[0].fecha < hoy() ? 'venció ' : ''}${diasTxt(trs[0].fecha)}` : ''}</p></header>

  <section class="kpis">
    ${kpi('book', 'Teoría estudiada', g.teoria + '%', barra(g.teoria))}
    ${kpi('target', 'Dominio', g.dominio + '%', barra(g.dominio))}
    ${kpi('flame', 'Racha', `${r} <small>${r === 1 ? 'día' : 'días'}</small>`, `<span class="tenue">Mejor racha: ${mejorRacha()}</span>`, 'fuego')}
    ${kpi('calendar', 'Repasos hoy', due.length, due.length ? `<a class="link" href="#/repaso?modo=recordar">Empezar ${icon('chev')}</a>` : '<span class="tenue">Todo al día</span>')}
  </section>

  <div class="home">
    <div>
      <div class="sec-h">
        <div><h2>Asignaturas</h2><p>Toda la teoría disponible · Prioridad para ordenar tu estudio</p></div>
        <a class="btn lima" href="${sig ? `#/asignatura/${sig.asig}/${sig.id}` : '#/repaso?modo=practicar'}">${icon('play')} Continuar estudiando</a>
      </div>
      ${sig ? `<p class="sugerido">Siguiente recomendado: <b>${esc(sig.titulo)}</b> · ${esc(nombreAsig(sig.asig))} ${prio(sig.prioridad)}</p>` : ''}
      <div class="asigs">${cat.asignaturas.map(a => tarjetaAsig(a)).join('')}</div>

      <div class="duo">
        <section class="card pad mini-lista">
          <div class="panel-h">${icon('calcheck')}<div><h3>Exámenes y entregas</h3></div></div>
          ${ag.length ? ag.map(e => `<div class="it">${asigIcon(cat.porId[e.asig], 'peq')}<div class="tt"><span class="chip-tipo ${e.clase}">${e.clase === 'trabajo' ? 'Trabajo' : 'Examen'}</span><b>${esc(e.titulo)}</b><small>${esc(nombreAsig(e.asig))} · ${fechaCorta(e.fecha)}</small></div>
            <span class="cuenta ${diasEntre(hoy(), e.fecha) <= 7 ? 'urg' : ''}">${e.fecha < hoy() ? 'Venció ' : ''}${diasTxt(e.fecha)}</span></div>`).join('')
            : '<p class="vacio">No hay exámenes ni trabajos apuntados.</p>'}
          <a class="link" href="#/examenes">Ver calendario ${icon('chev')}</a>
        </section>
        <section class="card pad mini-lista">
          <div class="panel-h">${icon('grad')}<div><h3>Últimas notas</h3></div></div>
          ${notas.length ? notas.map(n => `<div class="it">${asigIcon(cat.porId[n.asig], 'peq')}<div class="tt"><b>${esc(n.concepto)}</b><small>${esc(nombreAsig(n.asig))} · ${fechaCorta(n.fecha)}</small></div>
            <span class="nota-v ${notaCls(n.nota)}">${fmtNota(n.nota)}</span></div>`).join('')
            : '<p class="vacio">Todavía no has apuntado notas.</p>'}
          <a class="link" href="#/notas">Ver registro de notas ${icon('chev')}</a>
        </section>
      </div>
    </div>

    <aside class="home-der">
      <section class="card pad">
        <div class="panel-h">${icon('calendar')}<div><h3>Plan de repaso de hoy</h3><p>3 pasos para afianzar lo estudiado</p></div></div>
        <div class="pasos">
          ${paso(1, 'Recordar sin mirar', due.length ? 'Repasa los conceptos clave.' : 'Nada pendiente hoy.', '#/repaso?modo=recordar', due.length)}
          ${paso(2, 'Revisar fallos', fp ? 'Vuelve a las preguntas que fallaste.' : 'Sin fallos pendientes 🎉', '#/repaso?modo=fallos', fp)}
          ${paso(3, 'Practicar', 'Aplica lo aprendido con preguntas mezcladas.', '#/repaso?modo=practicar')}
        </div>
      </section>

      <section class="card pad">
        <div class="panel-h">${icon('xcircle')}<div><h3>Mis fallos</h3></div></div>
        <a class="fila mal" href="#/fallos">${icon('x')}<span>Pendientes</span><em>${fp}</em>${icon('chev')}</a>
        <a class="fila bien" href="#/fallos?ver=recuperado">${icon('check')}<span>Recuperados</span><em>${fr}</em>${icon('chev')}</a>
      </section>

      <section class="card pad">
        <div class="panel-h">${icon('bars')}<div><h3>Historial</h3><p>Últimas sesiones y progreso</p></div></div>
        ${dias.length ? dias.map(d => `<a class="hist-item" href="#/historial">${icon('calendar')}
          <div><b>${fechaRel(d.fecha)}</b><small>${esc(d.asigs.map(nombreAsig).join(', '))}</small></div>
          ${d.delta > 0 ? `<span class="delta">+${d.delta}%</span>` : `<span class="delta cero">${d.items.length} act.</span>`}</a>`).join('')
          : '<p class="vacio">Aquí aparecerán tus sesiones de estudio.</p>'}
      </section>
    </aside>
  </div>`;
}
